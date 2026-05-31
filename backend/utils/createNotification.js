/**
 * createNotification.js — Reusable Notification Utility
 *
 * Creates a notification in MongoDB and emits a real-time socket event
 * to the recipient if they are currently online.
 *
 * This is NOT a controller — it is an internal utility imported by:
 *  - postController.js  (toggleLike, toggleDislike, addComment)
 *  - anonController.js  (toggleAnonLike)
 *  - socketHandler.js   (send_message)
 *
 * Usage:
 *   import { createNotification } from '../utils/createNotification.js';
 *
 *   await createNotification({
 *     recipient:      post.author,          // ObjectId or string
 *     sender:         req.user._id,         // ObjectId or string
 *     senderName:     req.user.name,        // string — used in message template
 *     type:           'like_post',          // one of the 5 valid types
 *     postId:         post._id,             // optional
 *     anonPostId:     null,                 // optional
 *     conversationId: null,                 // optional
 *   });
 *
 * Rules enforced here (so callers don't need to):
 *  1. No self-notifications — silently returns if recipient === sender.
 *  2. Message text for 'like_anon' never reveals sender name.
 *  3. Socket emit is fire-and-forget — a socket failure never throws.
 */

import Notification from "../models/Notification.js";
import { getIO }    from "../socket/socketInstance.js";
import { getSocketId } from "../socket/socketHandler.js";

// ── Message builders — one per notification type ──────────────────────────────
// Kept in a map for clarity. 'like_anon' intentionally ignores senderName.
const buildMessage = (type, senderName) => {
  switch (type) {
    case "like_post":    return `${senderName} liked your post`;
    case "dislike_post": return `${senderName} disliked your post`;
    case "comment_post": return `${senderName} commented on your post`;
    case "like_anon":    return "Someone liked your anonymous post"; // ← privacy rule
    case "new_message":  return `${senderName} sent you a message`;
    default:             return `${senderName} interacted with your content`;
  }
};

/**
 * createNotification — Create + emit a single notification.
 *
 * @param {object} params
 * @param {string|import('mongoose').Types.ObjectId} params.recipient     - User to notify
 * @param {string|import('mongoose').Types.ObjectId} params.sender        - User who acted
 * @param {string} params.senderName                                       - Used in message text
 * @param {string} params.type                                             - Notification type enum
 * @param {string|import('mongoose').Types.ObjectId|null} [params.postId]         - Feed post reference
 * @param {string|import('mongoose').Types.ObjectId|null} [params.anonPostId]     - Anon post reference
 * @param {string|import('mongoose').Types.ObjectId|null} [params.conversationId] - Chat conversation ref
 *
 * @returns {Promise<void>} — resolves when the DB write completes.
 *                            Errors are logged but never re-thrown so they
 *                            don't break the calling action (like / comment / message).
 */
export const createNotification = async ({
  recipient,
  sender,
  senderName,
  type,
  postId         = null,
  anonPostId     = null,
  conversationId = null,
}) => {
  try {
    // ── Guard 1: No self-notifications ───────────────────────────────────────
    // Compare as strings to handle both ObjectId and string inputs cleanly.
    if (recipient.toString() === sender.toString()) {
      return; // silently do nothing
    }

    // ── Build the human-readable message ─────────────────────────────────────
    const message = buildMessage(type, senderName);

    // ── Persist to DB ────────────────────────────────────────────────────────
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      postId,
      anonPostId,
      conversationId,
      message,
    });

    // ── Emit real-time event to recipient (if online) ─────────────────────────
    // getSocketId returns undefined if the user is not currently connected.
    // io.to(undefined) is a no-op in Socket.IO, but we guard explicitly for
    // clarity and to avoid any edge-case warnings.
    const io       = getIO();
    const socketId = getSocketId(recipient.toString());

    if (io && socketId) {
      // Populate sender for the real-time payload (name + profilePicture)
      // We use the already-created notification and manually attach sender info
      // that the caller already has — avoiding an extra DB round-trip.
      io.to(socketId).emit("new_notification", {
        _id:            notification._id,
        type:           notification.type,
        message:        notification.message,
        read:           notification.read,
        postId:         notification.postId,
        anonPostId:     notification.anonPostId,
        conversationId: notification.conversationId,
        createdAt:      notification.createdAt,
        // Minimal sender info inline — matches what getNotifications populates
        sender: {
          _id:            sender,
          name:           senderName,
          // profilePicture is not available here without a DB query.
          // The frontend will fall back to initials-avatar for real-time events.
          // On next page load / panel open, the full populated data is fetched.
          profilePicture: null,
        },
      });
    }
  } catch (err) {
    // ── Error handling ────────────────────────────────────────────────────────
    // Notification failure must NEVER break the primary action (like, comment, message).
    // Log the error for monitoring, but swallow it so the caller continues.
    console.error(`[createNotification] Failed to create ${type} notification:`, err.message);
  }
};
