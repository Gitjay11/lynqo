/**
 * searchController.js — Global Search
 *
 * @desc    globalSearch — single endpoint that searches users, feed posts,
 *          and anonymous posts concurrently and returns ranked results.
 *
 * @route   GET /api/search?q=searchterm&type=all
 * @access  Protected (JWT required via `protect` middleware)
 *
 * Query params:
 *  q    {string}  — search term (min 2 chars, required)
 *  type {string}  — one of: all | users | posts | anon  (default: all)
 *
 * Security notes:
 *  - realAuthor is NEVER populated or returned for anonymous posts.
 *  - Input is trimmed and regex-escaped before being used in a MongoDB query
 *    to prevent ReDoS attacks via crafted search strings.
 *  - Hidden anon posts (isHidden: true) are always excluded.
 */

import User     from "../models/User.js";
import Post     from "../models/Post.js";
import AnonPost from "../models/AnonPost.js";

// ── ReDoS guard — escape regex special characters ─────────────────────────
// Prevents attackers from injecting patterns like "(a+)+" that cause
// catastrophic backtracking in the regex engine.
const escapeRegex = (str) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ──────────────────────────────────────────────────────────────────────────────
// Internal helper: search users by name or branch (case-insensitive)
//
// Returns at most 5 results.
// Fields returned: _id, name, branch, semester, profilePicture
// ──────────────────────────────────────────────────────────────────────────────
const searchUsers = async (q) => {
  const pattern = new RegExp(escapeRegex(q), "i");

  return User.find({
    // OR — match name OR branch with the same regex
    $or: [
      { name:   pattern },
      { branch: pattern },
    ],
  })
    .select("name branch semester profilePicture")
    .limit(5)
    .lean();  // lean() returns plain JS objects — faster for read-only responses
};

// ──────────────────────────────────────────────────────────────────────────────
// Internal helper: search community feed posts by content
//
// Returns at most 5 results, newest first.
// Fields returned: _id, content, image, likes, author (name/pic/branch), createdAt
// ──────────────────────────────────────────────────────────────────────────────
const searchPosts = async (q) => {
  const pattern = new RegExp(escapeRegex(q), "i");

  return Post.find({ content: pattern })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("author", "name profilePicture branch")
    .select("content image likes author createdAt")
    .lean();
};

// ──────────────────────────────────────────────────────────────────────────────
// Internal helper: search anonymous posts by content
//
// SECURITY — realAuthor is NEVER populated or selected.
// Only returns posts where isHidden is false.
// Returns at most 5 results.
// Fields returned: _id, content, likes, createdAt
// ──────────────────────────────────────────────────────────────────────────────
const searchAnonPosts = async (q) => {
  const pattern = new RegExp(escapeRegex(q), "i");

  return AnonPost.find({
    content:  pattern,
    isHidden: false,          // never surface moderated / hidden posts
  })
    .sort({ createdAt: -1 })
    .limit(5)
    // Pure exclusion projection — MongoDB does NOT allow mixing exclusions
    // (-field) with explicit inclusions (field) in the same .select() call.
    // Using only exclusions lets Mongoose return all safe fields automatically.
    // realAuthor is excluded here as a second defence on top of select:false.
    .select("-realAuthor -isHidden -reports -dislikes -image -__v")
    .lean();
};

// ──────────────────────────────────────────────────────────────────────────────
// @desc    Global search across users, posts, and anon posts
// @route   GET /api/search?q=term&type=all
// @access  Protected
// ──────────────────────────────────────────────────────────────────────────────
export const globalSearch = async (req, res, next) => {
  try {
    // ── 1. Extract and sanitise query params ─────────────────────────────────
    const q    = (req.query.q    ?? "").trim();
    const type = (req.query.type ?? "all").toLowerCase();

    // ── 2. Minimum length guard ───────────────────────────────────────────────
    // Searching for 1-character terms is useless and expensive.
    if (q.length < 2) {
      res.status(400);
      return next(new Error("Search query must be at least 2 characters"));
    }

    // ── 3. Run searches in parallel ───────────────────────────────────────────
    // Promise.all executes all three DB queries concurrently.
    // The total latency is dominated by the slowest individual query,
    // not the sum — typically 3× faster than sequential awaits.
    const [users, posts, anonPosts] = await Promise.all([
      type === "all" || type === "users" ? searchUsers(q)     : [],
      type === "all" || type === "posts" ? searchPosts(q)     : [],
      type === "all" || type === "anon"  ? searchAnonPosts(q) : [],
    ]);

    // ── 4. Respond ────────────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      query:   q,
      results: {
        users,
        posts,
        anonPosts,
      },
      total: users.length + posts.length + anonPosts.length,
    });
  } catch (error) {
    next(error);
  }
};
