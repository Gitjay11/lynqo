/**
 * anonController.js — Anonymous Post Controllers
 *
 * Handles all anonymous board operations:
 *  - createAnonPost    → POST   /api/anon                (protected, multipart/form-data)
 *  - getAnonPosts      → GET    /api/anon                (protected + pagination)
 *  - toggleAnonLike    → PUT    /api/anon/:id/like       (protected)
 *  - toggleAnonDislike → PUT    /api/anon/:id/dislike    (protected)
 *  - reportAnonPost    → PUT    /api/anon/:id/report     (protected)
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
import { v2 as cloudinary } from "cloudinary";
import { createNotification } from "../utils/createNotification.js";

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

    // ── Resolve optional image URL ─────────────────────────────────────────
    // req.file is populated by the uploadPostImage middleware when an image
    // is attached. req.file.path holds the Cloudinary secure_url after the
    // toCloudinary step runs. If no file was sent, req.file is undefined.
    const imageUrl = req.file?.path ?? null;

    // ── Create the post — realAuthor stored, NEVER returned ───────────────
    // We create with realAuthor so it persists to the DB, then immediately
    // re-fetch with .select('-realAuthor') so the response is clean.
    const post = await AnonPost.create({
      realAuthor: req.user._id, // stored silently for moderation
      content: content.trim(),
      image: imageUrl,          // null when no image was attached
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

    // ── Single-pass aggregation — computes isOwner without N+1 queries ───
    // $addFields computes isOwner by comparing realAuthor to the logged-in
    // user's _id server-side. realAuthor is projected OUT before the response
    // is sent so it never reaches the client.
    const [results, totalCount] = await Promise.all([
      AnonPost.aggregate([
        { $match: { isHidden: false } },
        { $sort:  { createdAt: -1 } },
        { $skip:  skip },
        { $limit: limit },
        {
          $addFields: {
            isOwner: { $eq: ["$realAuthor", req.user._id] },
          },
        },
        {
          // Explicitly remove realAuthor from the output — never reaches client
          $project: { realAuthor: 0 },
        },
      ]),
      AnonPost.countDocuments({ isHidden: false }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      posts: results,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// @desc    Delete an anonymous post (owner only)
// @route   DELETE /api/anon/:id
// @access  Protected
//
// realAuthor is fetched with +select to verify ownership, then discarded.
// The post is hard-deleted; Cloudinary image is also removed if present.
// ──────────────────────────────────────────────────────────────────────────────
export const deleteAnonPost = async (req, res, next) => {
  try {
    // Must fetch with +realAuthor to verify ownership (not returned to client)
    const post = await AnonPost.findById(req.params.id).select("+realAuthor");

    if (!post) {
      res.status(404);
      return next(new Error("Anonymous post not found"));
    }

    // Only the original author can delete their own post
    if (!post.realAuthor?.equals(req.user._id)) {
      res.status(403);
      return next(new Error("Not authorised to delete this post"));
    }

    // Remove Cloudinary image if one was attached
    if (post.image) {
      try {
        // Extract public_id from the Cloudinary URL
        const parts    = post.image.split("/");
        const fileName = parts[parts.length - 1].split(".")[0];
        const folder   = parts[parts.length - 2];
        await cloudinary.uploader.destroy(`${folder}/${fileName}`);
      } catch {
        // Non-fatal — continue with DB delete even if Cloudinary cleanup fails
      }
    }

    await post.deleteOne();

    return res.status(200).json({ success: true, message: "Post deleted" });
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

    // ── Notification: fire only when newly liking (not unliking) ─────────
    // PRIVACY: We must get realAuthor to know who to notify, but we must
    // NEVER expose it in the response. We use a separate internal query
    // with .select('+realAuthor') solely to obtain the recipient ID.
    // This value is used only for the notification and immediately discarded.
    if (!alreadyLiked) {
      try {
        const postWithAuthor = await AnonPost.findById(post._id).select("+realAuthor");
        if (postWithAuthor?.realAuthor) {
          await createNotification({
            recipient:  postWithAuthor.realAuthor,
            sender:     userId,
            senderName: req.user.name,
            type:       "like_anon",
            anonPostId: post._id,
          });
        }
      } catch (notifErr) {
        // Notification failure must not break the like response
        console.error("[toggleAnonLike] Notification error:", notifErr.message);
      }
    }

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
// @desc    Toggle dislike on an anonymous post (dislike / un-dislike)
// @route   PUT /api/anon/:id/dislike
// @access  Protected
//
// Business rule: like and dislike are mutually exclusive — disliking removes
// any existing like from the same user (mirrors the regular post system).
// realAuthor is NEVER included in the response.
// ─────────────────────────────────────────────────────────────────────────────
export const toggleAnonDislike = async (req, res, next) => {
  try {
    // Layer 2 defence: select('-realAuthor') on the fetch
    const post = await AnonPost.findById(req.params.id).select("-realAuthor");

    if (!post) {
      res.status(404);
      return next(new Error("Anonymous post not found"));
    }

    // Hidden posts cannot be disliked
    if (post.isHidden) {
      res.status(403);
      return next(new Error("This post has been removed"));
    }

    const userId          = req.user._id;
    const alreadyDisliked = post.dislikes.some((id) => id.equals(userId));

    if (alreadyDisliked) {
      // ── Un-dislike ──────────────────────────────────────────────────────
      post.dislikes.pull(userId);
    } else {
      // ── Dislike + remove any existing like (mutual exclusivity) ─────────
      post.dislikes.push(userId);
      post.likes.pull(userId);
    }

    await post.save();

    return res.status(200).json({
      success:   true,
      dislikes:  post.dislikes.length,
      disliked:  !alreadyDisliked,
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

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get comments for an anonymous post
// @route   GET /api/anon/:id/comments
// @access  Protected
//
// PRIVACY: All comments are shown as "Anonymous". The isOwner flag lets the
// current user know which comments are theirs (for delete button) without
// revealing any identity to other users.
// ─────────────────────────────────────────────────────────────────────────────
export const getAnonComments = async (req, res, next) => {
  try {
    // Fetch only the comments subdocument, excluding realAuthor on the parent
    // and realCommenter on each subdocument (select:false handles that).
    const post = await AnonPost.findById(req.params.id)
      .select("-realAuthor comments")
      .lean();

    if (!post) {
      res.status(404);
      return next(new Error("Anonymous post not found"));
    }

    const userId = req.user._id.toString();

    // For each comment, fetch realCommenter separately just to compute isOwner,
    // then discard it. This avoids a full populate that might expose the field.
    const PostModel = (await import("../models/AnonPost.js")).default;
    const postWithCommenters = await PostModel.findById(req.params.id)
      .select("comments")
      .populate({ path: "comments.realCommenter", select: "_id" });

    const comments = (post.comments ?? []).map((c, idx) => {
      const realId = postWithCommenters?.comments?.[idx]?.realCommenter?._id?.toString();
      return {
        _id:       c._id,
        content:   c.content,
        createdAt: c.createdAt,
        isOwner:   realId === userId,
      };
    });

    return res.status(200).json({ success: true, comments });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Add a comment to an anonymous post
// @route   POST /api/anon/:id/comment
// @access  Protected
//
// PRIVACY: realCommenter stored but never returned. The returned comment only
// contains _id, content, createdAt, and isOwner: true (it's always the
// commenter's own comment on creation).
// ─────────────────────────────────────────────────────────────────────────────
export const addAnonComment = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === "") {
      res.status(400);
      return next(new Error("Comment content is required"));
    }
    if (content.trim().length > 300) {
      res.status(400);
      return next(new Error("Comment cannot exceed 300 characters"));
    }

    const post = await AnonPost.findById(req.params.id).select("-realAuthor");
    if (!post) {
      res.status(404);
      return next(new Error("Anonymous post not found"));
    }
    if (post.isHidden) {
      res.status(403);
      return next(new Error("This post has been removed"));
    }

    post.comments.push({
      realCommenter: req.user._id,
      content:       content.trim(),
    });
    await post.save();

    const newComment = post.comments[post.comments.length - 1];

    return res.status(201).json({
      success: true,
      comment: {
        _id:       newComment._id,
        content:   newComment.content,
        createdAt: newComment.createdAt,
        isOwner:   true, // always true — user just posted it
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a comment from an anonymous post (own comment only)
// @route   DELETE /api/anon/:id/comment/:commentId
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const deleteAnonComment = async (req, res, next) => {
  try {
    // Need realCommenter to verify ownership — fetch with +realCommenter workaround
    const post = await AnonPost.findById(req.params.id).select("-realAuthor");
    if (!post) {
      res.status(404);
      return next(new Error("Anonymous post not found"));
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      res.status(404);
      return next(new Error("Comment not found"));
    }

    // Fetch realCommenter for ownership check (NOT returned in response)
    const PostModel = (await import("../models/AnonPost.js")).default;
    const postWithCommenter = await PostModel.findOne(
      { _id: req.params.id, "comments._id": req.params.commentId },
      { "comments.$": 1 }
    ).populate({ path: "comments.realCommenter", select: "_id" });

    const realCommenter = postWithCommenter?.comments?.[0]?.realCommenter?._id?.toString();
    if (realCommenter !== req.user._id.toString()) {
      res.status(403);
      return next(new Error("You can only delete your own comments"));
    }

    post.comments.pull({ _id: req.params.commentId });
    await post.save();

    return res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
};
