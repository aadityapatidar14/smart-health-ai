const pool = require("../config/db");

// Get all alerts joined with health centre names
const getAllAlerts = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                a.id,
                a.health_centre_id,
                hc.name AS health_centre_name,
                a.alert_type,
                a.severity,
                a.message,
                a.is_resolved,
                a.created_at,
                a.resolved_at
            FROM alerts a
            JOIN health_centres hc ON a.health_centre_id = hc.id
            ORDER BY a.is_resolved ASC, a.created_at DESC;
        `;
        const result = await pool.query(queryText);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getAllAlerts Error:", error);
        res.status(500).json({
            message: "Failed to fetch alerts."
        });
    }
};

// Get details of a specific alert by ID
const getAlertById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("SELECT * FROM alerts WHERE id = $1;", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Alert not found."
            });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("getAlertById Error:", error);
        res.status(500).json({
            message: "Failed to fetch alert details."
        });
    }
};

// Create a new operational alert
const createAlert = async (req, res) => {
    const { health_centre_id, alert_type, severity, message } = req.body;

    if (!health_centre_id || !alert_type || !severity || !message) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    try {
        const result = await pool.query(`
            INSERT INTO alerts (health_centre_id, alert_type, severity, message, is_resolved)
            VALUES ($1, $2, $3, $4, FALSE)
            RETURNING *;
        `, [health_centre_id, alert_type, severity, message]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("createAlert Error:", error);
        res.status(500).json({
            message: "Failed to create alert.",
            error: error.message
        });
    }
};

// Update an alert (with automatic resolved_at timestamp mapping)
const updateAlert = async (req, res) => {
    const { id } = req.params;
    const { health_centre_id, alert_type, severity, message, is_resolved } = req.body;

    if (!health_centre_id || !alert_type || !severity || !message) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    let resolvedAtExpr = null;
    if (is_resolved === true) {
        resolvedAtExpr = new Date();
    }

    try {
        const result = await pool.query(`
            UPDATE alerts
            SET health_centre_id = $1, alert_type = $2, severity = $3, message = $4, 
                is_resolved = $5, resolved_at = $6
            WHERE id = $7
            RETURNING *;
        `, [health_centre_id, alert_type, severity, message, is_resolved, resolvedAtExpr, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Alert not found."
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("updateAlert Error:", error);
        res.status(500).json({
            message: "Failed to update alert.",
            error: error.message
        });
    }
};

// Delete an alert
const deleteAlert = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM alerts WHERE id = $1 RETURNING *;", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Alert not found."
            });
        }
        res.status(200).json({
            message: "Alert deleted successfully.",
            alert: result.rows[0]
        });
    } catch (error) {
        console.error("deleteAlert Error:", error);
        res.status(500).json({
            message: "Failed to delete alert."
        });
    }
};

module.exports = {
    getAllAlerts,
    getAlertById,
    createAlert,
    updateAlert,
    deleteAlert
};
