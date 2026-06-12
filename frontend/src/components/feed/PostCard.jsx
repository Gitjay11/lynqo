/**
 * PostCard.jsx — Community Feed Post Card (Redesigned)
 *
 * Visual spec:
 *  - bg-surface card with rounded-2xl border
 *  - hover: accent border + subtle -translate-y-0.5 lift
 *  - Heart (filled/outline) for likes, ThumbsDown for dislikes
 *  - Tag badge displayed below author row when post.tag is set
 *  - Post content line-clamped to 4 lines with "Show more" inline expand
 *  - Post image: aspect-video object-cover, never distorts
 *  - Action row: Like · Dislike · Comment · [spacer] · Share
 *  - Active Like state: accent color + accent-light bg
 *  - Active Dislike state: text-secondary + bg-elevated
 *  - If liked: dislike button is opacity-40 cursor-not-allowed
 *  - Comment section toggles with smooth grid-row animation
 *  - Owner sees Delete (trash), non-owner sees Report (flag)
 *
 * All API calls, socket logic, and data-fetching are unchanged.
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart, ThumbsDown, Share2, MessageCircle,
  Trash2, Flag,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import api from "../../api/axios.js";
import Avatar from "../common/Avatar.jsx";
import CommentSection from "./CommentSection.jsx";

// ── Tag metadata (emoji + label) ──────────────────────────────────────────────
const TAG_META = {
  Announcements: "📢 Announcements",
  Memes:         "😂 Memes",
  Academics:     "📚 Academics",
  Placements:    "💼 Placements",
  Questions:     "❓ Questions",
};

// ── Relative time ─────────────────────────────────────────────────────────────
const relTime = (d) => {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }); }
  catch { return ""; }
};

// ── Action button ─────────────────────────────────────────────────────────────
const ActionBtn = ({
  onClick, disabled, ariaLabel, ariaPressed,
  activeStyle, inactiveStyle, children, className = "",
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    aria-pressed={ariaPressed}
    className={`
      flex items-center gap-1.5
      min-h-[44px] px-3 py-2 rounded-xl
      text-xs font-semibold
      transition-all duration-150
      disabled:cursor-not-allowed
      focus:outline-none focus:ring-2 focus:ring-offset-1
      ${className}
    `}
    style={ariaPressed ? activeStyle : inactiveStyle}
    onMouseEnter={e => {
      if (!ariaPressed && !disabled) {
        Object.assign(e.currentTarget.style, { backgroundColor: "var(--bg-elevated)" });
      }
    }}
    onMouseLeave={e => {
      if (!ariaPressed) {
        Object.assign(e.currentTarget.style, { backgroundColor: ariaPressed ? activeStyle.backgroundColor : "transparent" });
      }
    }}
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

  // ── Like animation state ──────────────────────────────────────────
  const [likeAnimating, setLikeAnimating] = useState(false);

  // ── Comment toggle ────────────────────────────────────────────────────────
  const [showComments, setShowComments] = useState(false);

  // ── "Show more" for long posts ────────────────────────────────────────────
  const [expanded, setExpanded] = useState(false);

  // ── Delete / report state ─────────────────────────────────────────────────
  const [deleting,  setDeleting]  = useState(false);
  const [reporting, setReporting] = useState(false);

  const isOwner = String(post.author?._id ?? post.author) === String(userId);

  // ── Toggle Like ───────────────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (likingInFlight) return;
    // ─ Heart pop animation fires only when toggling ON (not off)
    if (!isLiked) {
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 300);
    }
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

  // ── Content — whether to clamp or not ────────────────────────────────────
  const contentText = post.content ?? "";
  // Rough check: >200 chars or >4 newlines → likely a long post
  const isLong      = contentText.length > 220 || (contentText.match(/\n/g) ?? []).length > 3;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <article
      aria-label="Post"
      className="
        w-full relative
        rounded-2xl
        transition-all duration-200
        hover:-translate-y-0.5
        md:shadow-sm
        animate-fade-in
      "
      style={{
        backgroundColor: "var(--bg-surface)",
        border:          "1px solid var(--border)",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
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

        {/* Author + meta */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => navigate(`/profile/${post.author?._id}`)}
            className="text-sm font-bold font-display tracking-snug transition-colors leading-none min-h-0"
            style={{ color: "var(--text-primary)" }}
          >
            {post.author?.name ?? "Unknown"}
          </button>
          <p className="text-xs font-medium leading-tight mt-1" style={{ color: "var(--text-secondary)" }}>
            {post.author?.branch && `${post.author.branch}`}
            {post.author?.branch && post.author?.semester && " · "}
            {post.author?.semester && `Sem ${post.author.semester}`}
          </p>
        </div>

        {/* Timestamp */}
        <span className="text-[10px] tabular-nums flex-shrink-0" style={{ color: "var(--text-muted)" }}>
          {relTime(post.createdAt)}
        </span>

        {/* Owner → delete; non-owner → report */}
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
              : <Trash2 size={15} />
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
            <Flag size={15} />
          </button>
        )}
      </header>

      {/* ── Category tag badge ─────────────────────────────────────────────── */}
      {post.tag && TAG_META[post.tag] && (
        <div className="px-4 pb-2">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: "var(--accent-light)",
              border:          "1px solid var(--accent-border)",
              color:           "#9a3412",
            }}
          >
            {TAG_META[post.tag]}
          </span>
        </div>
      )}

      {/* ── Post content ──────────────────────────────────────────────────── */}
      <div className="px-4 pb-3">
        <p
          className={`text-sm leading-[1.65] whitespace-pre-wrap break-words ${
            isLong && !expanded ? "line-clamp-4" : ""
          }`}
          style={{ color: "var(--text-primary)" }}
        >
          {contentText}
        </p>
        {/* Show more / Show less */}
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-semibold mt-1 min-h-0 transition-opacity duration-150 hover:opacity-70"
            style={{ color: "var(--accent)" }}
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {/* ── Post image ────────────────────────────────────────────────────── */}
      {post.image && (
        <div className="px-4 pb-3">
          <div
            className="w-full overflow-hidden rounded-xl"
            style={{ aspectRatio: "16/9", border: "1px solid var(--border)" }}
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

      {/* ── Action row ────────────────────────────────────────────────────── */}
      <footer
        className="flex items-center gap-1 px-3 pb-2"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {/* Like — Heart icon, filled when liked */}
        <ActionBtn
          onClick={handleLike}
          disabled={likingInFlight || dislikingInFlight}
          ariaLabel={isLiked ? "Unlike post" : "Like post"}
          ariaPressed={isLiked}
          activeStyle={{ color: "var(--accent)", backgroundColor: "var(--accent-light)" }}
          inactiveStyle={{ color: "var(--text-muted)", backgroundColor: "transparent" }}
          className="active:scale-110"
        >
          <Heart
            size={16}
            strokeWidth={isLiked ? 0 : 2}
            fill={isLiked ? "var(--accent)" : "none"}
            className={`flex-shrink-0 ${likeAnimating ? "animate-heart-pop" : ""}`}
          />
          {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
        </ActionBtn>

        {/* Dislike — disabled/faded when post is liked */}
        <ActionBtn
          onClick={handleDislike}
          disabled={dislikingInFlight || likingInFlight || isLiked}
          ariaLabel={isDisliked ? "Remove dislike" : "Dislike post"}
          ariaPressed={isDisliked}
          activeStyle={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-elevated)" }}
          inactiveStyle={{ color: "var(--text-muted)", backgroundColor: "transparent", opacity: isLiked ? 0.4 : 1 }}
        >
          <ThumbsDown size={16} strokeWidth={isDisliked ? 2.5 : 2} className="flex-shrink-0" />
          {dislikeCount > 0 && <span className="tabular-nums">{dislikeCount}</span>}
        </ActionBtn>

        {/* Comment toggle */}
        <ActionBtn
          onClick={() => setShowComments((v) => !v)}
          ariaLabel={showComments ? "Hide comments" : "Show comments"}
          ariaPressed={showComments}
          activeStyle={{ color: "var(--accent)", backgroundColor: "var(--accent-light)" }}
          inactiveStyle={{ color: "var(--text-muted)", backgroundColor: "transparent" }}
        >
          <MessageCircle size={16} strokeWidth={showComments ? 2.5 : 2} className="flex-shrink-0" />
          {(post.comments?.length ?? 0) > 0 && (
            <span className="tabular-nums">{post.comments.length}</span>
          )}
        </ActionBtn>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Share */}
        <ActionBtn
          onClick={handleShare}
          ariaLabel="Share post"
          ariaPressed={false}
          activeStyle={{ color: "var(--text-muted)", backgroundColor: "transparent" }}
          inactiveStyle={{ color: "var(--text-muted)", backgroundColor: "transparent" }}
        >
          <Share2 size={15} strokeWidth={2} className="flex-shrink-0" />
          <span className="hidden sm:inline">Share</span>
        </ActionBtn>
      </footer>

      {/* ── Comment section — animated grid expand ────────────────────────── */}
      <div
        style={{
          display:          "grid",
          gridTemplateRows: showComments ? "1fr" : "0fr",
          transition:       "grid-template-rows 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          <div style={{ opacity: showComments ? 1 : 0, transition: "opacity 150ms ease 60ms" }}>
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
