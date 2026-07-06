const pool = require("../config/db");

// Get all equipment inventory joined with health centre and equipment catalog details
const getAllEquipment = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                ei.id,
                ei.health_centre_id,
                hc.name AS health_centre_name,
                ei.equipment_id,
                e.name AS equipment_name,
                e.criticality,
                ei.serial_no,
                ei.status,
                ei.last_inspected_at,
                ei.notes
            FROM equipment_inventory ei
            JOIN health_centres hc ON ei.health_centre_id = hc.id
            JOIN equipments e ON ei.equipment_id = e.id
            ORDER BY hc.name, e.name;
        `;
        const result = await pool.query(queryText);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getAllEquipment Error:", error);
        res.status(500).json({
            message: "Failed to fetch equipment inventory."
        });
    }
};

// Get all equipment catalog categories from equipments master table
const getEquipmentCatalog = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM equipments ORDER BY name;");
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getEquipmentCatalog Error:", error);
        res.status(500).json({
            message: "Failed to fetch equipment catalog."
        });
    }
};

// Get single equipment inventory item by ID
const getEquipmentById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("SELECT * FROM equipment_inventory WHERE id = $1;", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Equipment inventory record not found."
            });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("getEquipmentById Error:", error);
        res.status(500).json({
            message: "Failed to fetch equipment inventory details."
        });
    }
};

// Add a new equipment inventory record
const createEquipment = async (req, res) => {
    const { health_centre_id, equipment_id, serial_no, status, last_inspected_at, notes } = req.body;

    if (!health_centre_id || !equipment_id || !serial_no || !status) {
        return res.status(400).json({
            message: "Health centre, equipment name, serial number, and status are required."
        });
    }

    try {
        const result = await pool.query(`
            INSERT INTO equipment_inventory (health_centre_id, equipment_id, serial_no, status, last_inspected_at, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `, [
            health_centre_id, 
            equipment_id, 
            serial_no, 
            status, 
            last_inspected_at || null, 
            notes || null
        ]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("createEquipment Error:", error);
        if (error.code === "23505") { // Unique constraint: uq_centre_equip_serial
            return res.status(409).json({
                message: "This equipment with the same serial number is already registered at this health centre."
            });
        }
        res.status(500).json({
            message: "Failed to register equipment inventory.",
            error: error.message
        });
    }
};

// Update an existing equipment inventory record
const updateEquipment = async (req, res) => {
    const { id } = req.params;
    const { serial_no, status, last_inspected_at, notes } = req.body;

    if (!serial_no || !status) {
        return res.status(400).json({
            message: "Serial number and status are required."
        });
    }

    try {
        const result = await pool.query(`
            UPDATE equipment_inventory
            SET serial_no = $1, status = $2, last_inspected_at = $3, notes = $4
            WHERE id = $5
            RETURNING *;
        `, [
            serial_no, 
            status, 
            last_inspected_at || null, 
            notes || null, 
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Equipment inventory record not found."
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("updateEquipment Error:", error);
        if (error.code === "23505") {
            return res.status(409).json({
                message: "Another equipment with this serial number is already registered at this health centre."
            });
        }
        res.status(500).json({
            message: "Failed to update equipment inventory record.",
            error: error.message
        });
    }
};

// Delete an equipment inventory record
const deleteEquipment = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM equipment_inventory WHERE id = $1 RETURNING *;", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Equipment inventory record not found."
            });
        }
        res.status(200).json({
            message: "Equipment inventory record deleted successfully.",
            equipment: result.rows[0]
        });
    } catch (error) {
        console.error("deleteEquipment Error:", error);
        res.status(500).json({
            message: "Failed to delete equipment inventory record."
        });
    }
};

module.exports = {
    getAllEquipment,
    getEquipmentCatalog,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    deleteEquipment
};
