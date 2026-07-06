const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRoles, logAuditRoute } = require("../middleware/auth.middleware");

const {
    getAllMedicines,
    getMedicineById,
    createMedicine,
    updateMedicine,
    deleteMedicine
} = require("../controllers/medicines.controller");

// All logged-in roles can view medicines, but only DistrictAdmin and Pharmacist can modify them
router.get("/", authMiddleware, getAllMedicines);
router.get("/:id", authMiddleware, getMedicineById);
router.post("/", authMiddleware, authorizeRoles("DistrictAdmin", "Pharmacist"), logAuditRoute("CREATE_MEDICINE"), createMedicine);
router.put("/:id", authMiddleware, authorizeRoles("DistrictAdmin", "Pharmacist"), logAuditRoute("UPDATE_MEDICINE"), updateMedicine);
router.delete("/:id", authMiddleware, authorizeRoles("DistrictAdmin", "Pharmacist"), logAuditRoute("DELETE_MEDICINE"), deleteMedicine);

module.exports = router;
