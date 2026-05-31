/**
 * Notification.js — Mongoose Notification Model
 *
 * Represents a single in-app notification delivered to a user.
 * Notifications are created by the createNotification utility and consumed
 * by notificationController.js.
 *
 * Fields:
 *  - recipient     → ObjectId ref User (required) — who receives this notification
 *  - sender        → ObjectId ref User (required) — who triggered it
 *  - type          → String enum (required) — determines message template + icon
 *  - postId        → ObjectId ref Post (optional) — for like_post / dislike_post / comment_post
 *  - anonPostId    → ObjectId ref AnonPost (optional) — for like_anon
 *  - conversationId→ ObjectId ref Conversation (optional) — for new_message
 *  - message       → String — human-readable text, generated at creation time
 *  - read          → Boolean, default false
 *  - timestamps    → adds createdAt + updatedAt automatically
 *
 * Index: { recipient: 1, createdAt: -1 }
 *  Covers the dominant query: fetch a user's notifications sorted newest-first.
 *
 * Security note — like_anon:
 *  For notifications of type 'like_anon', the `sender` field is stored in DB
 *  for potential admin/moderation use, BUT the `message` field always reads
 *  "Someone liked your anonymous post" — the sender's name is never embedded
 *  in the message string. The frontend must also never display sender identity
 *  for this notification type.
 */

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // ── Who receives this notification ───────────────────────────────────────
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification must have a recipient"],
    },

    // ── Who triggered this notification ──────────────────────────────────────
    // Stored even for like_anon (admin use only). Never exposed in message text
    // for anon notifications.
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification must have a sender"],
    },

    // ── Notification type — drives the message template and frontend icon ────
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: {
        values: [
          "like_post",      // someone liked your feed post
          "dislike_post",   // someone disliked your feed post
          "comment_post",   // someone commented on your feed post
          "like_anon",      // someone liked your anonymous post
          "new_message",    // someone sent you a direct message
          "follow",         // someone started following you
        ],
        message: "Invalid notification type: {VALUE}",
      },
    },

    // ── Optional context references — exactly one will be populated per type ──
    // null for types that don't use the field.

    // For like_post, dislike_post, comment_post — which feed post
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    // For like_anon — which anonymous post
    anonPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AnonPost",
      default: null,
    },

    // For new_message — which conversation to open
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },

    // ── Human-readable notification text ─────────────────────────────────────
    // Pre-built at creation time by createNotification.js so the frontend just
    // renders it directly — no string interpolation needed in the UI.
    //
    // Templates:
    //   like_post    → "{senderName} liked your post"
    //   dislike_post → "{senderName} disliked your post"
    //   comment_post → "{senderName} commented on your post"
    //   like_anon    → "Someone liked your anonymous post"  ← sender hidden
    //   new_message  → "{senderName} sent you a message"
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [200, "Notification message cannot exceed 200 characters"],
    },

    // ── Read status ──────────────────────────────────────────────────────────
    // false → shown with unread highlight in the UI + counted in the badge.
    // Toggled to true by markAsRead or markAllAsRead.
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Adds createdAt + updatedAt automatically.
    // createdAt is used for sorting (newest first) and relative timestamps in UI.
    timestamps: true,
  }
);

// ── Compound index ────────────────────────────────────────────────────────────
// Covers the dominant query: all notifications for a user, sorted newest first.
// { recipient: 1 } narrows the result set; { createdAt: -1 } sorts in place.
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
