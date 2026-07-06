const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRoles, checkHealthCentreOwnership, logAuditRoute } = require("../middleware/auth.middleware");

const {
    getAllRecommendations,
    approveRecommendation,
    rejectRecommendation,
    getAllForecasts
} = require("../controllers/recommendations.controller");

// All logged-in roles can view recommendations/forecasts, but only authorized roles can approve/reject with ownership verification
router.get("/", authMiddleware, getAllRecommendations);
router.put("/:id/approve", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager", "Pharmacist"), checkHealthCentreOwnership("redistribution_recommendations"), logAuditRoute("APPROVE_RECOMMENDATION"), approveRecommendation);
router.put("/:id/reject", authMiddleware, authorizeRoles("DistrictAdmin", "CenterManager", "Pharmacist"), checkHealthCentreOwnership("redistribution_recommendations"), logAuditRoute("REJECT_RECOMMENDATION"), rejectRecommendation);
router.get("/forecasts", authMiddleware, getAllForecasts);

module.exports = router;
