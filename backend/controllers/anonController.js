/**
 * anonController.js — Anonymous Post Controllers
 *
 * Handles all anonymous board operations:
 *  - createAnonPost  → POST   /api/anon              (protected)
 *  - getAnonPosts    → GET    /api/anon               (protected + pagination)
 *  - toggleAnonLike  → PUT    /api/anon/:id/like      (protected)
 *  - reportAnonPost  → PUT    /api/anon/:id/report    (protected)
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  SECURITY RULE — CRITICAL                                   │
 * │  `realAuthor` must NEVER appear in any client response.     │
 * │  This file enforces that with TWO layers of protection:     │
 * │                                                             │
 * │  Layer 1 (schema): `realAuthor` has `select: false` in the  │
 * │           AnonPost schema — Mongoose omits it by default.   │
 * │                                                             │
 * │  Layer 2 (controller): Every query below explicitly chains  │
 * │           .select('-realAuthor') as a fail-safe.            │
 * │                                                             │
 * │  DO NOT remove either layer. Both must stay in place.       │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Auto-moderation rule:
 *  - If a post accumulates >= REPORT_THRESHOLD (5) unique reports,
 *    it is automatically hidden from the public feed (isHidden: true).
 */

import AnonPost from "../models/AnonPost.js";

// Number of unique reports required to auto-hide a post
const REPORT_THRESHOLD = 5;

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a new anonymous post
// @route   POST /api/anon
// @access  Protected
//
// The authenticated user's ID is stored as `realAuthor` in the DB,
// but is NEVER returned to the client in this or any other response.
// ─────────────────────────────────────────────────────────────────────────────
export const createAnonPost = async (req, res, next) => {
  try {
    const { content } = req.body;

    // ── Validation ────────────────────────────────────────────────────────
    if (!content || content.trim() === "") {
      res.status(400);
      return next(new Error("Post content is required"));
    }

    if (content.trim().length > 500) {
      res.status(400);
      return next(new Error("Post content cannot exceed 500 characters"));
    }

    // ── Create the post — realAuthor stored, NEVER returned ───────────────
    // We create with realAuthor so it persists to the DB, then immediately
    // re-fetch with .select('-realAuthor') so the response is clean.
    const post = await AnonPost.create({
      realAuthor: req.user._id, // stored silently for moderation
      content: content.trim(),
    });

    // ── Re-fetch without realAuthor for the response ──────────────────────
    // Layer 2 defence: explicit exclusion on the read query.
    // Even if the schema's `select: false` were ever changed, this ensures
    // realAuthor is still omitted from the HTTP response.
    const safePost = await AnonPost.findById(post._id).select("-realAuthor");

    return res.status(201).json({
      success: true,
      post: safePost,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get paginated anonymous feed (newest first, visible posts only)
// @route   GET /api/anon?page=1&limit=10
// @access  Protected
//
// Hidden posts (isHidden: true) are excluded. realAuthor is never included.
// ─────────────────────────────────────────────────────────────────────────────
export const getAnonPosts = async (req, res, next) => {
  try {
    // ── Parse and sanitise pagination params ──────────────────────────────
    let page  = parseInt(req.query.page,  10);
    let limit = parseInt(req.query.limit, 10);

    // Fall back to safe defaults; cap limit to prevent payload abuse
    if (isNaN(page)  || page  < 1) page  = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 20) limit = 20;

    const skip = (page - 1) * limit;

    // ── Query — visible posts only, newest first, paginated ──────────────
    // Layer 2 defence: .select('-realAuthor') on every query.
    const [posts, totalCount] = await Promise.all([
      AnonPost.find({ isHidden: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-realAuthor"), // ← NEVER populate or expose realAuthor
      AnonPost.countDocuments({ isHidden: false }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      posts,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Toggle like on an anonymous post (like / unlike)
// @route   PUT /api/anon/:id/like
// @access  Protected
//
// Business rule: like and dislike are mutually exclusive — liking removes
// any existing dislike from the same user (mirrors the regular post system).
// realAuthor is NEVER included in the response.
// ─────────────────────────────────────────────────────────────────────────────
export const toggleAnonLike = async (req, res, next) => {
  try {
    // Layer 2 defence: select('-realAuthor') on the fetch
    const post = await AnonPost.findById(req.params.id).select("-realAuthor");

    if (!post) {
      res.status(404);
      return next(new Error("Anonymous post not found"));
    }

    // Hidden posts cannot be liked — they shouldn't be visible in the UI,
    // but we guard here as a belt-and-suspenders check.
    if (post.isHidden) {
      res.status(403);
      return next(new Error("This post has been removed"));
    }

    const userId      = req.user._id;
    const alreadyLiked = post.likes.some((id) => id.equals(userId));

    if (alreadyLiked) {
      // ── Unlike ──────────────────────────────────────────────────────────
      post.likes.pull(userId);
    } else {
      // ── Like + remove any existing dislike (mutual exclusivity) ─────────
      post.likes.push(userId);
      post.dislikes.pull(userId);
    }

    await post.save();

    return res.status(200).json({
      success: true,
      likes:   post.likes.length,
      liked:   !alreadyLiked,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Report an anonymous post
// @route   PUT /api/anon/:id/report
// @access  Protected
//
// Each user can report a post only once (idempotent — duplicate reports are
// silently ignored). When the report count reaches REPORT_THRESHOLD (5),
// the post is automatically hidden from the public feed.
// ─────────────────────────────────────────────────────────────────────────────
export const reportAnonPost = async (req, res, next) => {
  try {
    // Layer 2 defence: select('-realAuthor') on the fetch
    const post = await AnonPost.findById(req.params.id).select("-realAuthor");

    if (!post) {
      res.status(404);
      return next(new Error("Anonymous post not found"));
    }

    // ── Idempotency — each user can report only once ──────────────────────
    const userId        = req.user._id;
    const alreadyReported = post.reports.some((id) => id.equals(userId));

    if (alreadyReported) {
      // Return 200 (not an error) — the report stands, just don't double-add.
      return res.status(200).json({
        success: true,
        message: "Post already reported",
      });
    }

    // ── Add the report ────────────────────────────────────────────────────
    post.reports.push(userId);

    // ── Auto-moderation — hide post when threshold is reached ─────────────
    if (post.reports.length >= REPORT_THRESHOLD) {
      post.isHidden = true;
    }

    await post.save();

    return res.status(200).json({
      success: true,
      message: "Post reported",
    });
  } catch (error) {
    next(error);
  }
};
