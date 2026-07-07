const pool = require("../config/db");

// Get all doctors with their general account info & health center names
const getAllDoctors = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                d.id AS doctor_id,
                u.id AS user_id,
                u.name,
                u.email,
                u.health_centre_id,
                hc.name AS health_centre_name,
                u.pincode,
                d.specialization,
                d.degree,
                d.license_no,
                d.status,
                COALESCE(da.status::text, 'Not Marked') AS live_status
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            LEFT JOIN health_centres hc ON u.health_centre_id = hc.id
            LEFT JOIN doctor_attendance da ON da.doctor_id = d.id AND da.date = CURRENT_DATE
            ORDER BY u.name;
        `;
        const result = await pool.query(queryText);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getAllDoctors Error:", error);
        res.status(500).json({
            message: "Failed to fetch doctors list."
        });
    }
};

// Get single doctor details by ID
const getDoctorById = async (req, res) => {
    const { id } = req.params;
    try {
        const queryText = `
            SELECT 
                d.id AS doctor_id,
                u.id AS user_id,
                u.name,
                u.email,
                u.health_centre_id,
                u.pincode,
                d.specialization,
                d.degree,
                d.license_no,
                d.status
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.id = $1;
        `;
        const result = await pool.query(queryText, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Doctor not found."
            });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("getDoctorById Error:", error);
        res.status(500).json({
            message: "Failed to fetch doctor details."
        });
    }
};

// Create a new doctor (runs inside a transaction to insert both User & Doctor profiles)
const createDoctor = async (req, res) => {
    const { name, email, health_centre_id, pincode, specialization, degree, license_no, status } = req.body;

    if (!name || !email || !specialization || !license_no) {
        return res.status(400).json({
            message: "Name, email, specialization, and license number are required."
        });
    }

    // Default password hash for new doctors set to "password123"
    const defaultHash = "$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6";

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Insert general authentication credentials to users table
        const userQuery = `
            INSERT INTO users (name, email, password_hash, role, health_centre_id, pincode)
            VALUES ($1, $2, $3, 'Doctor', $4, $5)
            RETURNING id;
        `;
        const userRes = await client.query(userQuery, [
            name,
            email,
            defaultHash,
            health_centre_id || null,
            pincode || null
        ]);
        const userId = userRes.rows[0].id;

        // 2. Insert medical credentials to doctors table
        const doctorQuery = `
            INSERT INTO doctors (user_id, specialization, degree, license_no, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const doctorRes = await client.query(doctorQuery, [
            userId,
            specialization,
            degree || 'MBBS',
            license_no,
            status || 'Active'
        ]);

        await client.query("COMMIT");

        res.status(201).json({
            message: "Doctor created successfully.",
            doctor: {
                doctor_id: doctorRes.rows[0].id,
                user_id: userId,
                name,
                email,
                health_centre_id,
                pincode,
                specialization,
                degree: doctorRes.rows[0].degree,
                license_no,
                status: doctorRes.rows[0].status
            }
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("createDoctor Error:", error);
        res.status(500).json({
            message: "Failed to create doctor.",
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Update an existing doctor (runs inside a transaction to update both tables)
const updateDoctor = async (req, res) => {
    const { id } = req.params; // doctor_id
    const { name, email, health_centre_id, pincode, specialization, degree, license_no, status } = req.body;

    if (!name || !email || !specialization || !license_no) {
        return res.status(400).json({
            message: "Name, email, specialization, and license number are required."
        });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Fetch user_id matching the doctor_id
        const findUserRes = await client.query("SELECT user_id FROM doctors WHERE id = $1", [id]);
        if (findUserRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                message: "Doctor not found."
            });
        }
        const userId = findUserRes.rows[0].user_id;

        // 2. Update users details
        const userQuery = `
            UPDATE users 
            SET name = $1, email = $2, health_centre_id = $3, pincode = $4
            WHERE id = $5;
        `;
        await client.query(userQuery, [
            name,
            email,
            health_centre_id || null,
            pincode || null,
            userId
        ]);

        // 3. Update doctors credentials
        const doctorQuery = `
            UPDATE doctors 
            SET specialization = $1, degree = $2, license_no = $3, status = $4
            WHERE id = $5
            RETURNING *;
        `;
        const doctorRes = await client.query(doctorQuery, [
            specialization,
            degree || 'MBBS',
            license_no,
            status || 'Active',
            id
        ]);

        await client.query("COMMIT");

        res.status(200).json({
            message: "Doctor updated successfully.",
            doctor: {
                doctor_id: id,
                user_id: userId,
                name,
                email,
                health_centre_id,
                pincode,
                specialization,
                degree: doctorRes.rows[0].degree,
                license_no,
                status: doctorRes.rows[0].status
            }
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("updateDoctor Error:", error);
        res.status(500).json({
            message: "Failed to update doctor.",
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Delete a doctor (deletes the corresponding record from users table, cascading to doctors)
const deleteDoctor = async (req, res) => {
    const { id } = req.params; // doctor_id

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Fetch user_id of the doctor
        const findUserRes = await client.query("SELECT user_id FROM doctors WHERE id = $1", [id]);
        if (findUserRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                message: "Doctor not found."
            });
        }
        const userId = findUserRes.rows[0].user_id;

        // 2. Delete user (cascades and deletes the doctors row)
        const deleteUserRes = await client.query("DELETE FROM users WHERE id = $1 RETURNING *", [userId]);

        await client.query("COMMIT");

        res.status(200).json({
            message: "Doctor deleted successfully.",
            doctor_id: id,
            user: deleteUserRes.rows[0]
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("deleteDoctor Error:", error);
        res.status(500).json({
            message: "Failed to delete doctor."
        });
    } finally {
        client.release();
    }
};

const updateLiveStatus = async (req, res) => {
    const { id } = req.params; // doctor_id
    const { status } = req.body; // 'Present', 'Absent', 'On Leave', 'Emergency Callout'

    if (!status) {
        return res.status(400).json({ message: "Status is required." });
    }

    try {
        const result = await pool.query(`
            INSERT INTO doctor_attendance (doctor_id, date, status)
            VALUES ($1, CURRENT_DATE, $2)
            ON CONFLICT (doctor_id, date) 
            DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `, [id, status]);

        res.status(200).json({
            message: "Doctor live attendance status updated successfully.",
            attendance: result.rows[0]
        });
    } catch (error) {
        console.error("updateLiveStatus Error:", error);
        res.status(500).json({
            message: "Failed to update live status.",
            error: error.message
        });
    }
};

const getWeeklyAnalytics = async (req, res) => {
    try {
        // 1. Overall attendance rate and counts in the past 7 days
        const summaryRes = await pool.query(`
            SELECT 
                COUNT(id)::int as total_records,
                SUM(CASE WHEN status::text = 'Present' THEN 1 ELSE 0 END)::int as present_count,
                SUM(CASE WHEN status::text = 'Absent' THEN 1 ELSE 0 END)::int as absent_count,
                SUM(CASE WHEN status::text IN ('OnLeave', 'On Leave') THEN 1 ELSE 0 END)::int as leave_count,
                SUM(CASE WHEN status::text = 'Emergency Callout' THEN 1 ELSE 0 END)::int as emergency_count,
                ROUND(100.0 * SUM(CASE WHEN status::text IN ('Present', 'Emergency Callout') THEN 1 ELSE 0 END) / NULLIF(COUNT(id), 0))::int as attendance_rate
            FROM doctor_attendance
            WHERE date >= CURRENT_DATE - INTERVAL '7 days'
        `);

        // 2. Attendance rate by health centre
        const centreRes = await pool.query(`
            SELECT 
                hc.id as health_centre_id,
                hc.name as health_centre_name,
                COUNT(da.id)::int as total_records,
                SUM(CASE WHEN da.status::text = 'Present' THEN 1 ELSE 0 END)::int as present_count,
                SUM(CASE WHEN da.status::text = 'Absent' THEN 1 ELSE 0 END)::int as absent_count,
                SUM(CASE WHEN da.status::text IN ('OnLeave', 'On Leave') THEN 1 ELSE 0 END)::int as leave_count,
                SUM(CASE WHEN da.status::text = 'Emergency Callout' THEN 1 ELSE 0 END)::int as emergency_count,
                ROUND(100.0 * SUM(CASE WHEN da.status::text IN ('Present', 'Emergency Callout') THEN 1 ELSE 0 END) / NULLIF(COUNT(da.id), 0))::int as attendance_rate
            FROM doctor_attendance da
            JOIN doctors d ON da.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            JOIN health_centres hc ON u.health_centre_id = hc.id
            WHERE da.date >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY hc.id, hc.name
            ORDER BY attendance_rate DESC;
        `);

        // 3. Daily trend for the past 7 days
        const trendRes = await pool.query(`
            SELECT 
                date::text,
                ROUND(100.0 * SUM(CASE WHEN status::text IN ('Present', 'Emergency Callout') THEN 1 ELSE 0 END) / NULLIF(COUNT(id), 0))::int as rate
            FROM doctor_attendance
            WHERE date >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY date
            ORDER BY date ASC;
        `);

        res.status(200).json({
            summary: summaryRes.rows[0] || { total_records: 0, present_count: 0, absent_count: 0, leave_count: 0, emergency_count: 0, attendance_rate: 0 },
            byCentre: centreRes.rows,
            trend: trendRes.rows
        });
    } catch (error) {
        console.error("getWeeklyAnalytics Error:", error);
        res.status(500).json({
            message: "Failed to generate weekly analytics report.",
            error: error.message
        });
    }
};

module.exports = {
    getAllDoctors,
    getDoctorById,
    createDoctor,
    updateDoctor,
    deleteDoctor,
    updateLiveStatus,
    getWeeklyAnalytics
};
