const express = require("express");
const cors = require("cors");

const app = express();

const centresRoutes = require("./routes/centres.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const authRoutes = require("./routes/auth.routes");
const doctorsRoutes = require("./routes/doctors.routes");
const medicinesRoutes = require("./routes/medicines.routes");
const bedsRoutes = require("./routes/beds.routes");
const alertsRoutes = require("./routes/alerts.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const recommendationsRoutes = require("./routes/recommendations.routes");
const equipmentRoutes = require("./routes/equipment.routes");
const testsRoutes = require("./routes/tests.routes");
const footfallRoutes = require("./routes/footfall.routes");
const notificationsRoutes = require("./routes/notifications.routes");
const auditRoutes = require("./routes/audit.routes");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("🚀 Smart Health Backend is Running!");
});

app.use("/centres", centresRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/auth", authRoutes);
app.use("/doctors", doctorsRoutes);
app.use("/medicines", medicinesRoutes);
app.use("/beds", bedsRoutes);
app.use("/alerts", alertsRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/recommendations", recommendationsRoutes);
app.use("/equipment", equipmentRoutes);
app.use("/tests", testsRoutes);
app.use("/footfall", footfallRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/audit", auditRoutes);

module.exports = app;