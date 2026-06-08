/**
 * PostCard.jsx — Community Feed Post Card (Themed)
 *
 * bg-bg-surface border-app-border
 * Active reactions: teal (like) / red (dislike)
 * Inactive: text-muted hover:text-secondary
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
const ActionBtn = ({ onClick, disabled, ariaLabel, ariaPressed, style, className, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    aria-pressed={ariaPressed}
    style={style}
    className={`
      flex items-center gap-1.5
      min-h-[44px] px-3 rounded-xl
      text-sm font-medium
      transition-colors duration-150 active:scale-95
      disabled:cursor-not-allowed disabled:opacity-60
      focus:outline-none focus:ring-2 focus:ring-offset-1
      ${className ?? ""}
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

    setIsLiked(!isLiked);
    setLikeCount((n) => (isLiked ? Math.max(0, n - 1) : n + 1));
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
  const handleDislike = useCallback(async () => {
    if (dislikingInFlight) return;
    const prevDisliked = isDisliked;
    const prevDCount   = dislikeCount;
    const prevLiked    = isLiked;
    const prevCount    = likeCount;

    setIsDisliked(!isDisliked);
    setDislikeCount((n) => (isDisliked ? Math.max(0, n - 1) : n + 1));
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
  const handleShare = useCallback(async () => {
    const postUrl   = `${window.location.origin}/post/${post._id}`;
    const shareText = post.content?.slice(0, 100) + (post.content?.length > 100 ? "…" : "");

    if (navigator.share) {
      try {
        await navigator.share({ title: "Check out this post on Lynqo", text: shareText, url: postUrl });
      } catch (err) {
        if (err.name !== "AbortError") toast.error("Could not share post");
      }
    } else {
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
      style={{
        backgroundColor: "var(--bg-surface)",
        borderBottom:    "1px solid var(--border)",
      }}
      className="w-full relative md:rounded-2xl md:shadow-sm"
    >
      {/* ── Header row ───────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-2">
        {/* Clickable avatar */}
        <button
          onClick={() => navigate(`/profile/${post.author?._id}`)}
          aria-label={`View ${post.author?.name}'s profile`}
          className="flex-shrink-0 focus:outline-none focus:ring-2 rounded-full min-h-0"
        >
          <Avatar src={post.author?.profilePicture} name={post.author?.name ?? ""} size="sm" />
        </button>

        {/* Author + timestamp */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => navigate(`/profile/${post.author?._id}`)}
            className="text-sm font-semibold transition-colors leading-tight min-h-0"
            style={{ color: "var(--text-primary)" }}
          >
            {post.author?.name ?? "Unknown"}
          </button>
          <p className="text-xs leading-tight mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {relTime(post.createdAt)}
            {post.author?.branch && ` · ${post.author.branch}`}
          </p>
        </div>

        {/* ── Direct action buttons ─────────────────────────────────────────── */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isOwner ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete post"
              className="
                p-2 rounded-xl min-h-0
                hover:bg-red-500/10
                transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-red-400
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
            >
              {deleting
                ? <span className="w-4 h-4 border-2 border-t-red-500 rounded-full animate-spin block" style={{ borderColor: "var(--border)", borderTopColor: "#ef4444" }} />
                : <Trash2 size={16} />
              }
            </button>
          ) : (
            <button
              onClick={handleReport}
              disabled={reporting}
              aria-label="Report post"
              className="
                p-2 rounded-xl min-h-0
                hover:text-amber-500 hover:bg-amber-500/10
                transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-amber-400
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              style={{ color: "var(--text-muted)" }}
            >
              <Flag size={16} />
            </button>
          )}
        </div>
      </header>

      {/* ── Post image (optional) ─────────────────────────────────────────── */}
      {post.image && (
        <div className="px-4 pb-2">
          <div
            className="w-full aspect-video overflow-hidden rounded-xl"
            style={{ border: "1px solid var(--border)" }}
          >
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
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: "var(--text-primary)" }}>
          {post.content}
        </p>
      </div>

      {/* ── Action row ────────────────────────────────────────────────────── */}
      <footer
        className="flex items-center gap-1 px-3 pb-2"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {/* Like */}
        <ActionBtn
          onClick={handleLike}
          disabled={likingInFlight || dislikingInFlight}
          ariaLabel={isLiked ? "Unlike post" : "Like post"}
          ariaPressed={isLiked}
          style={isLiked
            ? { color: "var(--accent)", backgroundColor: "var(--accent-light)" }
            : { color: "var(--text-muted)" }
          }
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
          style={isDisliked
            ? { color: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)" }
            : { color: "var(--text-muted)" }
          }
        >
          <ThumbsDown size={18} strokeWidth={isDisliked ? 2.5 : 2} className="flex-shrink-0" />
          {dislikeCount > 0 && <span className="tabular-nums">{dislikeCount}</span>}
        </ActionBtn>

        {/* Comment toggle */}
        <ActionBtn
          onClick={() => setShowComments((v) => !v)}
          ariaLabel={showComments ? "Hide comments" : "Show comments"}
          ariaPressed={showComments}
          style={showComments
            ? { color: "var(--accent)", backgroundColor: "var(--accent-light)" }
            : { color: "var(--text-muted)" }
          }
        >
          <MessageSquare size={18} strokeWidth={showComments ? 2.5 : 2} className="flex-shrink-0" />
          {(post.comments?.length ?? 0) > 0 && (
            <span className="tabular-nums">{post.comments.length}</span>
          )}
        </ActionBtn>

        {/* Spacer pushes share to the right */}
        <div className="flex-1" />

        {/* Share */}
        <ActionBtn
          onClick={handleShare}
          ariaLabel="Share post"
          style={{ color: "var(--text-muted)" }}
        >
          <Share2 size={16} strokeWidth={2} className="flex-shrink-0" />
          <span className="hidden sm:inline text-xs">Share</span>
        </ActionBtn>
      </footer>

      {/* ── Comment section — animated ────────────────────────────────────── */}
      <div
        style={{
          display:             "grid",
          gridTemplateRows:    showComments ? "1fr" : "0fr",
          transition:          "grid-template-rows 220ms cubic-bezier(0.4, 0, 0.2, 1)",
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
