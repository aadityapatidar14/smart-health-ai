const pool = require("../config/db");

const getDashboardStats = async (req, res) => {
    const { health_centre_id } = req.query;
    try {
        let alertFilter = " WHERE is_resolved = FALSE";
        let bedFilter = "";
        let footfallFilter = "";
        let stockFilter = "";
        const queryParams = [];

        if (health_centre_id && health_centre_id !== "all") {
            queryParams.push(Number(health_centre_id));
            alertFilter = " WHERE is_resolved = FALSE AND health_centre_id = $1";
            bedFilter = " WHERE health_centre_id = $1";
            footfallFilter = " WHERE health_centre_id = $1";
            stockFilter = " WHERE health_centre_id = $1";
        }

        const totalCentres = await pool.query(
            "SELECT COUNT(*) FROM health_centres" + (health_centre_id && health_centre_id !== "all" ? " WHERE id = $1" : ""),
            queryParams
        );

        const totalDoctors = await pool.query(
            "SELECT COUNT(*) FROM doctors" + (health_centre_id && health_centre_id !== "all" ? " JOIN users u ON u.id = doctors.user_id WHERE u.health_centre_id = $1" : ""),
            queryParams
        );

        const availableBeds = await pool.query(
            "SELECT COUNT(*) FROM beds WHERE status = 'Available'" + (health_centre_id && health_centre_id !== "all" ? " AND health_centre_id = $1" : ""),
            queryParams
        );

        const activeAlerts = await pool.query(
            "SELECT COUNT(*) FROM alerts WHERE is_resolved = FALSE" + (health_centre_id && health_centre_id !== "all" ? " AND health_centre_id = $1" : ""),
            queryParams
        );

        const totalMedicines = await pool.query(
            "SELECT COUNT(*) FROM medicines"
        );

        // Detailed breakdowns for charts
        const bedBreakdown = await pool.query(
            `SELECT bed_type, status, COUNT(*)::int FROM beds${bedFilter} GROUP BY bed_type, status`,
            queryParams
        );

        const footfallBreakdown = await pool.query(
            `SELECT 
                hourly_slot, 
                SUM(outpatient_count)::int as op, 
                SUM(inpatient_count)::int as ip, 
                SUM(emergency_count)::int as er, 
                ROUND(AVG(avg_waiting_time_mins))::int as wait_time
            FROM patient_footfall 
            ${footfallFilter}
            GROUP BY hourly_slot 
            ORDER BY hourly_slot`,
            queryParams
        );

        const alertBreakdown = await pool.query(
            `SELECT severity, COUNT(*)::int FROM alerts${alertFilter} GROUP BY severity`,
            queryParams
        );

        const stockBreakdown = await pool.query(
            `SELECT 
                COALESCE(SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END), 0)::int as stock_out,
                COALESCE(SUM(CASE WHEN current_stock > 0 AND current_stock <= min_required_stock THEN 1 ELSE 0 END), 0)::int as low_stock,
                COALESCE(SUM(CASE WHEN current_stock > min_required_stock THEN 1 ELSE 0 END), 0)::int as normal_stock
            FROM stock_inventory
            ${stockFilter}`,
            queryParams
        );

        res.json({
            totalCentres: Number(totalCentres.rows[0].count),
            totalDoctors: Number(totalDoctors.rows[0].count),
            availableBeds: Number(availableBeds.rows[0].count),
            activeAlerts: Number(activeAlerts.rows[0].count),
            totalMedicines: Number(totalMedicines.rows[0].count),
            bedBreakdown: bedBreakdown.rows,
            footfallBreakdown: footfallBreakdown.rows,
            alertBreakdown: alertBreakdown.rows,
            stockBreakdown: stockBreakdown.rows[0] || { stock_out: 0, low_stock: 0, normal_stock: 0 }
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({
            message: "Dashboard data could not be loaded.",
            error: error.message
        });
    }
};

module.exports = {
    getDashboardStats
};