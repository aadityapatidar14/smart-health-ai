const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRoles, checkHealthCentreOwnership, logAuditRoute } = require("../middleware/auth.middleware");

const {
    getAllDoctors,
    getDoctorById,
    createDoctor,
    updateDoctor,
    deleteDoctor,
    updateLiveStatus,
    getWeeklyAnalytics
} = require("../controllers/doctors.controller");

// All logged-in roles can view doctors, but only authorized roles can modify them
router.get("/", authMiddleware, getAllDoctors);
router.get("/analytics/weekly", authMiddleware, authorizeRoles("DistrictAdmin"), getWeeklyAnalytics);
router.get("/:id", authMiddleware, getDoctorById);
router.post("/", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager"), checkHealthCentreOwnership("doctors"), logAuditRoute("CREATE_DOCTOR"), createDoctor);
router.put("/:id", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager"), checkHealthCentreOwnership("doctors", "id", "id"), logAuditRoute("UPDATE_DOCTOR"), updateDoctor);
router.delete("/:id", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager"), checkHealthCentreOwnership("doctors", "id", "id"), logAuditRoute("DELETE_DOCTOR"), deleteDoctor);
router.put("/:id/live-status", authMiddleware, authorizeRoles("CenterManager"), checkHealthCentreOwnership("doctors", "id", "id"), logAuditRoute("UPDATE_DOCTOR_LIVE_STATUS"), updateLiveStatus);

module.exports = router;
