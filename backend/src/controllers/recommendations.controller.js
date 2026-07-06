const pool = require("../config/db");

// Get all AI Redistribution Recommendations
const getAllRecommendations = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                rr.id,
                rr.source_centre_id,
                sc.name AS source_centre_name,
                rr.destination_centre_id,
                dc.name AS destination_centre_name,
                rr.medicine_id,
                m.name AS medicine_name,
                m.generic_name AS medicine_generic,
                rr.recommended_quantity,
                rr.status,
                rr.created_at,
                rr.updated_at
            FROM redistribution_recommendations rr
            JOIN health_centres sc ON rr.source_centre_id = sc.id
            JOIN health_centres dc ON rr.destination_centre_id = dc.id
            JOIN medicines m ON rr.medicine_id = m.id
            ORDER BY rr.status = 'Pending' DESC, rr.created_at DESC;
        `;
        const result = await pool.query(queryText);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getAllRecommendations Error:", error);
        res.status(500).json({
            message: "Failed to fetch redistribution recommendations."
        });
    }
};

// Approve redistribution recommendation (SQL Transaction)
const approveRecommendation = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Fetch recommendation details
        const recQuery = await client.query(`
            SELECT * FROM redistribution_recommendations WHERE id = $1;
        `, [id]);

        if (recQuery.rows.length === 0) {
            return res.status(404).json({ message: "Recommendation not found." });
        }

        const recommendation = recQuery.rows[0];

        if (recommendation.status !== "Pending") {
            return res.status(400).json({ 
                message: `This recommendation is already in status: ${recommendation.status}.` 
            });
        }

        const { source_centre_id, destination_centre_id, medicine_id, recommended_quantity } = recommendation;

        // 2. Check source inventory level
        const sourceInventoryQuery = await client.query(`
            SELECT current_stock FROM stock_inventory 
            WHERE health_centre_id = $1 AND medicine_id = $2;
        `, [source_centre_id, medicine_id]);

        if (sourceInventoryQuery.rows.length === 0) {
            return res.status(400).json({ 
                message: "Source health centre has no stock record for this medicine." 
            });
        }

        const sourceStock = sourceInventoryQuery.rows[0].current_stock;

        if (sourceStock < recommended_quantity) {
            return res.status(400).json({ 
                message: `Insufficient stock at source health centre to complete this transfer. Available: ${sourceStock}, Recommended: ${recommended_quantity}.` 
            });
        }

        // 3. Deduct from source health centre inventory
        await client.query(`
            UPDATE stock_inventory
            SET current_stock = current_stock - $1, last_updated = CURRENT_TIMESTAMP
            WHERE health_centre_id = $2 AND medicine_id = $3;
        `, [recommended_quantity, source_centre_id, medicine_id]);

        // 4. Add/upsert to destination health centre inventory
        await client.query(`
            INSERT INTO stock_inventory (health_centre_id, medicine_id, current_stock, min_required_stock, reorder_level, last_updated)
            VALUES ($1, $2, $3, 100, 50, CURRENT_TIMESTAMP)
            ON CONFLICT (health_centre_id, medicine_id)
            DO UPDATE SET current_stock = stock_inventory.current_stock + EXCLUDED.current_stock, last_updated = CURRENT_TIMESTAMP;
        `, [destination_centre_id, medicine_id, recommended_quantity]);

        // 5. Insert transaction log for Source (Redistribution_Out)
        await client.query(`
            INSERT INTO stock_transactions (health_centre_id, medicine_id, transaction_type, quantity, reference_id, notes)
            VALUES ($1, $2, 'Redistribution_Out', $3, $4, $5);
        `, [source_centre_id, medicine_id, recommended_quantity, id, `Redistribution to health centre ID: ${destination_centre_id}`]);

        // 6. Insert transaction log for Destination (Redistribution_In)
        await client.query(`
            INSERT INTO stock_transactions (health_centre_id, medicine_id, transaction_type, quantity, reference_id, notes)
            VALUES ($1, $2, 'Redistribution_In', $3, $4, $5);
        `, [destination_centre_id, medicine_id, recommended_quantity, id, `Redistribution from health centre ID: ${source_centre_id}`]);

        // 7. Update recommendation status to Completed
        const updateRecQuery = await client.query(`
            UPDATE redistribution_recommendations
            SET status = 'Completed', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `, [id]);

        await client.query("COMMIT");
        res.status(200).json({
            message: "Redistribution recommendation approved and executed successfully!",
            recommendation: updateRecQuery.rows[0]
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("approveRecommendation Error:", error);
        res.status(500).json({ 
            message: "Failed to approve recommendation.", 
            error: error.message 
        });
    } finally {
        client.release();
    }
};

// Reject redistribution recommendation
const rejectRecommendation = async (req, res) => {
    const { id } = req.params;
    try {
        const checkQuery = await pool.query("SELECT status FROM redistribution_recommendations WHERE id = $1;", [id]);
        if (checkQuery.rows.length === 0) {
            return res.status(404).json({ message: "Recommendation not found." });
        }
        if (checkQuery.rows[0].status !== "Pending") {
            return res.status(400).json({ 
                message: `Cannot reject. Current status is ${checkQuery.rows[0].status}.` 
            });
        }

        const result = await pool.query(`
            UPDATE redistribution_recommendations
            SET status = 'Rejected', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `, [id]);

        res.status(200).json({
            message: "Recommendation rejected.",
            recommendation: result.rows[0]
        });
    } catch (error) {
        console.error("rejectRecommendation Error:", error);
        res.status(500).json({ 
            message: "Failed to reject recommendation." 
        });
    }
};

// Get all AI Demand Forecasts
const getAllForecasts = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                df.id,
                df.health_centre_id,
                hc.name AS health_centre_name,
                df.medicine_id,
                m.name AS medicine_name,
                m.generic_name AS medicine_generic,
                df.forecast_date,
                df.forecasted_demand,
                df.confidence_interval_lower,
                df.confidence_interval_upper,
                df.created_at
            FROM demand_forecasts df
            JOIN health_centres hc ON df.health_centre_id = hc.id
            JOIN medicines m ON df.medicine_id = m.id
            ORDER BY df.forecast_date DESC, hc.name, m.name;
        `;
        const result = await pool.query(queryText);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getAllForecasts Error:", error);
        res.status(500).json({ 
            message: "Failed to fetch demand forecasts." 
        });
    }
};

module.exports = {
    getAllRecommendations,
    approveRecommendation,
    rejectRecommendation,
    getAllForecasts
};
