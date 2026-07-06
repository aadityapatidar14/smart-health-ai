const pool = require("../config/db");

// Get all health centres
const getAllCentres = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                name,
                type,
                district_id,
                address,
                pincode,
                contact_no
            FROM health_centres
            ORDER BY name;
        `);

        res.status(200).json(result.rows);

    } catch (error) {
        console.error("getAllCentres Error:", error);
        res.status(500).json({
            message: "Failed to fetch health centres."
        });
    }
};

// Get a single health centre by ID
const getCentreById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT * FROM health_centres WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Health centre not found."
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("getCentreById Error:", error);
        res.status(500).json({
            message: "Failed to fetch health centre details."
        });
    }
};

// Create a new health centre
const createCentre = async (req, res) => {
    const { name, type, district_id, address, pincode, contact_no } = req.body;

    if (!name || !type || !district_id) {
        return res.status(400).json({
            message: "Name, type, and district ID are required."
        });
    }

    if (pincode && !/^[0-9]{6}$/.test(pincode)) {
        return res.status(400).json({
            message: "Pincode must be exactly 6 digits."
        });
    }

    try {
        const result = await pool.query(`
            INSERT INTO health_centres 
            (name, type, district_id, address, pincode, contact_no)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [name, type, district_id, address, pincode, contact_no]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("createCentre Error:", error);
        res.status(500).json({
            message: "Failed to create health centre.",
            error: error.message
        });
    }
};

// Update an existing health centre
const updateCentre = async (req, res) => {
    const { id } = req.params;
    const { name, type, district_id, address, pincode, contact_no } = req.body;

    if (!name || !type || !district_id) {
        return res.status(400).json({
            message: "Name, type, and district ID are required."
        });
    }

    if (pincode && !/^[0-9]{6}$/.test(pincode)) {
        return res.status(400).json({
            message: "Pincode must be exactly 6 digits."
        });
    }

    try {
        const result = await pool.query(`
            UPDATE health_centres 
            SET name = $1, type = $2, district_id = $3, address = $4, pincode = $5, 
                contact_no = $6
            WHERE id = $7
            RETURNING *
        `, [name, type, district_id, address, pincode, contact_no, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Health centre not found."
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("updateCentre Error:", error);
        res.status(500).json({
            message: "Failed to update health centre.",
            error: error.message
        });
    }
};

// Delete a health centre
const deleteCentre = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            DELETE FROM health_centres WHERE id = $1 RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Health centre not found."
            });
        }

        res.status(200).json({
            message: "Health centre deleted successfully.",
            centre: result.rows[0]
        });
    } catch (error) {
        console.error("deleteCentre Error:", error);
        res.status(500).json({
            message: "Failed to delete health centre."
        });
    }
};

module.exports = {
    getAllCentres,
    getCentreById,
    createCentre,
    updateCentre,
    deleteCentre
};