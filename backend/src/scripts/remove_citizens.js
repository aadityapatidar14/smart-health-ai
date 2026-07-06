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

    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        console.log("🧹 Deleting all citizen accounts from the database...");
        const res = await client.query("DELETE FROM users WHERE role = 'Citizen' RETURNING id, name, email;");
        console.log(`✅ Successfully deleted ${res.rowCount} citizen records!`);
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("❌ Error deleting citizens:", err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
