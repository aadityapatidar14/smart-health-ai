const pool = require("../config/db");

// Helper to log audit events
const logAuditEvent = async (userId, userName, userEmail, action, details) => {
    try {
        await pool.query(`
            INSERT INTO audit_logs (user_id, user_name, user_email, action, details)
            VALUES ($1, $2, $3, $4, $5);
        `, [userId, userName, userEmail, action, JSON.stringify(details)]);
    } catch (e) {
        console.error("Failed to log audit event:", e.message);
    }
};

// Helper to evaluate and trigger disease outbreak alerts
const checkOutbreakAlert = async (healthCentreId, disease) => {
    if (!disease || disease === "Other / Non-Infectious") return;

    try {
        // 1. Get latitude and longitude of current health centre
        const hcRes = await pool.query(`
            SELECT name, latitude, longitude FROM health_centres WHERE id = $1;
        `, [healthCentreId]);
        if (hcRes.rows.length === 0) return;
        
        const currentCentre = hcRes.rows[0];
        const { latitude, longitude, name: currentCentreName } = currentCentre;

        if (latitude === null || longitude === null) {
            console.log(`Skipping outbreak check for ${currentCentreName} due to missing coordinates.`);
            return;
        }

        // 2. Count admitted cases of this disease at the current centre over last 14 days
        const countRes = await pool.query(`
            SELECT COUNT(*) AS count 
            FROM patients 
            WHERE health_centre_id = $1 
              AND disease = $2 
              AND status = 'Admitted' 
              AND admission_date >= NOW() - INTERVAL '14 days';
        `, [healthCentreId, disease]);
        const currentCount = parseInt(countRes.rows[0].count, 10);

        // Threshold check: We only evaluate alerts if we have at least 3 cases in the 14-day window
        if (currentCount < 3) return;

        // 3. Compute district average cases of this disease per health centre over last 14 days
        const avgRes = await pool.query(`
            SELECT COALESCE(COUNT(*), 0)::float / (SELECT COUNT(*) FROM health_centres) AS avg_count
            FROM patients
            WHERE disease = $1
              AND status = 'Admitted'
              AND admission_date >= NOW() - INTERVAL '14 days';
        `, [disease]);
        const districtAvg = parseFloat(avgRes.rows[0].avg_count) || 0;

        // 4. Trigger alert if current count >= 3 AND is greater than 1.5x the district average
        if (currentCount >= 3 && (districtAvg === 0 || currentCount > 1.5 * districtAvg)) {
            // Find the nearest health centre with valid coordinates
            const nearestRes = await pool.query(`
                SELECT id, name, latitude, longitude
                FROM health_centres 
                WHERE id != $1 
                  AND latitude IS NOT NULL 
                  AND longitude IS NOT NULL
                ORDER BY (latitude - $2)^2 + (longitude - $3)^2 ASC
                LIMIT 1;
            `, [healthCentreId, latitude, longitude]);

            if (nearestRes.rows.length > 0) {
                const nearestCentre = nearestRes.rows[0];

                // 5. Anti-Spam filter: check if alert already sent to the nearest centre in the last 3 days
                const antiSpamRes = await pool.query(`
                    SELECT COUNT(*) AS count
                    FROM notifications
                    WHERE health_centre_id = $1
                      AND title LIKE $2
                      AND created_at >= NOW() - INTERVAL '3 days';
                `, [nearestCentre.id, `%Outbreak Warning: Spike in ${disease}%`]);
                
                const alreadyAlerted = parseInt(antiSpamRes.rows[0].count, 10) > 0;

                if (!alreadyAlerted) {
                    const alertTitle = `Outbreak Warning: Spike in ${disease} nearby`;
                    const alertMessage = `High-risk notification: ${currentCentreName} has registered ${currentCount} cases of ${disease} in the last 14 days (District Average: ${districtAvg.toFixed(1)}). Please monitor incoming patient symptoms closely.`;
                    
                    await pool.query(`
                        INSERT INTO notifications (health_centre_id, title, message, type, is_read)
                        VALUES ($1, $2, $3, 'CriticalAlert', FALSE);
                    `, [nearestCentre.id, alertTitle, alertMessage]);
                    
                    console.log(`[OUTBREAK ALERT] Warning notification sent to ${nearestCentre.name} due to ${currentCount} cases of ${disease} at ${currentCentreName}.`);
                }
            }
        }
    } catch (err) {
        console.error("checkOutbreakAlert Error:", err);
    }
};

// Get all patient admissions
const getAllPatients = async (req, res) => {
    const { role, healthCentreId } = req.user;
    try {
        let queryText = `
            SELECT 
                p.id,
                p.health_centre_id,
                hc.name AS health_centre_name,
                p.name,
                p.phone_number,
                p.location,
                p.admission_reason,
                p.disease,
                p.status,
                p.admission_date,
                p.discharge_date
            FROM patients p
            JOIN health_centres hc ON p.health_centre_id = hc.id
        `;
        const queryParams = [];

        // If the user has a specific facility role, restrict to their centre only
        if (role !== "DistrictAdmin" && role !== "Citizen" && healthCentreId) {
            queryText += ` WHERE p.health_centre_id = $1`;
            queryParams.push(healthCentreId);
        }

        queryText += ` ORDER BY p.admission_date DESC;`;

        const result = await pool.query(queryText, queryParams);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getAllPatients Error:", error);
        res.status(500).json({
            message: "Failed to fetch patients list."
        });
    }
};

// Get single patient by ID
const getPatientById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("SELECT * FROM patients WHERE id = $1;", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Patient record not found."
            });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("getPatientById Error:", error);
        res.status(500).json({
            message: "Failed to fetch patient details."
        });
    }
};

// Create a new patient admission
const createPatient = async (req, res) => {
    const { health_centre_id, name, phone_number, location, admission_reason, disease, status } = req.body;
    const actor = req.user;

    if (!health_centre_id || !name || !phone_number || !admission_reason) {
        return res.status(400).json({
            message: "Health centre, name, phone number, and admission reason are required."
        });
    }

    try {
        const result = await pool.query(`
            INSERT INTO patients (health_centre_id, name, phone_number, location, admission_reason, disease, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `, [health_centre_id, name, phone_number, location, admission_reason, disease || 'Other / Non-Infectious', status || 'Admitted']);

        const newPatient = result.rows[0];

        // Log audit event
        await logAuditEvent(
            actor.id,
            actor.name || 'User',
            actor.email || 'user@smarthealth.gov.in',
            'CREATE_PATIENT',
            { body: newPatient, params: {}, response: { message: "Patient registered successfully." } }
        );

        // Outbreak detection check
        if (newPatient.status === "Admitted") {
            // Run in background to not block response
            checkOutbreakAlert(newPatient.health_centre_id, newPatient.disease);
        }

        res.status(201).json(newPatient);
    } catch (error) {
        console.error("createPatient Error:", error);
        res.status(500).json({
            message: "Failed to register patient admission.",
            error: error.message
        });
    }
};

// Update an existing patient's details
const updatePatient = async (req, res) => {
    const { id } = req.params;
    const { health_centre_id, name, phone_number, location, admission_reason, disease, status } = req.body;
    const actor = req.user;

    if (!health_centre_id || !name || !phone_number || !admission_reason || !status) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    try {
        // Find existing patient to check status change
        const currentRes = await pool.query("SELECT status FROM patients WHERE id = $1;", [id]);
        if (currentRes.rows.length === 0) {
            return res.status(404).json({
                message: "Patient record not found."
            });
        }

        const currentStatus = currentRes.rows[0].status;
        let dischargeDateUpdate = null;

        // If status changes to Discharged, set discharge date
        if (status === "Discharged" && currentStatus !== "Discharged") {
            dischargeDateUpdate = new Date();
        }

        let result;
        if (dischargeDateUpdate) {
            result = await pool.query(`
                UPDATE patients
                SET health_centre_id = $1, name = $2, phone_number = $3, location = $4, admission_reason = $5, disease = $6, status = $7, discharge_date = $8
                WHERE id = $9
                RETURNING *;
            `, [health_centre_id, name, phone_number, location, admission_reason, disease || 'Other / Non-Infectious', status, dischargeDateUpdate, id]);
        } else {
            result = await pool.query(`
                UPDATE patients
                SET health_centre_id = $1, name = $2, phone_number = $3, location = $4, admission_reason = $5, disease = $6, status = $7
                WHERE id = $8
                RETURNING *;
            `, [health_centre_id, name, phone_number, location, admission_reason, disease || 'Other / Non-Infectious', status, id]);
        }

        const updatedPatient = result.rows[0];

        // Log audit event
        await logAuditEvent(
            actor.id,
            actor.name || 'User',
            actor.email || 'user@smarthealth.gov.in',
            'UPDATE_PATIENT',
            { body: { name, status, health_centre_id }, params: { id }, response: { message: "Patient details updated successfully." } }
        );

        // Outbreak detection check if admitted
        if (updatedPatient.status === "Admitted") {
            checkOutbreakAlert(updatedPatient.health_centre_id, updatedPatient.disease);
        }

        res.status(200).json(updatedPatient);
    } catch (error) {
        console.error("updatePatient Error:", error);
        res.status(500).json({
            message: "Failed to update patient details.",
            error: error.message
        });
    }
};

// Delete a patient record
const deletePatient = async (req, res) => {
    const { id } = req.params;
    const actor = req.user;

    try {
        const checkRes = await pool.query("SELECT name, health_centre_id FROM patients WHERE id = $1;", [id]);
        if (checkRes.rows.length === 0) {
            return res.status(404).json({
                message: "Patient record not found."
            });
        }

        const target = checkRes.rows[0];

        await pool.query("DELETE FROM patients WHERE id = $1;", [id]);

        // Log audit event
        await logAuditEvent(
            actor.id,
            actor.name || 'User',
            actor.email || 'user@smarthealth.gov.in',
            'DELETE_PATIENT',
            { body: {}, params: { id }, response: { message: "Patient record deleted successfully.", patient: target } }
        );

        res.status(200).json({
            message: "Patient record deleted successfully."
        });
    } catch (error) {
        console.error("deletePatient Error:", error);
        res.status(500).json({
            message: "Failed to delete patient record."
        });
    }
};

module.exports = {
    getAllPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient
};
