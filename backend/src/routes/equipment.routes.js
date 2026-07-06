const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRoles, checkHealthCentreOwnership, logAuditRoute } = require("../middleware/auth.middleware");

const {
    getAllEquipment,
    getEquipmentCatalog,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    deleteEquipment
} = require("../controllers/equipment.controller");

// GET routes are public; modifications are protected by authMiddleware, authorizeRoles, and ownership checks
router.get("/", getAllEquipment);
router.get("/catalog", getEquipmentCatalog);
router.get("/:id", getEquipmentById);
router.post("/", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager", "Pharmacist"), checkHealthCentreOwnership("equipment_inventory"), logAuditRoute("CREATE_EQUIPMENT"), createEquipment);
router.put("/:id", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager", "Pharmacist"), checkHealthCentreOwnership("equipment_inventory", "id", "id"), logAuditRoute("UPDATE_EQUIPMENT"), updateEquipment);
router.delete("/:id", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager", "Pharmacist"), checkHealthCentreOwnership("equipment_inventory", "id", "id"), logAuditRoute("DELETE_EQUIPMENT"), deleteEquipment);

module.exports = router;
