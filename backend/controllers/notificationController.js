/**
 * notificationController.js — Notification API Controllers
 *
 * Handles all notification-related HTTP operations:
 *  - getNotifications   → GET    /api/notifications          (protected)
 *  - markAsRead         → PUT    /api/notifications/:id/read (protected)
 *  - markAllAsRead      → PUT    /api/notifications/read-all (protected)
 *  - deleteNotification → DELETE /api/notifications/:id      (protected)
 *
 * All routes require a valid JWT via the `protect` middleware.
 * Ownership is verified on per-document operations (markAsRead, deleteNotification)
 * to prevent users from reading or deleting other users' notifications.
 */

import Notification from "../models/Notification.js";

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Fetch the 30 most recent notifications for the logged-in user
// @route   GET /api/notifications
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // ── Fetch notifications + unread count in parallel ────────────────────
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })      // newest first
        .limit(30)                     // cap to 30 most recent
        .populate("sender", "name profilePicture") // only safe public fields
        .lean(),                       // plain JS objects — faster for read-only
      Notification.countDocuments({ recipient: userId, read: false }),
    ]);

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      res.status(404);
      return next(new Error("Notification not found"));
    }

    // ── Ownership check ───────────────────────────────────────────────────
    // Prevent user A from marking user B's notifications as read.
    if (notification.recipient.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error("Forbidden — this notification does not belong to you"));
    }

    // ── Idempotent update — no-op if already read ─────────────────────────
    if (!notification.read) {
      notification.read = true;
      await notification.save();
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Mark ALL unread notifications as read for the logged-in user
// @route   PUT /api/notifications/read-all
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, read: false }, // filter: this user's unread only
      { $set: { read: true } }
    );

    return res.status(200).json({
      success: true,
      updated: result.modifiedCount, // how many were actually changed
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a single notification
// @route   DELETE /api/notifications/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      res.status(404);
      return next(new Error("Notification not found"));
    }

    // ── Ownership check ───────────────────────────────────────────────────
    if (notification.recipient.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error("Forbidden — this notification does not belong to you"));
    }

    await notification.deleteOne();

    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
