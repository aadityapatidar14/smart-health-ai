const pool = require("../config/db");

// Get all inventory stock joined with health centre and medicine details
const getAllInventory = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                si.id,
                si.health_centre_id,
                hc.name AS health_centre_name,
                si.medicine_id,
                m.name AS medicine_name,
                m.generic_name AS medicine_generic,
                m.category AS medicine_category,
                si.current_stock,
                si.min_required_stock,
                si.reorder_level,
                si.last_updated
            FROM stock_inventory si
            JOIN health_centres hc ON si.health_centre_id = hc.id
            JOIN medicines m ON si.medicine_id = m.id
            ORDER BY hc.name, m.name;
        `;
        const result = await pool.query(queryText);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getAllInventory Error:", error);
        res.status(500).json({
            message: "Failed to fetch stock inventory."
        });
    }
};

// Get single inventory item by ID
const getInventoryById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("SELECT * FROM stock_inventory WHERE id = $1;", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Inventory record not found."
            });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("getInventoryById Error:", error);
        res.status(500).json({
            message: "Failed to fetch inventory record details."
        });
    }
};

// Add a new inventory stock record for a medicine at a health centre
const createInventory = async (req, res) => {
    const { health_centre_id, medicine_id, current_stock, min_required_stock, reorder_level } = req.body;

    if (
        health_centre_id === undefined ||
        medicine_id === undefined ||
        current_stock === undefined ||
        min_required_stock === undefined ||
        reorder_level === undefined
    ) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    try {
        const result = await pool.query(`
            INSERT INTO stock_inventory (health_centre_id, medicine_id, current_stock, min_required_stock, reorder_level, last_updated)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            RETURNING *;
        `, [health_centre_id, medicine_id, current_stock, min_required_stock, reorder_level]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("createInventory Error:", error);
        if (error.code === "23505") { // Unique constraint violation code (uq_centre_medicine)
            return res.status(409).json({
                message: "An inventory entry for this medicine already exists at this health centre."
            });
        }
        res.status(500).json({
            message: "Failed to create inventory record.",
            error: error.message
        });
    }
};

// Update an existing inventory record stock levels
const updateInventory = async (req, res) => {
    const { id } = req.params;
    const { current_stock, min_required_stock, reorder_level } = req.body;

    if (
        current_stock === undefined ||
        min_required_stock === undefined ||
        reorder_level === undefined
    ) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    try {
        const result = await pool.query(`
            UPDATE stock_inventory
            SET current_stock = $1, min_required_stock = $2, reorder_level = $3, last_updated = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *;
        `, [current_stock, min_required_stock, reorder_level, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Inventory record not found."
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("updateInventory Error:", error);
        res.status(500).json({
            message: "Failed to update inventory record.",
            error: error.message
        });
    }
};

// Delete an inventory stock record
const deleteInventory = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM stock_inventory WHERE id = $1 RETURNING *;", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Inventory record not found."
            });
        }
        res.status(200).json({
            message: "Inventory record deleted successfully.",
            inventory: result.rows[0]
        });
    } catch (error) {
        console.error("deleteInventory Error:", error);
        res.status(500).json({
            message: "Failed to delete inventory record."
        });
    }
};

module.exports = {
    getAllInventory,
    getInventoryById,
    createInventory,
    updateInventory,
    deleteInventory
};
