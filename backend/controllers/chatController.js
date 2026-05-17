/**
 * chatController.js — One-to-One Chat Controllers
 *
 * Handles all REST operations for the private messaging system:
 *
 *  getOrCreateConversation → POST   /api/chat/conversation/:userId   (protected)
 *  getConversations        → GET    /api/chat/conversations           (protected)
 *  getMessages             → GET    /api/chat/messages/:convId        (protected)
 *
 * Security notes:
 *  - All handlers require a valid JWT via the `protect` middleware.
 *  - getMessages verifies req.user is a participant before returning data.
 *    Non-participants receive a 403 — no data leakage.
 *  - A user cannot open a conversation with themselves (400 guard).
 *  - Bulk read-marking in getMessages uses updateMany for efficiency; it only
 *    touches messages where sender ≠ req.user (i.e., messages sent TO us).
 *
 * Population strategy:
 *  - participants are populated with `name profilePicture` only — no sensitive
 *    fields (email, password) are ever sent to the client.
 *  - lastMessage is populated as a full document so the inbox can render a
 *    preview snippet without an extra round-trip.
 */

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get an existing conversation with :userId, or create one
// @route   POST /api/chat/conversation/:userId
// @access  Protected
//
// Steps:
//  1. Reject self-conversations (req.user._id === :userId)
//  2. Look for an existing conversation that contains BOTH participants
//  3. If found → return it (idempotent)
//  4. If not found → create and return it
// ─────────────────────────────────────────────────────────────────────────────
export const getOrCreateConversation = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId   = req.params.userId;

    // ── Guard: prevent a user from starting a conversation with themselves ──
    if (currentUserId.toString() === otherUserId.toString()) {
      res.status(400);
      return next(new Error("You cannot start a conversation with yourself"));
    }

    // ── Check for an existing conversation between the two users ───────────
    // $all on the participants array matches documents where BOTH ids appear,
    // regardless of their position in the array. This covers both orderings
    // (A started the chat, or B started the chat).
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, otherUserId] },
    }).populate("participants", "name profilePicture");

    if (conversation) {
      // ── Conversation already exists — return it without creating a dup ──
      return res.status(200).json({
        success: true,
        conversation,
      });
    }

    // ── No existing conversation — create a new one ────────────────────────
    conversation = await Conversation.create({
      participants: [currentUserId, otherUserId],
    });

    // Re-fetch with population — .create() doesn't populate automatically.
    conversation = await Conversation.findById(conversation._id).populate(
      "participants",
      "name profilePicture"
    );

    return res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all conversations for the authenticated user (inbox)
// @route   GET /api/chat/conversations
// @access  Protected
//
// Sorted by updatedAt descending so the most recently active thread
// appears first — standard inbox behaviour.
//
// Participant population:
//  We populate ALL participants (both the current user and the other).
//  The frontend filters out req.user from the participants array to
//  display the other person's name and avatar. Doing this server-side
//  would require knowing the client's user ID inside the aggregation,
//  which adds complexity; the lightweight array filter is cleaner on client.
// ─────────────────────────────────────────────────────────────────────────────
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      // Match any conversation where the participants array contains this user
      participants: req.user._id,
    })
      .populate("participants", "name profilePicture") // only safe fields
      .populate("lastMessage")                         // full doc for preview
      .sort({ updatedAt: -1 });                        // most recent first

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all messages for a specific conversation
// @route   GET /api/chat/messages/:convId
// @access  Protected
//
// Steps:
//  1. Load the conversation and verify req.user is a participant → 403 if not
//  2. Fetch all messages sorted by createdAt ascending (oldest first)
//  3. Bulk-mark unread messages (sent by the other user) as read
//  4. Return the messages array
//
// Read-marking strategy:
//  We only mark messages as read where:
//    - sender ≠ req.user._id  (messages sent TO us, not by us)
//    - read === false          (only those not yet marked)
//  This is a single updateMany — O(1) DB round-trips regardless of volume.
// ─────────────────────────────────────────────────────────────────────────────
export const getMessages = async (req, res, next) => {
  try {
    const { convId } = req.params;

    // ── Step 1: Load conversation and verify participant access ────────────
    const conversation = await Conversation.findById(convId);

    if (!conversation) {
      res.status(404);
      return next(new Error("Conversation not found"));
    }

    // Check that req.user._id appears in the participants array.
    // .some() with .equals() handles ObjectId comparison correctly.
    const isParticipant = conversation.participants.some((participantId) =>
      participantId.equals(req.user._id)
    );

    if (!isParticipant) {
      res.status(403);
      return next(
        new Error("Forbidden — you are not a participant in this conversation")
      );
    }

    // ── Step 2: Fetch all messages, oldest first ───────────────────────────
    const messages = await Message.find({ conversation: convId })
      .populate("sender", "name profilePicture")
      .sort({ createdAt: 1 }); // ascending → chronological chat order

    // ── Step 3: Bulk-mark unread messages as read ─────────────────────────
    // Only mark messages that were SENT TO US (sender ≠ req.user._id)
    // and that haven't been marked yet (read: false).
    // Fire-and-forget — we don't await so the response isn't blocked.
    // A failure here is non-critical (cosmetic badge count off by N),
    // but we log it to avoid silent failures in production.
    Message.updateMany(
      {
        conversation: convId,
        sender: { $ne: req.user._id }, // not sent by us
        read: false,                   // not yet read
      },
      { $set: { read: true } }
    ).catch((err) => {
      console.error(
        `[getMessages] Failed to mark messages as read for conv ${convId}:`,
        err.message
      );
    });

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    next(error);
  }
};
