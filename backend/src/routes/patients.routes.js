const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth.middleware");

const {
    getAllPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient
} = require("../controllers/patients.controller");

// All endpoints require user authentication
router.use(authMiddleware);

router.get("/", getAllPatients);
router.get("/:id", getPatientById);
router.post("/", createPatient);
router.put("/:id", updatePatient);
router.delete("/:id", deletePatient);

module.exports = router;
