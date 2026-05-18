/**
 * PostCard.jsx — Community Feed Post Card
 *
 * Renders a single post with:
 *  - Author row: avatar, name, branch, relative timestamp
 *  - Post content text
 *  - Post image (if attached) — full-width, capped at max-h-80
 *  - Action row: Like, Dislike, Comment count toggle, Delete (owner only)
 *  - Collapsible CommentSection (toggled by the comment button)
 *
 * Props:
 *  post        {Object}   — Full post object from the API (populated author + comments)
 *  currentUser {Object}   — Logged-in user from AuthContext
 *  onDelete    {function} — (postId) => void — called after successful delete
 *
 * State managed here (optimistic UI):
 *  likes[]    — Updated instantly on toggle; rolled back on API failure
 *  dislikes[] — Same pattern
 *  comments[] — Updated after each add/delete via CommentSection callbacks
 *  showComments — toggles CommentSection visibility
 *
 * API calls:
 *  PUT    /api/posts/:id/like
 *  PUT    /api/posts/:id/dislike
 *  DELETE /api/posts/:id
 */

import { useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import api from "../../api/axios.js";
import Avatar from "../common/Avatar.jsx";
import LikeButton from "./LikeButton.jsx";
import CommentSection from "./CommentSection.jsx";

// ── Relative time helper ───────────────────────────────────────────────────────
const relTime = (dateStr) => {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
};

// ─────────────────────────────────────────────────────────────────────────────
const PostCard = ({ post, currentUser, onDelete }) => {
  // ── Local state — kept in sync with optimistic UI updates ─────────────────
  const [likes,    setLikes]    = useState(post.likes    ?? []);
  const [dislikes, setDislikes] = useState(post.dislikes ?? []);
  const [comments, setComments] = useState(post.comments ?? []);
  const [showComments, setShowComments] = useState(false);

  // In-flight guards to prevent double-taps
  const [likingInFlight,    setLikingInFlight]    = useState(false);
  const [dislikingInFlight, setDislikingInFlight] = useState(false);
  const [deletingPost,      setDeletingPost]      = useState(false);

  // ── Derived booleans for active state ─────────────────────────────────────
  const userId      = currentUser?._id;
  const isLiked     = likes.some(   (id) => (id?._id ?? id)?.toString() === userId);
  const isDisliked  = dislikes.some((id) => (id?._id ?? id)?.toString() === userId);
  const isOwner     = post.author?._id === userId || post.author === userId;

  // ── Toggle Like ────────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (likingInFlight) return;

    // Optimistic update
    const wasLiked     = isLiked;
    const prevLikes    = likes;
    const prevDislikes = dislikes;

    if (wasLiked) {
      setLikes((prev) => prev.filter((id) => (id?._id ?? id)?.toString() !== userId));
    } else {
      setLikes((prev) => [...prev, userId]);
      // mutual exclusivity — remove dislike optimistically
      setDislikes((prev) => prev.filter((id) => (id?._id ?? id)?.toString() !== userId));
    }

    setLikingInFlight(true);
    try {
      const { data } = await api.put(`/posts/${post._id}/like`);
      // Server is source of truth — replace with confirmed arrays
      setLikes(data.likes);
      // Note: like route doesn't return dislikes — our optimistic removal is correct
    } catch (err) {
      // Roll back
      setLikes(prevLikes);
      setDislikes(prevDislikes);
      toast.error(err.response?.data?.message || "Failed to update reaction");
    } finally {
      setLikingInFlight(false);
    }
  };

  // ── Toggle Dislike ─────────────────────────────────────────────────────────
  const handleDislike = async () => {
    if (dislikingInFlight) return;

    const wasDisliked  = isDisliked;
    const prevLikes    = likes;
    const prevDislikes = dislikes;

    if (wasDisliked) {
      setDislikes((prev) => prev.filter((id) => (id?._id ?? id)?.toString() !== userId));
    } else {
      setDislikes((prev) => [...prev, userId]);
      // mutual exclusivity — remove like optimistically
      setLikes((prev) => prev.filter((id) => (id?._id ?? id)?.toString() !== userId));
    }

    setDislikingInFlight(true);
    try {
      const { data } = await api.put(`/posts/${post._id}/dislike`);
      setDislikes(data.dislikes);
    } catch (err) {
      setLikes(prevLikes);
      setDislikes(prevDislikes);
      toast.error(err.response?.data?.message || "Failed to update reaction");
    } finally {
      setDislikingInFlight(false);
    }
  };

  // ── Delete Post ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    // Simple confirmation — no modal overhead for a feed card
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    if (deletingPost) return;

    setDeletingPost(true);
    try {
      await api.delete(`/posts/${post._id}`);
      onDelete(post._id);
      toast.success("Post deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete post");
    } finally {
      setDeletingPost(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <article
      aria-label={`Post by ${post.author?.name ?? "Unknown"}`}
      className="
        bg-white w-full
        /* Mobile: edge-to-edge, no rounding */
        border-b border-gray-100
        /* md+: card style with rounded corners and shadow */
        md:rounded-2xl md:border md:border-gray-100 md:shadow-sm
      "
    >
      {/* ── Author row ──────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-2">
        {/* Avatar — shrink-0 so it never gets squished */}
        <Avatar
          src={post.author?.profilePicture}
          name={post.author?.name ?? ""}
          size="sm"
          className="flex-shrink-0"
        />

        {/* Name / branch / time stack */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
            {post.author?.name ?? "Unknown"}
          </p>
          <p className="text-xs text-gray-400 truncate leading-tight mt-0.5">
            {[post.author?.branch, relTime(post.createdAt)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        {/* Delete — visible only for post owner */}
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deletingPost}
            aria-label="Delete post"
            className="
              flex items-center justify-center
              w-9 h-9 min-h-0 rounded-full flex-shrink-0
              text-gray-300 hover:text-red-400 hover:bg-red-50
              transition-colors duration-150 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-red-300
              disabled:opacity-50
            "
          >
            {deletingPost
              ? <span className="w-4 h-4 border-2 border-red-300/40 border-t-red-400 rounded-full animate-spin" />
              : <Trash2 size={16} />
            }
          </button>
        )}
      </header>

      {/* ── Post content ────────────────────────────────────────────────────── */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
          {post.content}
        </p>
      </div>

      {/* ── Post image (optional) ─────────────────────────────────────────── */}
      {post.image && (
        <div className="px-4 pb-3">
          <img
            src={post.image}
            alt="Post attachment"
            loading="lazy"
            className="
              w-full rounded-xl object-cover
              max-h-80
              bg-gray-100
            "
          />
        </div>
      )}

      {/* ── Action row ──────────────────────────────────────────────────────── */}
      <footer className="flex items-center gap-1 px-3 pb-2 border-t border-gray-50">
        {/* Like */}
        <LikeButton
          icon={ThumbsUp}
          count={likes.length}
          active={isLiked}
          activeColor="text-brand-600"
          activeBg="bg-brand-50"
          onClick={handleLike}
          disabled={likingInFlight}
          label={isLiked ? "Unlike post" : "Like post"}
        />

        {/* Dislike */}
        <LikeButton
          icon={ThumbsDown}
          count={dislikes.length}
          active={isDisliked}
          activeColor="text-rose-600"
          activeBg="bg-rose-50"
          onClick={handleDislike}
          disabled={dislikingInFlight}
          label={isDisliked ? "Remove dislike" : "Dislike post"}
        />

        {/* Comment toggle */}
        <button
          onClick={() => setShowComments((v) => !v)}
          aria-label={`${showComments ? "Hide" : "Show"} comments`}
          aria-expanded={showComments}
          className={`
            flex items-center gap-1.5
            min-h-[44px] px-3 rounded-xl
            text-sm font-medium
            transition-all duration-150 active:scale-95
            focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1
            ${showComments
              ? "text-brand-600 bg-brand-50"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }
          `}
        >
          <MessageCircle size={18} strokeWidth={showComments ? 2.5 : 2} className="flex-shrink-0" />
          {comments.length > 0 && (
            <span className="tabular-nums leading-none">{comments.length}</span>
          )}
        </button>
      </footer>

      {/* ── Comment section (collapsible) ──────────────────────────────────── */}
      {/*
       * Always mounted so CommentSection can animate its close transition.
       * The `isOpen` prop drives the CSS grid-rows animation inside.
       */}
      <CommentSection
        isOpen={showComments}
        postId={post._id}
        comments={comments}
        currentUser={currentUser}
        postAuthorId={post.author?._id ?? post.author}
        onAdd={setComments}
        onDelete={setComments}
      />
    </article>
  );
};

export default PostCard;
