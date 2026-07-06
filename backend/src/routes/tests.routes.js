const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRoles, checkHealthCentreOwnership, logAuditRoute } = require("../middleware/auth.middleware");

const {
    getAllTests,
    getTestsCatalog,
    getTestById,
    createTest,
    updateTest,
    deleteTest
} = require("../controllers/tests.controller");

// GET routes are public; modifications are protected by authMiddleware, authorizeRoles, and ownership checks
router.get("/", getAllTests);
router.get("/catalog", getTestsCatalog);
router.get("/:id", getTestById);
router.post("/", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager", "LabTechnician"), checkHealthCentreOwnership("test_availability"), logAuditRoute("CREATE_TEST"), createTest);
router.put("/:id", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager", "LabTechnician"), checkHealthCentreOwnership("test_availability", "id", "id"), logAuditRoute("UPDATE_TEST"), updateTest);
router.delete("/:id", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager", "LabTechnician"), checkHealthCentreOwnership("test_availability", "id", "id"), logAuditRoute("DELETE_TEST"), deleteTest);

module.exports = router;
