const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRoles, checkHealthCentreOwnership, logAuditRoute } = require("../middleware/auth.middleware");

const {
    getAllInventory,
    getInventoryById,
    createInventory,
    updateInventory,
    deleteInventory
} = require("../controllers/inventory.controller");

// All logged-in roles can view inventory, but only authorized roles can modify it
router.get("/", authMiddleware, getAllInventory);
router.get("/:id", authMiddleware, getInventoryById);
router.post("/", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager", "Pharmacist"), checkHealthCentreOwnership("stock_inventory"), logAuditRoute("CREATE_STOCK"), createInventory);
router.put("/:id", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager", "Pharmacist"), checkHealthCentreOwnership("stock_inventory", "id", "id"), logAuditRoute("UPDATE_STOCK"), updateInventory);
router.delete("/:id", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager", "Pharmacist"), checkHealthCentreOwnership("stock_inventory", "id", "id"), logAuditRoute("DELETE_STOCK"), deleteInventory);

module.exports = router;
