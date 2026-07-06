const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRoles, checkHealthCentreOwnership, logAuditRoute } = require("../middleware/auth.middleware");

const {
    getDailyFootfall,
    getHourlyFootfall,
    createFootfall,
    updateFootfall,
    deleteFootfall
} = require("../controllers/footfall.controller");

// GET routes are public; modifications are protected by authMiddleware, authorizeRoles, and ownership checks
router.get("/", getDailyFootfall);
router.get("/hourly", getHourlyFootfall);
router.post("/", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager"), checkHealthCentreOwnership("patient_footfall"), logAuditRoute("CREATE_FOOTFALL"), createFootfall);
router.put("/:id", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager"), checkHealthCentreOwnership("patient_footfall", "id", "id"), logAuditRoute("UPDATE_FOOTFALL"), updateFootfall);
router.delete("/:id", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager"), checkHealthCentreOwnership("patient_footfall", "id", "id"), logAuditRoute("DELETE_FOOTFALL"), deleteFootfall);

module.exports = router;
