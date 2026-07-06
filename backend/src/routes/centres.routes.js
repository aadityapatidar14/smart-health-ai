const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRoles, checkHealthCentreOwnership, logAuditRoute } = require("../middleware/auth.middleware");

const {
    getAllCentres,
    getCentreById,
    createCentre,
    updateCentre,
    deleteCentre
} = require("../controllers/centres.controller");

// GET routes are public; modifications are protected by authMiddleware, authorizeRoles, and ownership checks
router.get("/", getAllCentres);
router.get("/:id", getCentreById);
router.post("/", authMiddleware, authorizeRoles("DistrictAdmin"), logAuditRoute("CREATE_CENTRE"), createCentre);
router.put("/:id", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager"), checkHealthCentreOwnership("health_centres", "id", "id"), logAuditRoute("UPDATE_CENTRE"), updateCentre);
router.delete("/:id", authMiddleware, authorizeRoles("DistrictAdmin"), logAuditRoute("DELETE_CENTRE"), deleteCentre);

module.exports = router;
