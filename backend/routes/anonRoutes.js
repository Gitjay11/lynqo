/**
 * anonRoutes.js — Anonymous Post Routes
 *
 * All routes are protected — a valid JWT is required.
 * realAuthor is NEVER exposed in any response from these routes.
 *
 * Route map:
 *  GET    /api/anon            → getAnonPosts    (paginated visible feed)
 *  POST   /api/anon            → createAnonPost  (new anon post)
 *  PUT    /api/anon/:id/like   → toggleAnonLike  (like / unlike)
 *  PUT    /api/anon/:id/report → reportAnonPost  (flag; auto-hide at 5 reports)
 */

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createAnonPost,
  getAnonPosts,
  toggleAnonLike,
  reportAnonPost,
} from "../controllers/anonController.js";

const router = express.Router();

// ── Feed ────────────────────────────────────────────────────────────────────
router.get("/", protect, getAnonPosts);

// ── Create ──────────────────────────────────────────────────────────────────
router.post("/", protect, createAnonPost);

// ── Reactions & Moderation ──────────────────────────────────────────────────
router.put("/:id/like",   protect, toggleAnonLike);
router.put("/:id/report", protect, reportAnonPost);

export default router;
