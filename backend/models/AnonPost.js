/**
 * AnonPost.js — Mongoose Anonymous Post Model
 *
 * Anonymous posts are publicly visible with zero author identity exposed to
 * any client-facing API response. The real author is stored for moderation
 * purposes only (e.g., admin tools, abuse handling).
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  SECURITY RULE — CRITICAL                                   │
 * │  `realAuthor` is marked `select: false` at the schema level │
 * │  so Mongoose NEVER returns it unless explicitly requested   │
 * │  with .select('+realAuthor'). This is the primary defence   │
 * │  against accidental author exposure.                        │
 * │                                                             │
 * │  Controllers add a second defence with .select('-realAuthor')│
 * │  on every query. Both layers must remain in place.         │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Fields:
 *  - realAuthor  → ObjectId ref User | select: false | NEVER sent to client
 *  - content     → String, max 500 chars (required)
 *  - image       → String, Cloudinary URL (optional)
 *  - likes       → [ObjectId ref User]
 *  - dislikes    → [ObjectId ref User]
 *  - reports     → [ObjectId ref User] — used for auto-moderation
 *  - isHidden    → Boolean, default false — set true when reports >= 5
 *  - timestamps  → createdAt + updatedAt (auto)
 */

import mongoose from "mongoose";

// ── Anonymous Comment Subdocument Schema ──────────────────────────────────
// realCommenter is stored only for isOwner computation and moderation.
// It is NEVER sent to the client — same two-layer defence as realAuthor.
const anonCommentSchema = new mongoose.Schema(
  {
    // SENSITIVE — hidden from all API responses (select: false)
    realCommenter: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      select:   false,
    },
    content: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: [300, "Comment cannot exceed 300 characters"],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// ── Anonymous Post Schema ──────────────────────────────────────────────────
const anonPostSchema = new mongoose.Schema(
  {
    // ── SENSITIVE — real author identity, hidden from all API responses ────
    // `select: false` means this field is EXCLUDED from query results unless
    // the caller explicitly opts in with `.select('+realAuthor')`.
    // Only admin/moderation routes should ever do that.
    realAuthor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Anonymous post must have a real author (internal use)"],
      select: false, // ← PRIMARY security gate — never returned by default
    },

    // ── Post body ──────────────────────────────────────────────────────────
    content: {
      type: String,
      required: [true, "Post content is required"],
      trim: true,
      maxlength: [500, "Post content cannot exceed 500 characters"],
    },

    // ── Optional image attachment (Cloudinary URL) ─────────────────────────
    // Stored as a plain string. If no image is uploaded, defaults to null.
    // Follows the same pattern as the regular Post model.
    image: {
      type: String,
      default: null,
    },

    // ── Reactions ──────────────────────────────────────────────────────────
    // Like/dislike are mutually exclusive — enforced in the controller,
    // not at the schema level (keeping the schema simple and focused).
    likes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },

    dislikes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },

    // ── Moderation ─────────────────────────────────────────────────────────
    // `reports` tracks which users have flagged this post.
    // When reports.length reaches the REPORT_THRESHOLD (5),
    // `isHidden` is set to true automatically by reportAnonPost.
    reports: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },

    // When true, this post is excluded from the public feed.
    isHidden: {
      type:    Boolean,
      default: false,
    },

    // ── Anonymous comments ──────────────────────────────────────────────
    // realCommenter is select:false — isOwner is computed server-side.
    comments: {
      type:    [anonCommentSchema],
      default: [],
    },
  },
  {
    // Adds `createdAt` and `updatedAt` fields automatically
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────
// The dominant query is: fetch visible posts, newest first.
// A compound index on (isHidden, createdAt) covers this pattern efficiently.
anonPostSchema.index({ isHidden: 1, createdAt: -1 });

// Full-text search index on content for the global search feature.
// Only visible posts (isHidden: false) are returned by searchAnonPosts,
// so this index is filtered in the controller — not at the index level.
anonPostSchema.index({ content: 'text' });

// ── Create and export the model ───────────────────────────────────────────
const AnonPost = mongoose.model("AnonPost", anonPostSchema);
export default AnonPost;
