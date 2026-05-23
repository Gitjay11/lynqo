/**
 * postController.js — Community Feed Controllers
 *
 * Handles all post-related operations:
 *  - createPost     → POST   /api/posts                         (protected + optional image upload)
 *  - getFeedPosts   → GET    /api/posts                         (protected + pagination)
 *  - deletePost     → DELETE /api/posts/:id                     (protected, owner only)
 *  - toggleLike     → PUT    /api/posts/:id/like                (protected)
 *  - toggleDislike  → [no route yet — controller kept for future use]
 *  - addComment     → POST   /api/posts/:id/comment             (protected)
 *  - deleteComment  → DELETE /api/posts/:id/comment/:commentId  (protected)
 *
 * Security notes:
 *  - All routes require a valid JWT via the `protect` middleware.
 *  - Post deletion is restricted to the post author (403 if not owner).
 *  - Comment deletion is allowed for the comment author OR the post author.
 *  - Cloudinary assets are cleaned up on post deletion to avoid orphaned files.
 *  - Like and dislike reactions are mutually exclusive (toggling one removes the other).
 *  - Pagination limit is capped at 20 to prevent oversized payloads.
 */

import Post from "../models/Post.js";
import cloudinary from "../config/cloudinary.js";

// ── Helper — extract Cloudinary public_id from a hosted URL ───────────────
// Cloudinary URLs follow this structure:
//   https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<folder>/<filename>.<ext>
// We need everything after "/upload/" and before the file extension,
// e.g. "campus-platform/posts/abc123xyz"
//
// This is needed because cloudinary.uploader.destroy() accepts a public_id,
// not the full URL.
const extractPublicId = (url) => {
  try {
    // Split on "/upload/" and take the right half
    const afterUpload = url.split("/upload/")[1];
    if (!afterUpload) return null;

    // Strip the leading version segment if present ("v1234567890/")
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");

    // Strip the file extension (.jpg, .png, .webp, etc.)
    const publicId = withoutVersion.replace(/\.[^/.]+$/, "");
    return publicId;
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a new community post
// @route   POST /api/posts
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const createPost = async (req, res, next) => {
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

    // ── Image upload (optional) ───────────────────────────────────────────
    // If an image was attached, the uploadPostImage middleware (multer memoryStorage +
    // cloudinary upload_stream) has already uploaded it and placed the hosted URL in req.file.path.
    const imageUrl = req.file ? req.file.path : null;

    // ── Create and persist the post ───────────────────────────────────────
    const post = await Post.create({
      author: req.user._id,
      content: content.trim(),
      image: imageUrl,
    });

    // ── Populate author fields for the response ───────────────────────────
    // Re-fetching after create is the reliable way to get a fully populated doc.
    const populatedPost = await Post.findById(post._id).populate(
      "author",
      "name profilePicture branch"
    );

    return res.status(201).json({
      success: true,
      post: populatedPost,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get paginated community feed (newest first)
// @route   GET /api/posts?page=1&limit=10
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getFeedPosts = async (req, res, next) => {
  try {
    // ── Parse and sanitise pagination params ─────────────────────────────
    // parseInt returns NaN for non-numeric strings; fall back to defaults.
    let page  = parseInt(req.query.page,  10);
    let limit = parseInt(req.query.limit, 10);

    // Enforce sane defaults and bounds
    if (isNaN(page)  || page  < 1) page  = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 20) limit = 20; // Cap to prevent payload abuse

    const skip = (page - 1) * limit;

    // ── Query — sorted newest first, paginated ───────────────────────────
    const [posts, totalCount] = await Promise.all([
      Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name profilePicture branch")
        .populate("comments.user", "name profilePicture"),
      Post.countDocuments(),
    ]);

    // Run count and find in parallel for efficiency

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
// @desc    Delete a post (owner only)
// @route   DELETE /api/posts/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      return next(new Error("Post not found"));
    }

    // ── Ownership check ───────────────────────────────────────────────────
    // Convert both ObjectIds to strings for a reliable equality check.
    if (post.author.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(
        new Error("Forbidden — you can only delete your own posts")
      );
    }

    // ── Cloudinary cleanup ────────────────────────────────────────────────
    // If the post has an attached image, delete it from Cloudinary to avoid
    // orphaned assets accumulating in the storage bucket.
    if (post.image) {
      const publicId = extractPublicId(post.image);
      if (publicId) {
        // Fire-and-forget with error swallowing — a Cloudinary failure should
        // NOT block the post deletion from completing on our end.
        cloudinary.uploader.destroy(publicId).catch((err) => {
          console.error(
            `[deletePost] Cloudinary cleanup failed for public_id "${publicId}":`,
            err.message
          );
        });
      }
    }

    // ── Delete the post ───────────────────────────────────────────────────
    await Post.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Post deleted",
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Toggle like on a post (like / unlike)
// @route   PUT /api/posts/:id/like
// @access  Protected
//
// Business rule: A user cannot simultaneously like AND dislike a post.
// Liking a post automatically removes any existing dislike from that user.
// ─────────────────────────────────────────────────────────────────────────────
export const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      return next(new Error("Post not found"));
    }

    const userId = req.user._id;
    const alreadyLiked = post.likes.some((id) => id.equals(userId));

    if (alreadyLiked) {
      // ── Unlike ────────────────────────────────────────────────────────
      post.likes.pull(userId);
    } else {
      // ── Like + remove any existing dislike ───────────────────────────
      post.likes.push(userId);
      post.dislikes.pull(userId); // mutual exclusivity
    }

    await post.save();

    return res.status(200).json({
      success: true,
      likes: post.likes,
      liked: !alreadyLiked,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Toggle dislike on a post (dislike / un-dislike)
// @route   PUT /api/posts/:id/dislike
// @access  Protected
//
// Business rule: Disliking a post automatically removes any existing like.
// ─────────────────────────────────────────────────────────────────────────────
export const toggleDislike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      return next(new Error("Post not found"));
    }

    const userId = req.user._id;
    const alreadyDisliked = post.dislikes.some((id) => id.equals(userId));

    if (alreadyDisliked) {
      // ── Un-dislike ────────────────────────────────────────────────────
      post.dislikes.pull(userId);
    } else {
      // ── Dislike + remove any existing like ────────────────────────────
      post.dislikes.push(userId);
      post.likes.pull(userId); // mutual exclusivity
    }

    await post.save();

    return res.status(200).json({
      success: true,
      dislikes: post.dislikes,
      disliked: !alreadyDisliked,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comment
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;

    // ── Validation ────────────────────────────────────────────────────────
    if (!text || text.trim() === "") {
      res.status(400);
      return next(new Error("Comment text is required"));
    }

    if (text.trim().length > 300) {
      res.status(400);
      return next(new Error("Comment cannot exceed 300 characters"));
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      return next(new Error("Post not found"));
    }

    // ── Push new comment subdocument ──────────────────────────────────────
    // Mongoose auto-assigns an _id to each subdocument, used later by deleteComment.
    post.comments.push({
      user: req.user._id,
      text: text.trim(),
    });

    await post.save();

    // ── Populate and return the full updated comments array ───────────────
    await post.populate("comments.user", "name profilePicture");

    return res.status(201).json({
      success: true,
      comments: post.comments,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a specific comment from a post
// @route   DELETE /api/posts/:id/comment/:commentId
// @access  Protected (comment author OR post author)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      return next(new Error("Post not found"));
    }

    // ── Find the target comment by its subdocument _id ────────────────────
    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      res.status(404);
      return next(new Error("Comment not found"));
    }

    const userId       = req.user._id.toString();
    const commentOwner = comment.user.toString();
    const postOwner    = post.author.toString();

    // ── Authorization — comment author OR post author may delete ──────────
    if (userId !== commentOwner && userId !== postOwner) {
      res.status(403);
      return next(
        new Error(
          "Forbidden — only the comment author or post author can delete this comment"
        )
      );
    }

    // ── Remove the comment subdocument ────────────────────────────────────
    // Mongoose's .pull() on an embedded array removes the subdoc by _id.
    post.comments.pull({ _id: req.params.commentId });
    await post.save();

    return res.status(200).json({
      success: true,
      comments: post.comments,
    });
  } catch (error) {
    next(error);
  }
};
