const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRoles } = require("../middleware/auth.middleware");
const { getAuditLogs } = require("../controllers/audit.controller");

// Only DistrictAdmin can view audit logs
router.get("/", authMiddleware, authorizeRoles("DistrictAdmin"), getAuditLogs);

module.exports = router;
