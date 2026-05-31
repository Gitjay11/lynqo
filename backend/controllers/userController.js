/**
 * userController.js — User Profile Controllers
 *
 * Handles all user-facing profile operations:
 *  - getUserProfile  → GET  /api/users/:id              (protected)
 *  - updateProfile   → PUT  /api/users/update           (protected)
 *  - uploadAvatar    → PUT  /api/users/upload-avatar    (protected + multer)
 *  - searchUsers     → GET  /api/users/search           (protected)
 *  - followUser      → PUT  /api/users/:id/follow       (protected)
 *  - unfollowUser    → PUT  /api/users/:id/unfollow     (protected)
 *  - getFollowers    → GET  /api/users/:id/followers    (protected)
 *  - getFollowing    → GET  /api/users/:id/following    (protected)
 *
 * Security notes:
 *  - Password is NEVER returned in any response.
 *  - Email and password cannot be updated through updateProfile.
 *  - Semester is validated to be 1–8 before save.
 *  - Search results are limited to 10 and expose only safe fields.
 *  - Regex input is escaped to prevent ReDoS attacks.
 *  - Users cannot follow themselves (400 guard in followUser).
 */

import User from "../models/User.js";
import { createNotification } from "../utils/createNotification.js";

// ── Helper — build the safe public user payload (no password) ─────────────
// Used consistently across all responses that return user data.
// Includes `bio`, `createdAt`, social graph counts, and all new extended
// profile fields. `isFollowing` is optional — only provided by getUserProfile.
const buildUserPayload = (user, extras = {}) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  branch: user.branch,
  semester: user.semester,
  bio: user.bio,
  profilePicture: user.profilePicture,
  createdAt: user.createdAt,
  // Social graph — counts derived from the arrays stored on the document
  followerCount:  user.followers?.length  ?? 0,
  followingCount: user.following?.length  ?? 0,
  // ── Extended profile fields ──────────────────────────────────────────────
  phone:         user.phone         ?? "",
  gender:        user.gender        ?? "",
  dateOfBirth:   user.dateOfBirth   ?? null,
  yearOfJoining: user.yearOfJoining ?? null,
  rollNumber:    user.rollNumber    ?? "",
  hostelOrDay:   user.hostelOrDay   ?? "",
  clubs:         user.clubs         ?? "",
  skills:        user.skills        ?? [],
  hobbies:       user.hobbies       ?? [],
  lookingFor:    user.lookingFor    ?? [],
  github:        user.github        ?? "",
  linkedin:      user.linkedin      ?? "",
  instagram:     user.instagram     ?? "",
  ...extras, // allows callers to inject isFollowing, etc.
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get any user's public profile by ID
// @route   GET /api/users/:id
// @access  Protected (requires valid JWT)
//
// Returns followerCount, followingCount, and isFollowing so the profile page
// can render the follow button and stat counts in a single round-trip.
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

    // Determine whether the requesting user already follows this profile.
    // We compare ObjectId strings so both ObjectId and string types work.
    const isFollowing = user.followers.some(
      (followerId) => followerId.toString() === req.user._id.toString()
    );

    return res.status(200).json({
      success: true,
      user: buildUserPayload(user, { isFollowing }),
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
// Allowed fields : name, branch, semester, bio + all 13 extended fields
// BLOCKED fields : email, password (silently ignored — never patched)
// ─────────────────────────────────────────────────────────────────────────────

// Valid values for enum-backed fields (mirrors the Mongoose schema enums)
const VALID_GENDER       = new Set(["Male", "Female", "Prefer not to say", ""]);
const VALID_HOSTEL       = new Set(["Hostel", "Day Scholar", ""]);
const VALID_LOOKING_FOR  = new Set(["Study Partner", "Project Collab", "Hackathon Team", "Friends", "Networking"]);

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
    if (req.body.semester !== undefined) {
      const sem = Number(req.body.semester);
      if (!Number.isInteger(sem) || sem < 1 || sem > 8) {
        res.status(400);
        return next(new Error("Semester must be a whole number between 1 and 8"));
      }
    }

    // ── Validate yearOfJoining ────────────────────────────────────────────
    if (req.body.yearOfJoining !== undefined && req.body.yearOfJoining !== null && req.body.yearOfJoining !== "") {
      const yr = Number(req.body.yearOfJoining);
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(yr) || yr < 2000 || yr > currentYear + 1) {
        res.status(400);
        return next(new Error(`Year of joining must be between 2000 and ${currentYear + 1}`));
      }
    }

    // ── Validate gender enum ──────────────────────────────────────────────
    if (req.body.gender !== undefined && !VALID_GENDER.has(req.body.gender)) {
      res.status(400);
      return next(new Error("Invalid gender value"));
    }

    // ── Validate hostelOrDay enum ─────────────────────────────────────────
    if (req.body.hostelOrDay !== undefined && !VALID_HOSTEL.has(req.body.hostelOrDay)) {
      res.status(400);
      return next(new Error("hostelOrDay must be 'Hostel', 'Day Scholar', or empty"));
    }

    // ── Validate lookingFor array items ───────────────────────────────────
    if (req.body.lookingFor !== undefined) {
      if (!Array.isArray(req.body.lookingFor)) {
        res.status(400);
        return next(new Error("lookingFor must be an array"));
      }
      const invalidItems = req.body.lookingFor.filter((v) => !VALID_LOOKING_FOR.has(v));
      if (invalidItems.length > 0) {
        res.status(400);
        return next(new Error(`Invalid lookingFor values: ${invalidItems.join(", ")}`));
      }
    }

    // ── Apply only the explicitly allowed fields (mass-assignment safe) ────
    // Core fields
    if (req.body.name     !== undefined) user.name     = req.body.name.trim();
    if (req.body.branch   !== undefined) user.branch   = req.body.branch.trim();
    if (req.body.semester !== undefined) user.semester = Number(req.body.semester);
    if (req.body.bio      !== undefined) user.bio      = req.body.bio.trim();

    // Personal Information
    if (req.body.phone       !== undefined) user.phone       = req.body.phone.trim();
    if (req.body.gender      !== undefined) user.gender      = req.body.gender;
    if (req.body.dateOfBirth !== undefined) user.dateOfBirth = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null;

    // Academic Information
    if (req.body.yearOfJoining !== undefined) {
      user.yearOfJoining = (req.body.yearOfJoining === null || req.body.yearOfJoining === "")
        ? null
        : Number(req.body.yearOfJoining);
    }
    if (req.body.rollNumber !== undefined) user.rollNumber = req.body.rollNumber.trim();

    // Campus Life
    if (req.body.hostelOrDay !== undefined) user.hostelOrDay = req.body.hostelOrDay;
    if (req.body.clubs       !== undefined) user.clubs       = req.body.clubs.trim();

    // Skills & Interests — sanitise each array item to a trimmed non-empty string
    if (req.body.skills    !== undefined && Array.isArray(req.body.skills)) {
      user.skills    = req.body.skills.map((s) => String(s).trim()).filter(Boolean);
    }
    if (req.body.hobbies   !== undefined && Array.isArray(req.body.hobbies)) {
      user.hobbies   = req.body.hobbies.map((h) => String(h).trim()).filter(Boolean);
    }
    if (req.body.lookingFor !== undefined) user.lookingFor = req.body.lookingFor;

    // Social Links
    if (req.body.github    !== undefined) user.github    = req.body.github.trim();
    if (req.body.linkedin  !== undefined) user.linkedin  = req.body.linkedin.trim();
    if (req.body.instagram !== undefined) user.instagram = req.body.instagram.trim();

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
//  1. multer (memoryStorage) intercepts the multipart body, stores the file in memory.
//  2. The toCloudinary middleware streams the buffer to Cloudinary via upload_stream.
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

    // req.file.path is the Cloudinary-hosted URL set by the toCloudinary middleware.
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

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Follow a user
// @route   PUT /api/users/:id/follow
// @access  Protected (requires valid JWT)
//
// Guards:
//  - Cannot follow yourself → 400
//  - Already following      → 400
// On success:
//  - Uses $addToSet on both documents (atomic, no duplicates at DB level)
//  - Creates a follow notification for the target user (fire-and-forget)
// ─────────────────────────────────────────────────────────────────────────────
export const followUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const selfId   = req.user._id.toString();

    // ── Guard: cannot follow yourself ──────────────────────────────────────
    if (targetId === selfId) {
      res.status(400);
      return next(new Error("You cannot follow yourself"));
    }

    // ── Fetch target user ──────────────────────────────────────────────────
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      res.status(404);
      return next(new Error("User not found"));
    }

    // ── Guard: already following ───────────────────────────────────────────
    const alreadyFollowing = targetUser.followers.some(
      (id) => id.toString() === selfId
    );
    if (alreadyFollowing) {
      res.status(400);
      return next(new Error("Already following this user"));
    }

    // ── Atomically update both documents ──────────────────────────────────
    // $addToSet prevents duplicate entries even under concurrent requests.
    await Promise.all([
      User.findByIdAndUpdate(targetId,      { $addToSet: { followers: req.user._id } }),
      User.findByIdAndUpdate(req.user._id,  { $addToSet: { following: targetId    } }),
    ]);

    // ── Create follow notification (fire-and-forget, never throws) ─────────
    await createNotification({
      recipient:  targetUser._id,
      sender:     req.user._id,
      senderName: req.user.name,
      type:       "follow",
    });

    return res.status(200).json({ success: true, message: "Followed successfully" });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Unfollow a user
// @route   PUT /api/users/:id/unfollow
// @access  Protected (requires valid JWT)
//
// Uses $pull to remove ObjectIds from both arrays atomically.
// Idempotent — no error if the user was not following.
// ─────────────────────────────────────────────────────────────────────────────
export const unfollowUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;

    // ── Guard: cannot unfollow yourself ───────────────────────────────────
    if (targetId === req.user._id.toString()) {
      res.status(400);
      return next(new Error("You cannot unfollow yourself"));
    }

    // ── Atomically remove from both arrays ────────────────────────────────
    await Promise.all([
      User.findByIdAndUpdate(targetId,      { $pull: { followers: req.user._id } }),
      User.findByIdAndUpdate(req.user._id,  { $pull: { following: targetId    } }),
    ]);

    return res.status(200).json({ success: true, message: "Unfollowed successfully" });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all followers for a user
// @route   GET /api/users/:id/followers
// @access  Protected (requires valid JWT)
//
// Populates name, profilePicture, branch, semester — the fields the modal
// list card needs. Password and email are never included.
// ─────────────────────────────────────────────────────────────────────────────
export const getFollowers = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("followers")
      .populate("followers", "name profilePicture branch semester");

    if (!user) {
      res.status(404);
      return next(new Error("User not found"));
    }

    return res.status(200).json({ success: true, followers: user.followers });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all users that a user is following
// @route   GET /api/users/:id/following
// @access  Protected (requires valid JWT)
//
// Populates name, profilePicture, branch, semester — same shape as getFollowers.
// ─────────────────────────────────────────────────────────────────────────────
export const getFollowing = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("following")
      .populate("following", "name profilePicture branch semester");

    if (!user) {
      res.status(404);
      return next(new Error("User not found"));
    }

    return res.status(200).json({ success: true, following: user.following });
  } catch (error) {
    next(error);
  }
};
