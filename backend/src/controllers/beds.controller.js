const pool = require("../config/db");

// Get all beds joined with their health centre names
const getAllBeds = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                b.id,
                b.health_centre_id,
                hc.name AS health_centre_name,
                b.ward_name,
                b.bed_type,
                b.status,
                b.bed_number
            FROM beds b
            JOIN health_centres hc ON b.health_centre_id = hc.id
            ORDER BY hc.name, b.ward_name, b.bed_number;
        `;
        const result = await pool.query(queryText);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getAllBeds Error:", error);
        res.status(500).json({
            message: "Failed to fetch beds."
        });
    }
};

// Get single bed details by ID
const getBedById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("SELECT * FROM beds WHERE id = $1;", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Bed not found."
            });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("getBedById Error:", error);
        res.status(500).json({
            message: "Failed to fetch bed details."
        });
    }
};

// Create a new bed
const createBed = async (req, res) => {
    const { health_centre_id, ward_name, bed_type, status, bed_number } = req.body;

    if (!health_centre_id || !ward_name || !bed_type || !status || !bed_number) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    try {
        const result = await pool.query(`
            INSERT INTO beds (health_centre_id, ward_name, bed_type, status, bed_number)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `, [health_centre_id, ward_name, bed_type, status, bed_number]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("createBed Error:", error);
        if (error.code === "23505") { // Unique constraint code (uq_centre_ward_bed)
            return res.status(409).json({
                message: "A bed with this number already exists in this ward."
            });
        }
        res.status(500).json({
            message: "Failed to create bed.",
            error: error.message
        });
    }
};

// Update an existing bed
const updateBed = async (req, res) => {
    const { id } = req.params;
    const { health_centre_id, ward_name, bed_type, status, bed_number } = req.body;

    if (!health_centre_id || !ward_name || !bed_type || !status || !bed_number) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    try {
        const result = await pool.query(`
            UPDATE beds
            SET health_centre_id = $1, ward_name = $2, bed_type = $3, status = $4, bed_number = $5
            WHERE id = $6
            RETURNING *;
        `, [health_centre_id, ward_name, bed_type, status, bed_number, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Bed not found."
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("updateBed Error:", error);
        if (error.code === "23505") {
            return res.status(409).json({
                message: "A bed with this number already exists in this ward."
            });
        }
        res.status(500).json({
            message: "Failed to update bed.",
            error: error.message
        });
    }
};

// Delete a bed
const deleteBed = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM beds WHERE id = $1 RETURNING *;", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Bed not found."
            });
        }
        res.status(200).json({
            message: "Bed deleted successfully.",
            bed: result.rows[0]
        });
    } catch (error) {
        console.error("deleteBed Error:", error);
        res.status(500).json({
            message: "Failed to delete bed."
        });
    }
};

module.exports = {
    getAllBeds,
    getBedById,
    createBed,
    updateBed,
    deleteBed
};
