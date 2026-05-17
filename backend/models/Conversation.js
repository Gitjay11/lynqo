/**
 * Conversation.js — Mongoose Conversation Model
 *
 * Represents a private, one-to-one chat thread between exactly two users.
 *
 * Key design decisions:
 *  - `participants` is always exactly 2 ObjectIds. Enforced at the controller
 *    level (not schema-level) to keep the schema clean; the compound index on
 *    participants is what makes the "does this conversation already exist?"
 *    query fast.
 *  - `lastMessage` is a denormalized reference updated whenever a new message
 *    is sent. It lets the conversation list render previews without fetching
 *    the full messages collection.
 *  - `timestamps: true` gives us `updatedAt`, which we sort by descending in
 *    getConversations — the most recently active thread rises to the top.
 *
 * Index: { participants: 1 }
 *  MongoDB's multikey index on an array field lets us efficiently query:
 *    Conversation.findOne({ participants: { $all: [userA, userB] } })
 *  Without this index the query would be a full collection scan.
 */

import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // ── Participants ──────────────────────────────────────────────────────────
    // Always exactly 2 User references. Stored as an array so that the
    // multikey index covers both directions (A→B and B→A in the same doc).
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // ── Last Message (denormalized) ───────────────────────────────────────────
    // Optional — null on a brand-new conversation (no messages yet).
    // Updated by the Socket.IO "sendMessage" event handler each time a new
    // message is persisted. Populated in getConversations for inbox previews.
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  {
    // Adds `createdAt` and `updatedAt` automatically.
    // `updatedAt` is used to sort the inbox (most recent activity first).
    timestamps: true,
  }
);

// ── Index ─────────────────────────────────────────────────────────────────────
// Multikey index on the participants array.
// Allows fast lookup of all conversations a user is part of:
//   Conversation.find({ participants: userId })
// And fast existence check for a specific pair:
//   Conversation.findOne({ participants: { $all: [userA, userB] } })
conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
