const pool = require("../config/db");

// Get all medicines
const getAllMedicines = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM medicines ORDER BY name;");
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getAllMedicines Error:", error);
        res.status(500).json({
            message: "Failed to fetch medicines catalog."
        });
    }
};

// Get single medicine details by ID
const getMedicineById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("SELECT * FROM medicines WHERE id = $1;", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Medicine not found."
            });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("getMedicineById Error:", error);
        res.status(500).json({
            message: "Failed to fetch medicine details."
        });
    }
};

// Create a new medicine catalog entry
const createMedicine = async (req, res) => {
    const { name, generic_name, category, dosage_form } = req.body;

    if (!name || !generic_name || !category || !dosage_form) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    try {
        const result = await pool.query(`
            INSERT INTO medicines (name, generic_name, category, dosage_form)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `, [name, generic_name, category, dosage_form]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("createMedicine Error:", error);
        if (error.code === "23505") { // Unique constraint code
            return res.status(409).json({
                message: "A medicine with this name and dosage form already exists."
            });
        }
        res.status(500).json({
            message: "Failed to create medicine.",
            error: error.message
        });
    }
};

// Update an existing medicine entry
const updateMedicine = async (req, res) => {
    const { id } = req.params;
    const { name, generic_name, category, dosage_form } = req.body;

    if (!name || !generic_name || !category || !dosage_form) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    try {
        const result = await pool.query(`
            UPDATE medicines
            SET name = $1, generic_name = $2, category = $3, dosage_form = $4
            WHERE id = $5
            RETURNING *;
        `, [name, generic_name, category, dosage_form, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Medicine not found."
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("updateMedicine Error:", error);
        if (error.code === "23505") {
            return res.status(409).json({
                message: "A medicine with this name and dosage form already exists."
            });
        }
        res.status(500).json({
            message: "Failed to update medicine.",
            error: error.message
        });
    }
};

// Delete a medicine entry
const deleteMedicine = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM medicines WHERE id = $1 RETURNING *;", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Medicine not found."
            });
        }
        res.status(200).json({
            message: "Medicine deleted successfully.",
            medicine: result.rows[0]
        });
    } catch (error) {
        console.error("deleteMedicine Error:", error);
        res.status(500).json({
            message: "Failed to delete medicine."
        });
    }
};

module.exports = {
    getAllMedicines,
    getMedicineById,
    createMedicine,
    updateMedicine,
    deleteMedicine
};
