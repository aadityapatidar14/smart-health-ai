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
    const { health_centre_id, name, phone_number, location, admission_reason, status } = req.body;
    const actor = req.user;

    if (!health_centre_id || !name || !phone_number || !admission_reason) {
        return res.status(400).json({
            message: "Health centre, name, phone number, and admission reason are required."
        });
    }

    try {
        const result = await pool.query(`
            INSERT INTO patients (health_centre_id, name, phone_number, location, admission_reason, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `, [health_centre_id, name, phone_number, location, admission_reason, status || 'Admitted']);

        const newPatient = result.rows[0];

        // Log audit event
        await logAuditEvent(
            actor.id,
            actor.name || 'User',
            actor.email || 'user@smarthealth.gov.in',
            'CREATE_PATIENT',
            { body: newPatient, params: {}, response: { message: "Patient registered successfully." } }
        );

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
    const { health_centre_id, name, phone_number, location, admission_reason, status } = req.body;
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
                SET health_centre_id = $1, name = $2, phone_number = $3, location = $4, admission_reason = $5, status = $6, discharge_date = $7
                WHERE id = $8
                RETURNING *;
            `, [health_centre_id, name, phone_number, location, admission_reason, status, dischargeDateUpdate, id]);
        } else {
            result = await pool.query(`
                UPDATE patients
                SET health_centre_id = $1, name = $2, phone_number = $3, location = $4, admission_reason = $5, status = $6
                WHERE id = $7
                RETURNING *;
            `, [health_centre_id, name, phone_number, location, admission_reason, status, id]);
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
