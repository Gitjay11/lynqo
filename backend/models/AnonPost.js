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
 *  - likes       → [ObjectId ref User]
 *  - dislikes    → [ObjectId ref User]
 *  - reports     → [ObjectId ref User] — used for auto-moderation
 *  - isHidden    → Boolean, default false — set true when reports >= 5
 *  - timestamps  → createdAt + updatedAt (auto)
 */

import mongoose from "mongoose";

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
    // Set automatically by auto-moderation, or manually by an admin.
    isHidden: {
      type: Boolean,
      default: false,
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

// ── Create and export the model ───────────────────────────────────────────
const AnonPost = mongoose.model("AnonPost", anonPostSchema);
export default AnonPost;
