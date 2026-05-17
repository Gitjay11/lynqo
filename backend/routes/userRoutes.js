/**
 * userRoutes.js — User Profile Routes
 *
 * All routes are mounted at /api/users in server.js.
 *
 * Route map:
 *  GET  /api/users/search          → protect, searchUsers
 *  GET  /api/users/:id             → protect, getUserProfile
 *  PUT  /api/users/update          → protect, updateProfile
 *  PUT  /api/users/upload-avatar   → protect, upload.single("avatar"), uploadAvatar
 *
 * ⚠️  ORDER MATTERS: The /search route MUST be declared before /:id.
 *     Express matches routes top-to-bottom. If /:id is declared first,
 *     a request to GET /api/users/search will match /:id with id="search",
 *     causing a Mongoose CastError instead of running the search handler.
 */

import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { uploadAvatar as uploadAvatarMiddleware } from "../middleware/uploadMiddleware.js";
import {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  searchUsers,
} from "../controllers/userController.js";

const router = express.Router();

// ── GET /api/users/search?q=<query> ──────────────────────────────────────
// Declared FIRST to prevent Express matching "search" as the :id param.
router.get("/search", protect, searchUsers);

// ── GET /api/users/:id ───────────────────────────────────────────────────
// Returns the full public profile for any user by their MongoDB ObjectId.
router.get("/:id", protect, getUserProfile);

// ── PUT /api/users/update ────────────────────────────────────────────────
// Updates the authenticated user's own profile (name, branch, semester, bio).
router.put("/update", protect, updateProfile);

// ── PUT /api/users/upload-avatar ─────────────────────────────────────────
// Accepts a multipart/form-data request with field name "avatar".
// Multer streams the file to Cloudinary before the controller runs.
router.put(
  "/upload-avatar",
  protect,
  uploadAvatarMiddleware.single("avatar"),
  uploadAvatar
);

export default router;
