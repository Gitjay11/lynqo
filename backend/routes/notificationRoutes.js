/**
 * notificationRoutes.js — Notification API Routes
 *
 * All routes require a valid JWT (via `protect` middleware).
 *
 * Route map:
 *   GET    /api/notifications           → getNotifications (30 most recent + unreadCount)
 *   PUT    /api/notifications/read-all  → markAllAsRead    (bulk mark read)
 *   PUT    /api/notifications/:id/read  → markAsRead       (single mark read)
 *   DELETE /api/notifications/:id       → deleteNotification
 *
 * ⚠️  Route ordering matters:
 *   '/read-all' is defined BEFORE '/:id/read' to prevent Express from
 *   interpreting the literal string "read-all" as an `:id` parameter.
 */

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

// ── All notification routes require authentication ────────────────────────────
router.use(protect);

// ── GET /api/notifications ────────────────────────────────────────────────────
// Fetch 30 most recent notifications + unread count
router.get("/", getNotifications);

// ── PUT /api/notifications/read-all ───────────────────────────────────────────
// Mark ALL unread notifications as read (bulk)
// Must be declared BEFORE /:id/read to avoid route collision
router.put("/read-all", markAllAsRead);

// ── PUT /api/notifications/:id/read ──────────────────────────────────────────
// Mark a single notification as read
router.put("/:id/read", markAsRead);

// ── DELETE /api/notifications/:id ─────────────────────────────────────────────
// Delete a single notification (ownership verified in controller)
router.delete("/:id", deleteNotification);

export default router;
