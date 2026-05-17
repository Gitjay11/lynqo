/**
 * chatRoutes.js — Private Messaging API Routes
 *
 * All routes are protected by the `protect` middleware (JWT required).
 *
 * Route map:
 *  POST   /api/chat/conversation/:userId  → getOrCreateConversation
 *  GET    /api/chat/conversations         → getConversations
 *  GET    /api/chat/messages/:convId      → getMessages
 *
 * Note on ordering:
 *  /conversations must be defined before /conversation/:userId to prevent
 *  Express from attempting to match the literal string "conversations" as
 *  the :userId parameter. (Express matches routes in declaration order.)
 */

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getOrCreateConversation,
  getConversations,
  getMessages,
} from "../controllers/chatController.js";

const router = express.Router();

// ── GET /api/chat/conversations ───────────────────────────────────────────────
// Returns all conversations for the authenticated user, sorted by most recent.
router.get("/conversations", protect, getConversations);

// ── POST /api/chat/conversation/:userId ──────────────────────────────────────
// Returns existing conversation with :userId, or creates one if none exists.
router.post("/conversation/:userId", protect, getOrCreateConversation);

// ── GET /api/chat/messages/:convId ───────────────────────────────────────────
// Returns all messages in :convId (participant-only) and marks unread as read.
router.get("/messages/:convId", protect, getMessages);

export default router;
