const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access Denied. No token provided."
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Access Denied. Empty token provided."
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user details to request object
        
        next(); // Proceed to controller

    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({
            message: "Invalid or expired token."
        });
    }
};

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required."
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Role '${req.user.role}' is not authorized to modify this resource.`
            });
        }
        next();
    };
};

const checkHealthCentreOwnership = (tableName, idParamName = "id", idColumnName = "id") => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required." });
        }

        // DistrictAdmin has master access and bypasses health centre checks
        if (req.user.role === "DistrictAdmin") {
            return next();
        }

        const userCentreId = req.user.healthCentreId;
        if (!userCentreId) {
            return res.status(403).json({
                message: "Access denied. User is not assigned to any health centre."
            });
        }

        // 1. For POST (Creation)
        if (req.method === "POST") {
            const bodyCentreId = req.body.health_centre_id;
            if (bodyCentreId && Number(bodyCentreId) !== Number(userCentreId)) {
                return res.status(403).json({
                    message: "Access denied. You can only create resources for your own health centre."
                });
            }
            return next();
        }

        // 2. For PUT/DELETE (Mutation of existing record)
        const resourceId = req.params[idParamName];
        if (!resourceId) {
            return next();
        }

        try {
            let queryText;
            let queryParams;
            
            // Special queries depending on table structure
            if (tableName === "doctors") {
                queryText = `
                    SELECT u.health_centre_id 
                    FROM doctors d 
                    JOIN users u ON d.user_id = u.id 
                    WHERE d.id = $1
                `;
                queryParams = [resourceId];
            } else if (tableName === "health_centres") {
                // If checking the centre itself, we compare the centre's id to user's assigned healthCentreId
                queryText = `SELECT id AS health_centre_id FROM health_centres WHERE id = $1`;
                queryParams = [resourceId];
            } else if (tableName === "redistribution_recommendations") {
                // For redistribution recommendations, we verify that the user belongs to either source or destination
                queryText = `SELECT source_centre_id, destination_centre_id FROM redistribution_recommendations WHERE id = $1`;
                queryParams = [resourceId];
            } else {
                queryText = `SELECT health_centre_id FROM ${tableName} WHERE ${idColumnName} = $1`;
                queryParams = [resourceId];
            }

            const result = await pool.query(queryText, queryParams);
            if (result.rows.length === 0) {
                return res.status(404).json({ message: "Resource not found." });
            }

            if (tableName === "redistribution_recommendations") {
                const { source_centre_id, destination_centre_id } = result.rows[0];
                if (Number(source_centre_id) !== Number(userCentreId) && Number(destination_centre_id) !== Number(userCentreId)) {
                    return res.status(403).json({
                        message: "Access denied. You can only approve/reject recommendations involving your own health centre."
                    });
                }
            } else {
                const resourceCentreId = result.rows[0].health_centre_id;
                if (resourceCentreId && Number(resourceCentreId) !== Number(userCentreId)) {
                    return res.status(403).json({
                        message: "Access denied. You can only modify resources belonging to your own health centre."
                    });
                }
            }

            // Also check req.body if it's a PUT request to prevent changing the health_centre_id to another centre
            if (req.method === "PUT" && req.body.health_centre_id) {
                if (Number(req.body.health_centre_id) !== Number(userCentreId)) {
                    return res.status(403).json({
                        message: "Access denied. You cannot assign resources to a different health centre."
                    });
                }
            }

            next();
        } catch (error) {
            console.error(`Ownership check error for ${tableName}:`, error);
            res.status(500).json({ message: "Server error during permission validation checks." });
        }
    };
};

const logAudit = async (userId, userName, userEmail, action, details) => {
    try {
        await pool.query(
            `INSERT INTO audit_logs (user_id, user_name, user_email, action, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, userName, userEmail, action, typeof details === "object" ? JSON.stringify(details) : details]
        );
    } catch (err) {
        console.error("Failed to write audit log:", err);
    }
};

const createNotification = async (healthCentreId, title, message, type) => {
    try {
        await pool.query(
            `INSERT INTO notifications (health_centre_id, title, message, type)
             VALUES ($1, $2, $3, $4)`,
            [healthCentreId, title, message, type]
        );
        // Print Simulated Email
        console.log(`\n==================================================`);
        console.log(`[SIMULATED EMAIL SENT]`);
        console.log(`To: manager@smarthealth.gov.in`);
        console.log(`Subject: SMART HEALTH ALERT - ${title}`);
        console.log(`Message:\n${message}`);
        console.log(`==================================================\n`);
    } catch (err) {
        console.error("Failed to create notification:", err);
    }
};

const logAuditRoute = (action) => {
    return (req, res, next) => {
        const originalJson = res.json;
        res.json = function (data) {
            // Only log if successful
            if (res.statusCode >= 200 && res.statusCode < 300) {
                if (req.user) {
                    // Log audit
                    logAudit(
                        req.user.id,
                        req.user.name,
                        req.user.email,
                        action,
                        {
                            params: req.params,
                            body: req.body,
                            response: data
                        }
                    );

                    // Notification Trigger 1: Critical / High Alert filed
                    if ((action === "CREATE_ALERT" || action === "UPDATE_ALERT") && data) {
                        const alert = data.alert || data; // handle nested response
                        if (alert.severity === "Critical" || alert.severity === "High") {
                            createNotification(
                                alert.health_centre_id,
                                `${alert.severity} Alert Filed: ${alert.alert_type}`,
                                `A ${alert.severity.toLowerCase()} severity alert has been logged for this facility. Details: ${alert.message}`,
                                "CriticalAlert"
                            );
                        }
                    }

                    // Notification Trigger 2: Stock Level below minimum required
                    if ((action === "UPDATE_STOCK" || action === "CREATE_STOCK") && data) {
                        const stock = data;
                        if (stock.current_stock <= stock.min_required_stock) {
                            pool.query("SELECT name FROM medicines WHERE id = $1", [stock.medicine_id])
                                .then(medRes => {
                                    const medName = medRes.rows[0]?.name || "Unknown Medicine";
                                    // 1. Create real-time notification
                                    createNotification(
                                        stock.health_centre_id,
                                        `Low Stock Alert: ${medName}`,
                                        `The safety stock level for this medicine has fallen to ${stock.current_stock} (Minimum required: ${stock.min_required_stock}). Please reorder immediately.`,
                                        "LowStock"
                                    );
                                    // 2. Create database operational alert so it appears in Alerts Tab
                                    pool.query(`
                                        INSERT INTO alerts (health_centre_id, alert_type, severity, message, is_resolved)
                                        VALUES ($1, $2, $3, $4, false)
                                    `, [
                                        stock.health_centre_id,
                                        'Low Stock',
                                        'High',
                                        `Low Stock Alert: ${medName}. Current stock: ${stock.current_stock} (Minimum required: ${stock.min_required_stock}). Please reorder immediately.`
                                    ]).catch(alertErr => console.error("Error inserting low stock alert record:", alertErr));
                                })
                                .catch(err => console.error("Error fetching medicine name for notification:", err));
                        }
                    }
                }
            }
            return originalJson.call(this, data);
        };
        next();
    };
};

module.exports = {
    authMiddleware,
    authorizeRoles,
    checkHealthCentreOwnership,
    logAudit,
    createNotification,
    logAuditRoute
};

