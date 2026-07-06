const pool = require("../config/db");

// Get all test availability joined with health centre and diagnostic test catalog details
const getAllTests = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                ta.id,
                ta.health_centre_id,
                hc.name AS health_centre_name,
                ta.test_id,
                dt.name AS test_name,
                dt.category AS test_category,
                ta.is_available,
                ta.daily_capacity,
                ta.status_notes,
                ta.last_updated
            FROM test_availability ta
            JOIN health_centres hc ON ta.health_centre_id = hc.id
            JOIN diagnostic_tests dt ON ta.test_id = dt.id
            ORDER BY hc.name, dt.name;
        `;
        const result = await pool.query(queryText);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getAllTests Error:", error);
        res.status(500).json({
            message: "Failed to fetch diagnostic tests availability."
        });
    }
};

// Get all diagnostic test catalog categories
const getTestsCatalog = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM diagnostic_tests ORDER BY name;");
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getTestsCatalog Error:", error);
        res.status(500).json({
            message: "Failed to fetch diagnostic tests catalog."
        });
    }
};

// Get single test availability by ID
const getTestById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("SELECT * FROM test_availability WHERE id = $1;", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Test availability record not found."
            });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("getTestById Error:", error);
        res.status(500).json({
            message: "Failed to fetch test availability details."
        });
    }
};

// Add a new test availability record
const createTest = async (req, res) => {
    const { health_centre_id, test_id, is_available, daily_capacity, status_notes } = req.body;

    if (!health_centre_id || !test_id || is_available === undefined || daily_capacity === undefined) {
        return res.status(400).json({
            message: "Health centre, test type, availability status, and daily capacity are required."
        });
    }

    try {
        const result = await pool.query(`
            INSERT INTO test_availability (health_centre_id, test_id, is_available, daily_capacity, status_notes, last_updated)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            RETURNING *;
        `, [
            health_centre_id, 
            test_id, 
            is_available, 
            daily_capacity, 
            status_notes || null
        ]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("createTest Error:", error);
        if (error.code === "23505") { // Unique constraint: uq_centre_test
            return res.status(409).json({
                message: "Availability record for this diagnostic test is already registered at this health centre."
            });
        }
        res.status(500).json({
            message: "Failed to register test availability record.",
            error: error.message
        });
    }
};

// Update an existing test availability record
const updateTest = async (req, res) => {
    const { id } = req.params;
    const { is_available, daily_capacity, status_notes } = req.body;

    if (is_available === undefined || daily_capacity === undefined) {
        return res.status(400).json({
            message: "Availability status and daily capacity are required."
        });
    }

    try {
        const result = await pool.query(`
            UPDATE test_availability
            SET is_available = $1, daily_capacity = $2, status_notes = $3, last_updated = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *;
        `, [
            is_available, 
            daily_capacity, 
            status_notes || null, 
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Test availability record not found."
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("updateTest Error:", error);
        res.status(500).json({
            message: "Failed to update test availability record.",
            error: error.message
        });
    }
};

// Delete a test availability record
const deleteTest = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM test_availability WHERE id = $1 RETURNING *;", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Test availability record not found."
            });
        }
        res.status(200).json({
            message: "Test availability record deleted successfully.",
            test: result.rows[0]
        });
    } catch (error) {
        console.error("deleteTest Error:", error);
        res.status(500).json({
            message: "Failed to delete test availability record."
        });
    }
};

module.exports = {
    getAllTests,
    getTestsCatalog,
    getTestById,
    createTest,
    updateTest,
    deleteTest
};
