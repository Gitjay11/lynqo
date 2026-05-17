/**
 * Post.js — Mongoose Post Model
 *
 * Defines the schema for community feed posts.
 *
 * Fields:
 *  - author          → ObjectId ref User (required)
 *  - content         → String, max 500 chars (required)
 *  - image           → String, Cloudinary URL (optional)
 *  - likes           → [ObjectId ref User]  — users who liked
 *  - dislikes        → [ObjectId ref User]  — users who disliked
 *  - comments        → embedded subdocument array
 *      └ user        → ObjectId ref User
 *      └ text        → String, max 300 chars (required)
 *      └ createdAt   → Date, default now
 *  - timestamps:true → createdAt + updatedAt on the parent document
 *
 * NOTE: Mongoose automatically generates `_id` on each comment subdocument.
 * This is intentional — deleteComment uses subdoc._id to pull a specific comment.
 */

import mongoose from "mongoose";

// ── Comment Subdocument Schema ─────────────────────────────────────────────
// Defined separately so it can be referenced clearly and extended later
// (e.g., adding likes-on-comments in a future stage).
const commentSchema = new mongoose.Schema(
  {
    // The user who wrote this comment
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Comment must have an author"],
    },

    // The body of the comment
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      maxlength: [300, "Comment cannot exceed 300 characters"],
    },
  },
  {
    // Adds createdAt to each comment subdocument.
    // updatedAt is omitted intentionally — comments are immutable after creation.
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ── Post Schema ────────────────────────────────────────────────────────────
const postSchema = new mongoose.Schema(
  {
    // The user who created this post
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Post must have an author"],
    },

    // Main text content of the post
    content: {
      type: String,
      required: [true, "Post content is required"],
      trim: true,
      maxlength: [500, "Post content cannot exceed 500 characters"],
    },

    // Optional Cloudinary-hosted image URL
    // Stored as a plain string; Cloudinary public_id is derived from this URL
    // at deletion time (see postController.js → deletePost).
    image: {
      type: String,
      default: null,
    },

    // ── Reactions ────────────────────────────────────────────────────────
    // Stored as arrays of user ObjectIds.
    // Business rule: a user cannot simultaneously like AND dislike a post.
    // The toggleLike / toggleDislike controllers enforce mutual exclusivity.

    likes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },

    dislikes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },

    // ── Embedded comments ─────────────────────────────────────────────────
    // Using an embedded array (vs a separate collection) because:
    //  1. Comments are always read alongside the post — no extra round-trip.
    //  2. Simplifies pagination and atomic operations.
    //  3. 300-char limit + expected volume keeps document size manageable.
    comments: {
      type: [commentSchema],
      default: [],
    },
  },
  {
    // Adds top-level createdAt and updatedAt fields automatically
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────
// Sort by newest first is the dominant query pattern for the feed.
postSchema.index({ createdAt: -1 });

// ── Create and export the model ────────────────────────────────────────────
const Post = mongoose.model("Post", postSchema);
export default Post;
