const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRoles, checkHealthCentreOwnership, logAuditRoute } = require("../middleware/auth.middleware");

const {
    getAllBeds,
    getBedById,
    createBed,
    updateBed,
    deleteBed
} = require("../controllers/beds.controller");

// GET routes are public; modifications are protected by authMiddleware, authorizeRoles, and ownership checks
router.get("/", getAllBeds);
router.get("/:id", getBedById);
router.post("/", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager"), checkHealthCentreOwnership("beds"), logAuditRoute("CREATE_BED"), createBed);
router.put("/:id", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager"), checkHealthCentreOwnership("beds", "id", "id"), logAuditRoute("UPDATE_BED"), updateBed);
router.delete("/:id", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager"), checkHealthCentreOwnership("beds", "id", "id"), logAuditRoute("DELETE_BED"), deleteBed);

module.exports = router;
