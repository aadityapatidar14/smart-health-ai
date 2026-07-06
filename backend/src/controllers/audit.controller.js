const pool = require("../config/db");

const getAuditLogs = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                al.id, 
                al.user_id, 
                COALESCE(u.name, al.user_name, 'User') AS user_name, 
                COALESCE(u.email, al.user_email, 'user@smarthealth.gov.in') AS user_email, 
                al.action, 
                al.details, 
                al.created_at
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT 200;
        `;
        const result = await pool.query(queryText);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getAuditLogs Error:", error);
        res.status(500).json({
            message: "Failed to fetch audit logs.",
            error: error.message
        });
    }
};

module.exports = {
    getAuditLogs
};
