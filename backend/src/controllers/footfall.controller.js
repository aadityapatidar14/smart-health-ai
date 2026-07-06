const pool = require("../config/db");

// Get aggregated daily footfall data for all health centres
const getDailyFootfall = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                pf.date,
                pf.health_centre_id,
                hc.name AS health_centre_name,
                hc.type AS health_centre_type,
                SUM(pf.outpatient_count)::INT AS total_outpatients,
                SUM(pf.inpatient_count)::INT AS total_inpatients,
                SUM(pf.emergency_count)::INT AS total_emergencies,
                ROUND(AVG(pf.avg_waiting_time_mins))::INT AS avg_waiting_time
            FROM patient_footfall pf
            JOIN health_centres hc ON pf.health_centre_id = hc.id
            GROUP BY pf.date, pf.health_centre_id, hc.name, hc.type
            ORDER BY pf.date DESC, hc.name;
        `;
        const result = await pool.query(queryText);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getDailyFootfall Error:", error);
        res.status(500).json({
            message: "Failed to fetch daily patient footfall summaries."
        });
    }
};

// Get hourly footfall breakdown for a specific health centre and date
const getHourlyFootfall = async (req, res) => {
    const { health_centre_id, date } = req.query;

    if (!health_centre_id || !date) {
        return res.status(400).json({
            message: "health_centre_id and date parameters are required."
        });
    }

    try {
        const queryText = `
            SELECT 
                pf.id,
                pf.hourly_slot,
                pf.outpatient_count,
                pf.inpatient_count,
                pf.emergency_count,
                pf.avg_waiting_time_mins
            FROM patient_footfall pf
            WHERE pf.health_centre_id = $1 AND pf.date = $2
            ORDER BY pf.hourly_slot;
        `;
        const result = await pool.query(queryText, [health_centre_id, date]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getHourlyFootfall Error:", error);
        res.status(500).json({
            message: "Failed to fetch hourly footfall breakdown."
        });
    }
};

// Record a new hourly patient footfall entry
const createFootfall = async (req, res) => {
    const { health_centre_id, date, hourly_slot, outpatient_count, inpatient_count, emergency_count, avg_waiting_time_mins } = req.body;

    if (
        !health_centre_id || 
        !date || 
        hourly_slot === undefined || 
        outpatient_count === undefined || 
        inpatient_count === undefined || 
        emergency_count === undefined || 
        avg_waiting_time_mins === undefined
    ) {
        return res.status(400).json({
            message: "All fields including hourly slot, count parameters, and average waiting time are required."
        });
    }

    try {
        const result = await pool.query(`
            INSERT INTO patient_footfall (health_centre_id, date, hourly_slot, outpatient_count, inpatient_count, emergency_count, avg_waiting_time_mins)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `, [health_centre_id, date, hourly_slot, outpatient_count, inpatient_count, emergency_count, avg_waiting_time_mins]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("createFootfall Error:", error);
        if (error.code === "23505") { // Unique constraint: uq_centre_date_hour
            return res.status(409).json({
                message: "A footfall record for this hour slot is already registered on this date at this health centre."
            });
        }
        res.status(500).json({
            message: "Failed to create patient footfall record.",
            error: error.message
        });
    }
};

// Update an existing hourly footfall log
const updateFootfall = async (req, res) => {
    const { id } = req.params;
    const { outpatient_count, inpatient_count, emergency_count, avg_waiting_time_mins } = req.body;

    if (
        outpatient_count === undefined || 
        inpatient_count === undefined || 
        emergency_count === undefined || 
        avg_waiting_time_mins === undefined
    ) {
        return res.status(400).json({
            message: "Outpatient, inpatient, emergency counts, and average waiting time are required."
        });
    }

    try {
        const result = await pool.query(`
            UPDATE patient_footfall
            SET outpatient_count = $1, inpatient_count = $2, emergency_count = $3, avg_waiting_time_mins = $4
            WHERE id = $5
            RETURNING *;
        `, [outpatient_count, inpatient_count, emergency_count, avg_waiting_time_mins, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Patient footfall record not found."
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("updateFootfall Error:", error);
        res.status(500).json({
            message: "Failed to update patient footfall record.",
            error: error.message
        });
    }
};

// Delete an hourly footfall log
const deleteFootfall = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM patient_footfall WHERE id = $1 RETURNING *;", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Patient footfall record not found."
            });
        }
        res.status(200).json({
            message: "Patient footfall record deleted successfully.",
            footfall: result.rows[0]
        });
    } catch (error) {
        console.error("deleteFootfall Error:", error);
        res.status(500).json({
            message: "Failed to delete patient footfall record."
        });
    }
};

module.exports = {
    getDailyFootfall,
    getHourlyFootfall,
    createFootfall,
    updateFootfall,
    deleteFootfall
};
