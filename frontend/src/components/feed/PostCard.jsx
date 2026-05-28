/**
 * PostCard.jsx — Community Feed Post Card (Dark Theme)
 *
 * bg-zinc-900, border-zinc-800
 * Active reactions: violet (like) / red (dislike)
 * Inactive: zinc-500 hover:zinc-300
 *
 * Changes:
 *  - Added Dislike button with mutual exclusivity (like ↔ dislike)
 *  - Added Share button (Web Share API → clipboard fallback)
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ThumbsUp, ThumbsDown, Share2, MessageSquare,
  Trash2, Flag,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import api from "../../api/axios.js";
import Avatar from "../common/Avatar.jsx";
import CommentSection from "./CommentSection.jsx";

// ── Relative time ─────────────────────────────────────────────────────────────
const relTime = (d) => {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }); }
  catch { return ""; }
};

// ── Action button ─────────────────────────────────────────────────────────────
const ActionBtn = ({ onClick, disabled, ariaLabel, ariaPressed, className, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    aria-pressed={ariaPressed}
    className={`
      flex items-center gap-1.5
      min-h-[44px] px-3 rounded-xl
      text-sm font-medium
      transition-all duration-150 active:scale-95
      disabled:cursor-not-allowed disabled:opacity-60
      focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-zinc-900
      ${className}
    `}
  >
    {children}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
const PostCard = ({ post, currentUser, onDelete }) => {
  const navigate = useNavigate();
  const userId   = currentUser?._id ?? currentUser?.id;

  // ── Like state — optimistic ───────────────────────────────────────────────
  const [likeCount,      setLikeCount]      = useState(post.likes?.length ?? 0);
  const [isLiked,        setIsLiked]        = useState(
    () => (post.likes ?? []).some((id) => String(id) === String(userId))
  );
  const [likingInFlight, setLikingInFlight] = useState(false);

  // ── Dislike state — optimistic ────────────────────────────────────────────
  const [dislikeCount,      setDislikeCount]      = useState(post.dislikes?.length ?? 0);
  const [isDisliked,        setIsDisliked]        = useState(
    () => (post.dislikes ?? []).some((id) => String(id) === String(userId))
  );
  const [dislikingInFlight, setDislikingInFlight] = useState(false);

  // ── Comment toggle ────────────────────────────────────────────────────────
  const [showComments, setShowComments] = useState(false);

  // ── Menu / report state ──────────────────────────────────────────────
  const [deleting,  setDeleting]  = useState(false);
  const [reporting, setReporting] = useState(false);

  const isOwner = String(post.author?._id ?? post.author) === String(userId);

  // ── Toggle Like ───────────────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (likingInFlight) return;
    const prevLiked    = isLiked;
    const prevCount    = likeCount;
    const prevDisliked = isDisliked;
    const prevDCount   = dislikeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount((n) => (isLiked ? Math.max(0, n - 1) : n + 1));
    // Mutual exclusivity: liking removes any active dislike immediately
    if (!isLiked && isDisliked) {
      setIsDisliked(false);
      setDislikeCount((n) => Math.max(0, n - 1));
    }
    setLikingInFlight(true);

    try {
      const { data } = await api.put(`/posts/${post._id}/like`);
      setLikeCount(data.likes ?? prevCount);
      setIsLiked(data.liked ?? prevLiked);
    } catch (err) {
      // Roll back all state on failure
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      setIsDisliked(prevDisliked);
      setDislikeCount(prevDCount);
      toast.error(err.response?.data?.message ?? "Failed to like post");
    } finally {
      setLikingInFlight(false);
    }
  }, [isLiked, likeCount, isDisliked, dislikeCount, likingInFlight, post._id]);

  // ── Toggle Dislike ────────────────────────────────────────────────────────
  // Mutual exclusivity: disliking removes any active like.
  // Follows the identical optimistic rollback pattern as handleLike.
  const handleDislike = useCallback(async () => {
    if (dislikingInFlight) return;
    const prevDisliked = isDisliked;
    const prevDCount   = dislikeCount;
    const prevLiked    = isLiked;
    const prevCount    = likeCount;

    // Optimistic update
    setIsDisliked(!isDisliked);
    setDislikeCount((n) => (isDisliked ? Math.max(0, n - 1) : n + 1));
    // Mutual exclusivity: disliking removes any active like immediately
    if (!isDisliked && isLiked) {
      setIsLiked(false);
      setLikeCount((n) => Math.max(0, n - 1));
    }
    setDislikingInFlight(true);

    try {
      const { data } = await api.put(`/posts/${post._id}/dislike`);
      setDislikeCount(data.dislikes ?? prevDCount);
      setIsDisliked(data.disliked ?? prevDisliked);
    } catch (err) {
      // Roll back all state on failure
      setIsDisliked(prevDisliked);
      setDislikeCount(prevDCount);
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error(err.response?.data?.message ?? "Failed to dislike post");
    } finally {
      setDislikingInFlight(false);
    }
  }, [isDisliked, dislikeCount, isLiked, likeCount, dislikingInFlight, post._id]);

  // ── Share ─────────────────────────────────────────────────────────────────
  // Uses the Web Share API on supported devices (mobile).
  // Falls back to clipboard copy on desktop browsers that don't support it.
  const handleShare = useCallback(async () => {
    const postUrl   = `${window.location.origin}/post/${post._id}`;
    const shareText = post.content?.slice(0, 100) + (post.content?.length > 100 ? "…" : "");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this post on Lynqo",
          text: shareText,
          url: postUrl,
        });
      } catch (err) {
        // User cancelled the share sheet — not an error worth toasting
        if (err.name !== "AbortError") {
          toast.error("Could not share post");
        }
      }
    } else {
      // Clipboard fallback for desktop browsers
      try {
        await navigator.clipboard.writeText(postUrl);
        toast.success("Link copied to clipboard");
      } catch {
        toast.error("Could not copy link");
      }
    }
  }, [post._id, post.content]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setMenuOpen(false);
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success("Post deleted");
      onDelete?.(post._id);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  // ── Report ────────────────────────────────────────────────────────────────
  const handleReport = async () => {
    if (reporting) return;
    setReporting(true);
    setMenuOpen(false);
    try {
      await api.put(`/posts/${post._id}/report`);
      toast.success("Post reported — thank you for keeping the community safe.");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to report post");
    } finally {
      setReporting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <article
      aria-label="Post"
      className="
        bg-zinc-900 w-full relative
        border-b border-zinc-800
        md:rounded-2xl md:border md:border-zinc-800 md:shadow-sm
      "
    >
      {/* ── Header row ───────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-2">
        {/* Clickable avatar */}
        <button
          onClick={() => navigate(`/profile/${post.author?._id}`)}
          aria-label={`View ${post.author?.name}'s profile`}
          className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-zinc-400 rounded-full min-h-0"
        >
          <Avatar src={post.author?.profilePicture} name={post.author?.name ?? ""} size="sm" />
        </button>

        {/* Author + timestamp */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => navigate(`/profile/${post.author?._id}`)}
            className="text-sm font-semibold text-zinc-100 hover:text-white transition-colors leading-tight min-h-0"
          >
            {post.author?.name ?? "Unknown"}
          </button>
          <p className="text-xs text-zinc-600 leading-tight mt-0.5">
            {relTime(post.createdAt)}
            {post.author?.branch && ` · ${post.author.branch}`}
          </p>
        </div>

        {/* ── Direct action buttons ─────────────────────────────────────────── */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isOwner ? (
            // Trash — visible only to the post owner
            <button
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete post"
              className="
                p-2 rounded-xl min-h-0
                text-zinc-600 hover:text-red-500 hover:bg-red-500/10
                transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-red-400
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {deleting
                ? <span className="w-4 h-4 border-2 border-zinc-600 border-t-red-500 rounded-full animate-spin block" />
                : <Trash2 size={16} />
              }
            </button>
          ) : (
            // Flag — visible to non-owners
            <button
              onClick={handleReport}
              disabled={reporting}
              aria-label="Report post"
              className="
                p-2 rounded-xl min-h-0
                text-zinc-600 hover:text-amber-500 hover:bg-amber-500/10
                transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-amber-400
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Flag size={16} />
            </button>
          )}
        </div>
      </header>

      {/* ── Post image (optional) ─────────────────────────────────────────── */}
      {post.image && (
        <div className="px-4 pb-2">
          <div className="w-full aspect-video overflow-hidden rounded-xl border border-zinc-800">
            <img
              src={post.image}
              alt="Post attachment"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* ── Post content ──────────────────────────────────────────────────── */}
      <div className="px-4 pb-3">
        <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
          {post.content}
        </p>
      </div>

      {/* ── Action row ────────────────────────────────────────────────────── */}
      <footer className="flex items-center gap-1 px-3 pb-2 border-t border-zinc-800">
        {/* Like */}
        <ActionBtn
          onClick={handleLike}
          disabled={likingInFlight || dislikingInFlight}
          ariaLabel={isLiked ? "Unlike post" : "Like post"}
          ariaPressed={isLiked}
          className={`
            focus:ring-zinc-400
            ${isLiked
              ? "text-white bg-white/10"
              : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            }
          `}
        >
          <ThumbsUp size={18} strokeWidth={isLiked ? 2.5 : 2} className="flex-shrink-0" />
          {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
        </ActionBtn>

        {/* Dislike */}
        <ActionBtn
          onClick={handleDislike}
          disabled={dislikingInFlight || likingInFlight}
          ariaLabel={isDisliked ? "Remove dislike" : "Dislike post"}
          ariaPressed={isDisliked}
          className={`
            focus:ring-red-500
            ${isDisliked
              ? "text-red-500 bg-red-500/10"
              : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            }
          `}
        >
          <ThumbsDown size={18} strokeWidth={isDisliked ? 2.5 : 2} className="flex-shrink-0" />
          {dislikeCount > 0 && <span className="tabular-nums">{dislikeCount}</span>}
        </ActionBtn>

        {/* Comment toggle */}
        <ActionBtn
          onClick={() => setShowComments((v) => !v)}
          ariaLabel={showComments ? "Hide comments" : "Show comments"}
          ariaPressed={showComments}
          className={`
            focus:ring-zinc-400
            ${showComments
              ? "text-white bg-white/10"
              : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            }
          `}
        >
          <MessageSquare size={18} strokeWidth={showComments ? 2.5 : 2} className="flex-shrink-0" />
          {(post.comments?.length ?? 0) > 0 && (
            <span className="tabular-nums">{post.comments.length}</span>
          )}
        </ActionBtn>

        {/* Spacer pushes share to the right */}
        <div className="flex-1" />

        {/* Share — Web Share API on mobile, clipboard fallback on desktop */}
        <ActionBtn
          onClick={handleShare}
          ariaLabel="Share post"
          className="text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 focus:ring-zinc-400"
        >
          <Share2 size={16} strokeWidth={2} className="flex-shrink-0" />
          <span className="hidden sm:inline text-xs">Share</span>
        </ActionBtn>
      </footer>

      {/* ── Comment section — animated ────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: showComments ? "1fr" : "0fr",
          transition: "grid-template-rows 220ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          <div style={{ opacity: showComments ? 1 : 0, transition: "opacity 150ms ease 50ms" }}>
            <CommentSection
              postId={post._id}
              initialComments={post.comments ?? []}
              currentUser={currentUser}
            />
          </div>
        </div>
      </div>

    </article>
  );
};

export default PostCard;
