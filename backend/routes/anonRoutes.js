/**
 * anonRoutes.js — Anonymous Post Routes
 *
 * All routes are protected — a valid JWT is required.
 * realAuthor is NEVER exposed in any response from these routes.
 *
 * Route map:
 *  GET    /api/anon               → getAnonPosts      (paginated visible feed)
 *  POST   /api/anon               → uploadPostImage, createAnonPost  (multipart/form-data; image optional)
 *  PUT    /api/anon/:id/like      → toggleAnonLike    (like / unlike)
 *  PUT    /api/anon/:id/dislike   → toggleAnonDislike (dislike / un-dislike)
 *  PUT    /api/anon/:id/report    → reportAnonPost    (flag; auto-hide at 5 reports)
 */

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { uploadPostImage } from "../middleware/uploadMiddleware.js";
import {
  createAnonPost,
  getAnonPosts,
  toggleAnonLike,
  toggleAnonDislike,
  reportAnonPost,
  deleteAnonPost,
  getAnonComments,
  addAnonComment,
  deleteAnonComment,
} from "../controllers/anonController.js";

const router = express.Router();

// ── Feed ────────────────────────────────────────────────────────────────────
router.get("/", protect, getAnonPosts);

// ── Create ──────────────────────────────────────────────────────────────────
router.post("/", protect, ...uploadPostImage.single("image"), createAnonPost);

// ── Reactions & Moderation ──────────────────────────────────────────────────
router.put("/:id/like",    protect, toggleAnonLike);
router.put("/:id/dislike", protect, toggleAnonDislike);
router.put("/:id/report",  protect, reportAnonPost);

// ── Delete post (owner only) ─────────────────────────────────────────────────
router.delete("/:id", protect, deleteAnonPost);

// ── Comments ─────────────────────────────────────────────────────────────────
router.get   ("/:id/comments",              protect, getAnonComments);
router.post  ("/:id/comment",               protect, addAnonComment);
router.delete("/:id/comment/:commentId",    protect, deleteAnonComment);

export default router;
