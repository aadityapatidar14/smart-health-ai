const pool = require("../config/db");

const getNotifications = async (req, res) => {
    try {
        let queryText = `
            SELECT n.id, n.health_centre_id, hc.name as health_centre_name, n.title, n.message, n.type, n.is_read, n.created_at
            FROM notifications n
            LEFT JOIN health_centres hc ON n.health_centre_id = hc.id
        `;
        const queryParams = [];

        // If not DistrictAdmin, filter by user's assigned health centre
        if (req.user.role !== "DistrictAdmin") {
            const userCentreId = req.user.healthCentreId;
            if (!userCentreId) {
                return res.status(200).json([]);
            }
            queryText += " WHERE n.health_centre_id = $1";
            queryParams.push(Number(userCentreId));
        }

        queryText += " ORDER BY n.created_at DESC LIMIT 100;";

        const result = await pool.query(queryText, queryParams);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getNotifications Error:", error);
        res.status(500).json({
            message: "Failed to fetch notifications.",
            error: error.message
        });
    }
};

const markAsRead = async (req, res) => {
    const { id } = req.params;
    try {
        const queryText = "UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *;";
        const result = await pool.query(queryText, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Notification not found." });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("markAsRead Error:", error);
        res.status(500).json({
            message: "Failed to mark notification as read.",
            error: error.message
        });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        let queryText = "UPDATE notifications SET is_read = TRUE";
        const queryParams = [];

        // If not DistrictAdmin, mark all for their assigned health centre
        if (req.user.role !== "DistrictAdmin") {
            const userCentreId = req.user.healthCentreId;
            if (!userCentreId) {
                return res.status(200).json({ message: "No notifications found." });
            }
            queryText += " WHERE health_centre_id = $1";
            queryParams.push(Number(userCentreId));
        }

        await pool.query(queryText, queryParams);
        res.status(200).json({ message: "All notifications marked as read." });
    } catch (error) {
        console.error("markAllAsRead Error:", error);
        res.status(500).json({
            message: "Failed to mark all notifications as read.",
            error: error.message
        });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead
};
