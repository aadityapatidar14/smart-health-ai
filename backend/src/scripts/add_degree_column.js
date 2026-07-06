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
        
        console.log("🛠️ Checking if 'degree' column exists in 'doctors' table...");
        const columnCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='doctors' AND column_name='degree';
        `);

        if (columnCheck.rowCount === 0) {
            console.log("➕ Adding 'degree' column to 'doctors' table...");
            await client.query("ALTER TABLE doctors ADD COLUMN degree VARCHAR(50);");
            console.log("✅ 'degree' column added successfully!");
        } else {
            console.log("ℹ️ 'degree' column already exists in 'doctors' table.");
        }

        // Set default degrees for existing records based on specialization
        console.log("📝 Populating degrees for existing doctors based on specialization...");
        await client.query(`
            UPDATE doctors
            SET degree = CASE
                WHEN specialization = 'General Physician (Medical Officer)' THEN 'MBBS'
                WHEN specialization = 'Obstetrics & Gynecology' THEN 'MD (OBG)'
                WHEN specialization = 'Pediatrics' THEN 'MD (Pediatrics)'
                WHEN specialization = 'General Surgery' THEN 'MS (Surgery)'
                WHEN specialization = 'General Medicine' THEN 'MD (Medicine)'
                WHEN specialization = 'Orthopedics' THEN 'MS (Orthopedics)'
                ELSE 'MBBS'
            END
            WHERE degree IS NULL;
        `);
        console.log("✅ Populated degrees for existing doctors!");

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
