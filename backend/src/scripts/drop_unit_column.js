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
        
        console.log("🛠️ Checking if 'unit' column exists in 'medicines' table...");
        const columnCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='medicines' AND column_name='unit';
        `);

        if (columnCheck.rowCount > 0) {
            console.log("➖ Dropping 'unit' column from 'medicines' table...");
            await client.query("ALTER TABLE medicines DROP COLUMN unit;");
            console.log("✅ 'unit' column dropped successfully!");
        } else {
            console.log("ℹ️ 'unit' column does not exist in 'medicines' table.");
        }

        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("❌ Migration failed:", err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
