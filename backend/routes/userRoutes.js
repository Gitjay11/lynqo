/**
 * userRoutes.js — User Profile Routes
 *
 * All routes are mounted at /api/users in server.js.
 *
 * Route map:
 *  GET  /api/users/search              → protect, searchUsers
 *  GET  /api/users/:id                 → protect, getUserProfile
 *  PUT  /api/users/update              → protect, updateProfile
 *  PUT  /api/users/upload-avatar       → protect, upload.single("avatar"), uploadAvatar
 *  PUT  /api/users/:id/follow          → protect, followUser
 *  PUT  /api/users/:id/unfollow        → protect, unfollowUser
 *  GET  /api/users/:id/followers       → protect, getFollowers
 *  GET  /api/users/:id/following       → protect, getFollowing
 *
 * ⚠️  ORDER MATTERS: The /search route MUST be declared before /:id.
 *     Express matches routes top-to-bottom. If /:id is declared first,
 *     a request to GET /api/users/search will match /:id with id="search",
 *     causing a Mongoose CastError instead of running the search handler.
 *
 *     The sub-routes /:id/follow etc. do NOT conflict because Express matches
 *     the most specific path first — /:id/follow is more specific than /:id.
 */

import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { uploadAvatar as uploadAvatarMiddleware } from "../middleware/uploadMiddleware.js";
import {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
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

// ── PUT /api/users/:id/follow ─────────────────────────────────────────────
// Toggles follow relationship: adds req.user to target's followers array.
// Fires a "follow" notification to the target user.
router.put("/:id/follow",   protect, followUser);

// ── PUT /api/users/:id/unfollow ───────────────────────────────────────────
// Removes req.user from target's followers array (and target from following).
router.put("/:id/unfollow", protect, unfollowUser);

// ── GET /api/users/:id/followers ──────────────────────────────────────────
// Returns the populated list of all users who follow :id.
router.get("/:id/followers", protect, getFollowers);

// ── GET /api/users/:id/following ──────────────────────────────────────────
// Returns the populated list of all users that :id is following.
router.get("/:id/following", protect, getFollowing);

export default router;
