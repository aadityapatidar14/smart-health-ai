const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const NEW_HASH = "$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6"; // bcrypt hash of "password123"
const OLD_HASH = "$2b$10$vO8k9P50bCgH9123";

async function run() {
    console.log("🔄 Starting password hash update process...");

    // 1. Update database records
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        console.log(`🔌 Connecting to database '${process.env.DB_NAME}' on '${process.env.DB_HOST}:${process.env.DB_PORT}'...`);
        const res = await pool.query(
            "UPDATE users SET password_hash = $1 RETURNING id, email",
            [NEW_HASH]
        );
        console.log(`✅ Successfully updated ${res.rowCount} users in the database!`);
    } catch (err) {
        console.error("❌ Failed to update users in database:", err.message);
    } finally {
        await pool.end();
    }

    // 2. Update seed_data.sql file
    const seedFilePath = path.join(__dirname, "../../../database/seed_data.sql");
    try {
        console.log(`📝 Modifying seed_data.sql file at '${seedFilePath}'...`);
        if (fs.existsSync(seedFilePath)) {
            let content = fs.readFileSync(seedFilePath, "utf8");
            
            // Replace all occurrences of old hash with new hash
            const occurrences = (content.match(new RegExp(OLD_HASH.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).length;
            
            if (occurrences > 0) {
                content = content.split(OLD_HASH).join(NEW_HASH);
                fs.writeFileSync(seedFilePath, content, "utf8");
                console.log(`✅ Successfully replaced ${occurrences} occurrences in seed_data.sql!`);
            } else {
                console.log("ℹ️ No placeholder hashes found in seed_data.sql (already updated).");
            }
        } else {
            console.warn(`⚠️ seed_data.sql file not found at expected path: ${seedFilePath}`);
        }
    } catch (err) {
        console.error("❌ Failed to update seed_data.sql:", err.message);
    }

    console.log("🏁 Password hash update complete.");
}

run();
