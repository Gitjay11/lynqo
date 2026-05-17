/**
 * Message.js — Mongoose Message Model
 *
 * Represents a single chat message within a Conversation.
 *
 * Key design decisions:
 *  - `conversation` ref ties every message to its parent thread. Queries
 *    always filter by conversationId, so the index on `conversation` is
 *    critical for performance at scale.
 *  - `sender` ref lets us populate name + profilePicture in a single query
 *    instead of a separate round-trip.
 *  - `text` is capped at 1000 characters. Long message support can be added
 *    later (e.g. rich media), but keeping it simple now avoids payload abuse.
 *  - `read` defaults to false. The getMessages controller marks messages as
 *    read in bulk when the recipient opens the thread, giving us accurate
 *    unread counts without a separate tracking collection.
 *  - `timestamps: true` gives us `createdAt`, which we sort ascending in
 *    getMessages so the chat renders in chronological order.
 */

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // ── Parent Conversation ───────────────────────────────────────────────────
    // Required — every message belongs to exactly one conversation.
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Message must belong to a conversation"],
    },

    // ── Sender ────────────────────────────────────────────────────────────────
    // Required — the authenticated user who sent this message.
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Message must have a sender"],
    },

    // ── Message Content ───────────────────────────────────────────────────────
    // Trimmed at the controller level before save.
    // maxlength enforced here as a database-level safety net.
    text: {
      type: String,
      required: [true, "Message text is required"],
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },

    // ── Read Receipt ─────────────────────────────────────────────────────────
    // false  → message has not been seen by the recipient
    // true   → recipient opened the thread and the controller called updateMany
    // Used by the frontend to render unread badges on the conversation list.
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Adds `createdAt` and `updatedAt` automatically.
    // `createdAt` is used to sort messages chronologically (ascending).
    timestamps: true,
  }
);

// ── Index ─────────────────────────────────────────────────────────────────────
// Index on `conversation` so that fetching all messages for a thread is a
// fast index scan rather than a full collection scan.
messageSchema.index({ conversation: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
