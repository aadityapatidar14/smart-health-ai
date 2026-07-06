const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRoles, checkHealthCentreOwnership, logAuditRoute } = require("../middleware/auth.middleware");

const {
    getAllAlerts,
    getAlertById,
    createAlert,
    updateAlert,
    deleteAlert
} = require("../controllers/alerts.controller");

// All logged-in roles can view alerts, but only authorized roles can modify them
router.get("/", authMiddleware, getAllAlerts);
router.get("/:id", authMiddleware, getAlertById);
router.post("/", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager"), checkHealthCentreOwnership("alerts"), logAuditRoute("CREATE_ALERT"), createAlert);
router.put("/:id", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager"), checkHealthCentreOwnership("alerts", "id", "id"), logAuditRoute("UPDATE_ALERT"), updateAlert);
router.delete("/:id", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager"), checkHealthCentreOwnership("alerts", "id", "id"), logAuditRoute("DELETE_ALERT"), deleteAlert);

module.exports = router;
