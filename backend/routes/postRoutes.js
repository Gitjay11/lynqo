/**
 * postRoutes.js — Community Feed Routes
 *
 * All routes are protected by the `protect` JWT middleware.
 *
 * Route map (exact blueprint):
 *  GET    /api/posts                        → protect, getFeedPosts   (?page=1&limit=10)
 *  POST   /api/posts                        → protect, upload.single('image'), createPost
 *  DELETE /api/posts/:id                    → protect, deletePost     (owner only)
 *  PUT    /api/posts/:id/like               → protect, toggleLike
 *  POST   /api/posts/:id/comment            → protect, addComment
 *  DELETE /api/posts/:id/comment/:commentId → protect, deleteComment  (comment or post owner)
 */

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { uploadPostImage } from "../middleware/uploadMiddleware.js";
import {
  createPost,
  getFeedPosts,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
} from "../controllers/postController.js";

const router = express.Router();

// ── Feed ──────────────────────────────────────────────────────────────────

// GET /api/posts — Retrieve paginated feed (newest first)
router.get("/", protect, getFeedPosts);

// POST /api/posts — Create a new post (image attachment is optional)
// If no file is sent, req.file is undefined and the controller sets image: null.
router.post("/", protect, uploadPostImage.single("image"), createPost);

// ── Single post operations ────────────────────────────────────────────────

// DELETE /api/posts/:id — Delete a post (owner only; Cloudinary asset cleaned up)
router.delete("/:id", protect, deletePost);

// ── Reactions ─────────────────────────────────────────────────────────────

// PUT /api/posts/:id/like — Toggle like on a post
router.put("/:id/like", protect, toggleLike);

// ── Comments ──────────────────────────────────────────────────────────────

// POST   /api/posts/:id/comment              — Add a comment to a post
router.post("/:id/comment", protect, addComment);

// DELETE /api/posts/:id/comment/:commentId   — Delete a comment (comment author or post author)
router.delete("/:id/comment/:commentId", protect, deleteComment);

export default router;
