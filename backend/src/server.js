const app = require("./app");
const pool = require("./config/db");

const PORT = 5000;

// Test database connection
async function startServer() {
    try {
        await pool.query("SELECT NOW()");
        console.log("✅ Connected to PostgreSQL Database");

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("❌ Database Connection Failed");
        console.error(error.message);
    }
}

startServer();