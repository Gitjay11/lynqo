/**
 * userController.js — User Profile Controllers
 *
 * Handles all user-facing profile operations:
 *  - getUserProfile  → GET  /api/users/:id          (protected)
 *  - updateProfile   → PUT  /api/users/update        (protected)
 *  - uploadAvatar    → PUT  /api/users/upload-avatar (protected + multer)
 *  - searchUsers     → GET  /api/users/search        (protected)
 *
 * Security notes:
 *  - Password is NEVER returned in any response.
 *  - Email and password cannot be updated through updateProfile.
 *  - Semester is validated to be 1–8 before save.
 *  - Search results are limited to 10 and expose only safe fields.
 *  - Regex input is escaped to prevent ReDoS attacks.
 */

import User from "../models/User.js";

// ── Helper — build the safe public user payload (no password) ─────────────
// Used consistently across all responses that return user data.
// Includes `bio` and `createdAt` which are relevant for profile pages.
const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  branch: user.branch,
  semester: user.semester,
  bio: user.bio,
  profilePicture: user.profilePicture,
  createdAt: user.createdAt,
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get any user's public profile by ID
// @route   GET /api/users/:id
// @access  Protected (requires valid JWT)
// ─────────────────────────────────────────────────────────────────────────────
export const getUserProfile = async (req, res, next) => {
  try {
    // .select("-password") ensures the hashed password is never sent in a response.
    // The global errorHandler converts Mongoose CastError (bad ObjectId) → 400
    // automatically, so we don't need a manual ObjectId format check here.
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      res.status(404);
      return next(new Error("User not found"));
    }

    return res.status(200).json({
      success: true,
      user: buildUserPayload(user),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update the authenticated user's own profile
// @route   PUT /api/users/update
// @access  Protected (requires valid JWT)
//
// Allowed fields : name, branch, semester, bio
// BLOCKED fields : email, password (silently ignored — never patched)
// ─────────────────────────────────────────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    // req.user is attached by `protect`. We re-fetch a full Mongoose document
    // so we can use instance methods (.save()) and trigger the pre-save hook.
    const user = await User.findById(req.user._id);

    if (!user) {
      // Edge case: account was deleted between token issuance and this request
      res.status(404);
      return next(new Error("User not found"));
    }

    // ── Validate semester BEFORE applying changes ─────────────────────────
    // Only validate if the caller actually provided the semester field.
    if (req.body.semester !== undefined) {
      const sem = Number(req.body.semester);
      if (!Number.isInteger(sem) || sem < 1 || sem > 8) {
        res.status(400);
        return next(
          new Error("Semester must be a whole number between 1 and 8")
        );
      }
    }

    // ── Apply only the explicitly allowed fields ──────────────────────────
    // Explicit field picking prevents mass-assignment vulnerabilities where a
    // malicious caller could inject `email`, `password`, `__v`, etc.
    if (req.body.name !== undefined) user.name = req.body.name.trim();
    if (req.body.branch !== undefined) user.branch = req.body.branch.trim();
    if (req.body.semester !== undefined) user.semester = Number(req.body.semester);
    if (req.body.bio !== undefined) user.bio = req.body.bio.trim();

    // Persist — the pre-save hook fires but skips re-hashing because
    // `isModified("password")` is false (we never touched the password field).
    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      user: buildUserPayload(updatedUser),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Upload or replace the authenticated user's profile picture
// @route   PUT /api/users/upload-avatar
// @access  Protected (requires valid JWT + multer upload middleware)
//
// Flow:
//  1. `uploadAvatar.single("avatar")` middleware intercepts the multipart body.
//  2. multer-storage-cloudinary streams the file to Cloudinary.
//  3. Cloudinary returns metadata; req.file.path holds the hosted HTTPS URL.
//  4. We save that URL to profilePicture and return the updated user.
// ─────────────────────────────────────────────────────────────────────────────
export const uploadAvatar = async (req, res, next) => {
  try {
    // Guard: multer populates req.file on success. If it is absent, no file
    // was included in the request or the file was rejected by the file filter.
    if (!req.file) {
      res.status(400);
      return next(
        new Error(
          'No image file provided. Send a multipart/form-data request with field name "avatar".'
        )
      );
    }

    // req.file.path is the Cloudinary-hosted URL set by multer-storage-cloudinary.
    const cloudinaryUrl = req.file.path;

    // findByIdAndUpdate is used for efficiency — no need to load the full
    // document and trigger the pre-save hook just to patch one field.
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: cloudinaryUrl },
      { new: true, select: "-password" } // `new: true` returns the post-update doc
    );

    if (!updatedUser) {
      res.status(404);
      return next(new Error("User not found"));
    }

    return res.status(200).json({
      success: true,
      user: buildUserPayload(updatedUser),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Search users by name (case-insensitive partial match)
// @route   GET /api/users/search?q=<query>
// @access  Protected (requires valid JWT)
//
// Returns only the fields needed for a compact search result card.
// Results are capped at 10 to keep response sizes and query costs predictable.
// ─────────────────────────────────────────────────────────────────────────────
export const searchUsers = async (req, res, next) => {
  try {
    const query = req.query.q;

    // Require a non-empty search term to avoid accidentally returning all users
    if (!query || query.trim() === "") {
      res.status(400);
      return next(new Error("Search query ?q= is required"));
    }

    // Escape special regex metacharacters in the user-provided string.
    // This prevents ReDoS (Regular Expression Denial of Service) attacks
    // where a crafted string like ".*.*.*" could cause catastrophic backtracking.
    const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Case-insensitive partial-match search on the `name` field using $regex.
    const users = await User.find({
      name: { $regex: escapedQuery, $options: "i" },
    })
      // Select only the fields needed for a search result card
      .select("_id name branch semester profilePicture")
      .limit(10)
      // Alphabetical sort for a consistent, predictable result order
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        branch: u.branch,
        semester: u.semester,
        profilePicture: u.profilePicture,
      })),
    });
  } catch (error) {
    next(error);
  }
};
