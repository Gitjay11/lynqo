/**
 * PostCard.jsx — Community Feed Post Card (Dark Theme)
 *
 * bg-zinc-900, border-zinc-800
 * Active reactions: violet / rose
 * Inactive: zinc-500 hover:zinc-300
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ThumbsUp, ThumbsDown, MessageSquare,
  Trash2, MoreHorizontal, Flag,
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
  const [isLiked,        setIsLiked]        = useState(() =>
    (post.likes ?? []).some((id) => String(id) === String(userId))
  );
  const [likingInFlight, setLikingInFlight] = useState(false);

  // ── Comment toggle ────────────────────────────────────────────────────────
  const [showComments, setShowComments] = useState(false);

  // ── Menu / report state ───────────────────────────────────────────────────
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [reporting, setReporting] = useState(false);

  const isOwner = String(post.author?._id ?? post.author) === String(userId);

  // ── Toggle Like ───────────────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (likingInFlight) return;
    const prevLiked = isLiked;
    const prevCount = likeCount;

    setIsLiked(!isLiked);
    setLikeCount((n) => (isLiked ? Math.max(0, n - 1) : n + 1));
    setLikingInFlight(true);

    try {
      const { data } = await api.put(`/posts/${post._id}/like`);
      setLikeCount(data.likes ?? prevCount);
      setIsLiked(data.liked ?? prevLiked);
    } catch (err) {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error(err.response?.data?.message ?? "Failed to like post");
    } finally {
      setLikingInFlight(false);
    }
  }, [isLiked, likeCount, likingInFlight, post._id]);

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
          className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-full min-h-0"
        >
          <Avatar src={post.author?.profilePicture} name={post.author?.name ?? ""} size="sm" />
        </button>

        {/* Author + timestamp */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => navigate(`/profile/${post.author?._id}`)}
            className="text-sm font-semibold text-zinc-100 hover:text-violet-400 transition-colors leading-tight min-h-0"
          >
            {post.author?.name ?? "Unknown"}
          </button>
          <p className="text-xs text-zinc-600 leading-tight mt-0.5">
            {relTime(post.createdAt)}
            {post.author?.branch && ` · ${post.author.branch}`}
          </p>
        </div>

        {/* ── 3-dot menu ───────────────────────────────────────────────────── */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Post options"
            aria-expanded={menuOpen}
            className="
              p-2 rounded-xl text-zinc-600
              hover:bg-zinc-800 hover:text-zinc-300
              transition-colors duration-150 min-h-0
              focus:outline-none focus:ring-2 focus:ring-violet-500
            "
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="
                absolute right-0 top-[calc(100%+4px)] z-10
                w-36 bg-zinc-900 border border-zinc-800
                rounded-xl shadow-lg shadow-black/40 py-1
              "
            >
              {isOwner ? (
                <button
                  role="menuitem"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="
                    w-full flex items-center gap-2.5 px-3 py-2.5
                    text-sm text-red-400 hover:bg-red-500/10
                    transition-colors min-h-0
                  "
                >
                  <Trash2 size={14} className="text-red-500" />
                  {deleting ? "Deleting…" : "Delete Post"}
                </button>
              ) : (
                <button
                  role="menuitem"
                  onClick={handleReport}
                  disabled={reporting}
                  className="
                    w-full flex items-center gap-2.5 px-3 py-2.5
                    text-sm text-amber-400 hover:bg-amber-500/10
                    transition-colors min-h-0
                  "
                >
                  <Flag size={14} className="text-amber-500" />
                  {reporting ? "Reporting…" : "Report Post"}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Post image (optional) ─────────────────────────────────────────── */}
      {post.image && (
        <div className="px-4 pb-2">
          <img
            src={post.image}
            alt="Post attachment"
            className="w-full rounded-xl max-h-80 object-cover border border-zinc-800"
            loading="lazy"
          />
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
          disabled={likingInFlight}
          ariaLabel={isLiked ? "Unlike post" : "Like post"}
          ariaPressed={isLiked}
          className={`
            focus:ring-violet-500
            ${isLiked
              ? "text-violet-400 bg-violet-600/10"
              : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            }
          `}
        >
          <ThumbsUp size={18} strokeWidth={isLiked ? 2.5 : 2} className="flex-shrink-0" />
          {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
        </ActionBtn>

        {/* Comment toggle */}
        <ActionBtn
          onClick={() => setShowComments((v) => !v)}
          ariaLabel={showComments ? "Hide comments" : "Show comments"}
          ariaPressed={showComments}
          className={`
            focus:ring-violet-500
            ${showComments
              ? "text-violet-400 bg-violet-600/10"
              : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            }
          `}
        >
          <MessageSquare size={18} strokeWidth={showComments ? 2.5 : 2} className="flex-shrink-0" />
          {(post.comments?.length ?? 0) > 0 && (
            <span className="tabular-nums">{post.comments.length}</span>
          )}
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
