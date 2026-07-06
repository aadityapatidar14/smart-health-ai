const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function run() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        console.log("🧹 Cleaning spaces out of doctor emails in database...");
        const res = await pool.query(
            "UPDATE users SET email = REPLACE(email, ' ', '') WHERE role = 'Doctor' RETURNING id, email"
        );
        console.log(`✅ Successfully cleaned ${res.rowCount} doctor email addresses!`);
    } catch (err) {
        console.error("❌ Failed to clean emails:", err.message);
    } finally {
        await pool.end();
    }
}

run();
