const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth.middleware");
const { getNotifications, markAsRead, markAllAsRead } = require("../controllers/notifications.controller");

// All authenticated roles can view notifications and mark them as read
router.get("/", authMiddleware, getNotifications);
router.put("/read-all", authMiddleware, markAllAsRead);
router.put("/:id/read", authMiddleware, markAsRead);

module.exports = router;
