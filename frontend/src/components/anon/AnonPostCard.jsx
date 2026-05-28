/**
 * AnonPostCard.jsx — Anonymous Feed Post Card
 *
 * Renders a single anonymous post. NEVER shows any author identity.
 * The backend enforces this at the data layer (realAuthor is select:false);
 * this component enforces it at the UI layer by design.
 *
 * Displays:
 *  - Ghost/mask icon + "Anonymous" label + relative timestamp
 *  - Post content text
 *  - Post image (optional, if backend provides it)
 *  - Action row: Like (optimistic), Dislike (optimistic), Share, Report (confirmation)
 *
 * Optimistic reaction pattern (both like and dislike):
 *  1. Toggle local state + count immediately on click.
 *  2. Mutual exclusivity: liking cancels dislike locally (and vice versa).
 *  3. Fire PUT /api/anon/:id/like  or  PUT /api/anon/:id/dislike.
 *  4. On success → sync counts with server response.
 *  5. On failure → roll back all state + show toast.
 *
 * Share pattern:
 *  - Click "Share" → Web Share API if available (mobile).
 *  - Falls back to clipboard copy on desktop + toast.
 *
 * Report pattern:
 *  - Click "Report" → show an inline confirmation prompt.
 *  - Confirm → fire PUT /api/anon/:id/report.
 *  - On success → show toast, disable button.
 *  - Auto-hidden posts (after 5 reports) are removed from the feed by AnonPage.
 *
 * Props:
 *  post        {Object}   — AnonPost document (no realAuthor field)
 *  currentUser {Object}   — Logged-in user from AuthContext (for reaction tracking)
 *  onHidden    {function} — (postId) => void — called when this post gets hidden
 *
 * Responsive:
 *  - Full-width, no margin on mobile (edge-to-edge with border-b)
 *  - md+: rounded-2xl card with shadow and border
 *  - Action buttons: min-h-[44px] touch targets, flex gap-2
 */

import { useState, useCallback } from "react";
import { Ghost, ThumbsUp, ThumbsDown, Flag, Share2, AlertTriangle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import api from "../../api/axios.js";

// ── Relative time helper ────────────────────────────────────────────────────
const relTime = (dateStr) => {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
};

// ── Report confirmation dialog ──────────────────────────────────────────────
const ReportConfirm = ({ onConfirm, onCancel, loading }) => (
  <div
    role="alertdialog"
    aria-modal="false"
    aria-label="Report confirmation"
    className="
      mx-4 mb-3 p-3
      bg-amber-500/10 border border-amber-500/20 rounded-xl
      flex items-start gap-3
    "
  >
    <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-amber-400 leading-tight">
        Report this post?
      </p>
      <p className="text-[11px] text-amber-300 mt-0.5 leading-snug">
        If 5 or more users report it, the post will be hidden automatically.
      </p>
      <div className="flex gap-2 mt-2">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="
            flex items-center gap-1.5
            px-3 py-1.5 min-h-0 text-xs font-semibold
            bg-amber-500 hover:bg-amber-600 active:bg-amber-700
            text-white rounded-lg
            transition-colors duration-150
            disabled:opacity-50
            focus:outline-none focus:ring-2 focus:ring-amber-400
          "
        >
          {loading
            ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Flag size={11} />
          }
          Yes, Report
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="
            px-3 py-1.5 min-h-0 text-xs font-medium
            text-amber-300 hover:text-amber-200
            hover:bg-amber-500/20 rounded-lg
            transition-colors duration-150
            disabled:opacity-50
            focus:outline-none focus:ring-2 focus:ring-amber-400
          "
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const AnonPostCard = ({ post, currentUser, onHidden, onDelete }) => {
  const userId = currentUser?._id;

  // ── Delete state ──────────────────────────────────────────────
  const [deleting, setDeleting] = useState(false);

  // ── Like state — optimistic ───────────────────────────────────────────────
  const [likeCount,      setLikeCount]      = useState(post.likes?.length ?? 0);
  const [isLiked,        setIsLiked]        = useState(
    () => (post.likes ?? []).some((id) => id?.toString() === userId)
  );
  const [likingInFlight, setLikingInFlight] = useState(false);

  // ── Dislike state — optimistic ────────────────────────────────────────────
  const [dislikeCount,      setDislikeCount]      = useState(post.dislikes?.length ?? 0);
  const [isDisliked,        setIsDisliked]        = useState(
    () => (post.dislikes ?? []).some((id) => id?.toString() === userId)
  );
  const [dislikingInFlight, setDislikingInFlight] = useState(false);

  // ── Report state ──────────────────────────────────────────────────────────
  const [showConfirm, setShowConfirm] = useState(false);
  const [reporting,   setReporting]   = useState(false);
  const [reported,    setReported]    = useState(false);

  // ── Toggle Like ────────────────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (likingInFlight) return;

    // Snapshots for rollback
    const prevLiked    = isLiked;
    const prevCount    = likeCount;
    const prevDisliked = isDisliked;
    const prevDCount   = dislikeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount((n) => (isLiked ? n - 1 : n + 1));
    // Mutual exclusivity: liking cancels any active dislike immediately
    if (!isLiked && isDisliked) {
      setIsDisliked(false);
      setDislikeCount((n) => Math.max(0, n - 1));
    }

    setLikingInFlight(true);
    try {
      const { data } = await api.put(`/anon/${post._id}/like`);
      // Server is source of truth — sync exact counts
      setLikeCount(data.likes);
      setIsLiked(data.liked);
    } catch (err) {
      // Roll back everything
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      setIsDisliked(prevDisliked);
      setDislikeCount(prevDCount);
      toast.error(err.response?.data?.message || "Failed to update reaction");
    } finally {
      setLikingInFlight(false);
    }
  }, [isLiked, likeCount, isDisliked, dislikeCount, likingInFlight, post._id]);

  // ── Toggle Dislike ─────────────────────────────────────────────────────────
  const handleDislike = useCallback(async () => {
    if (dislikingInFlight) return;

    // Snapshots for rollback
    const prevDisliked = isDisliked;
    const prevDCount   = dislikeCount;
    const prevLiked    = isLiked;
    const prevCount    = likeCount;

    // Optimistic update
    setIsDisliked(!isDisliked);
    setDislikeCount((n) => (isDisliked ? n - 1 : n + 1));
    // Mutual exclusivity: disliking cancels any active like immediately
    if (!isDisliked && isLiked) {
      setIsLiked(false);
      setLikeCount((n) => Math.max(0, n - 1));
    }

    setDislikingInFlight(true);
    try {
      const { data } = await api.put(`/anon/${post._id}/dislike`);
      // Server is source of truth — sync exact counts
      setDislikeCount(data.dislikes);
      setIsDisliked(data.disliked);
    } catch (err) {
      // Roll back everything
      setIsDisliked(prevDisliked);
      setDislikeCount(prevDCount);
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error(err.response?.data?.message || "Failed to update reaction");
    } finally {
      setDislikingInFlight(false);
    }
  }, [isDisliked, dislikeCount, isLiked, likeCount, dislikingInFlight, post._id]);

  // ── Share ──────────────────────────────────────────────────────────────────
  // Uses the Web Share API on supported devices (mobile).
  // Falls back to clipboard copy on desktop browsers that don't support it.
  const handleShare = useCallback(async () => {
    const postUrl   = `${window.location.origin}/anon/${post._id}`;
    const shareText = post.content?.slice(0, 100) + (post.content?.length > 100 ? "…" : "");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this anonymous post on Lynqo",
          text: shareText,
          url: postUrl,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          toast.error("Could not share post");
        }
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

  // ── Delete ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/anon/${post._id}`);
      toast.success("Post deleted");
      onDelete?.(post._id);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  // ── Report ─────────────────────────────────────────────────────────────────
  const handleReport = async () => {
    if (reporting || reported) return;
    setReporting(true);
    try {
      await api.put(`/anon/${post._id}/report`);
      setReported(true);
      setShowConfirm(false);
      toast.success("Post reported — thank you for keeping the community safe.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to report post");
    } finally {
      setReporting(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <article
      aria-label="Anonymous post"
      className="
        bg-zinc-900 w-full
        /* Mobile: edge-to-edge, no rounding */
        border-b border-zinc-800
        /* md+: card style */
        md:rounded-2xl md:border md:border-zinc-800 md:shadow-sm
      "
    >
      {/* ── Author row — always shows "Anonymous", never real user ────────── */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-2">

        {/* Ghost icon — replaces user avatar completely */}
        <div className="
          flex-shrink-0 flex items-center justify-center
          w-8 h-8 rounded-full
          bg-zinc-800 text-zinc-400
        ">
          <Ghost size={16} />
        </div>

        {/* Identity + timestamp */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-200 leading-tight">
            Anonymous
          </p>
          <p className="text-xs text-zinc-500 leading-tight mt-0.5">
            {relTime(post.createdAt)}
          </p>
        </div>

        {/* Anon board label pill */}
        <span className="
          flex-shrink-0
          inline-flex items-center gap-1
          text-[10px] font-semibold text-zinc-400
          bg-zinc-700/50 border border-zinc-700
          rounded-full px-2 py-0.5
        ">
          <Ghost size={9} className="text-zinc-400" />
          Anon
        </span>
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

      {/* ── Action row ───────────────────────────────────────────────────── */}
      <footer className="flex items-center gap-1 px-3 pb-2 border-t border-zinc-800/50">

        {/* ── Like — optimistic ─────────────────────────────────────────── */}
        <button
          onClick={handleLike}
          disabled={likingInFlight}
          aria-label={isLiked ? "Unlike post" : "Like post"}
          aria-pressed={isLiked}
          className={`
            flex items-center gap-1.5
            min-h-[44px] px-3 rounded-xl
            text-sm font-medium
            transition-all duration-150 active:scale-95
            focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-1
            disabled:cursor-not-allowed disabled:opacity-60
            ${isLiked
              ? "text-white bg-white/10"
              : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            }
          `}
        >
          <span
            aria-hidden="true"
            style={{
              display: "inline-flex",
              transition: "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <ThumbsUp
              size={18}
              strokeWidth={isLiked ? 2.5 : 2}
              className="flex-shrink-0"
            />
          </span>
          {likeCount > 0 && (
            <span className="tabular-nums leading-none">{likeCount}</span>
          )}
        </button>

        {/* ── Dislike — optimistic ──────────────────────────────────────── */}
        <button
          onClick={handleDislike}
          disabled={dislikingInFlight}
          aria-label={isDisliked ? "Remove dislike" : "Dislike post"}
          aria-pressed={isDisliked}
          className={`
            flex items-center gap-1.5
            min-h-[44px] px-3 rounded-xl
            text-sm font-medium
            transition-all duration-150 active:scale-95
            focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1
            disabled:cursor-not-allowed disabled:opacity-60
            ${isDisliked
              ? "text-red-500 bg-red-500/10"
              : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            }
          `}
        >
          <span
            aria-hidden="true"
            style={{
              display: "inline-flex",
              transition: "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <ThumbsDown
              size={18}
              strokeWidth={isDisliked ? 2.5 : 2}
              className="flex-shrink-0"
            />
          </span>
          {dislikeCount > 0 && (
            <span className="tabular-nums leading-none">{dislikeCount}</span>
          )}
        </button>

        {/* Spacer — pushes share + report to the right */}
        <div className="flex-1" />

        {/* ── Delete — only rendered when onDelete is provided (post owner) ── */}
        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete post"
            className="
              flex items-center gap-1.5
              min-h-[44px] px-3 rounded-xl
              text-sm font-medium
              text-zinc-600 hover:text-red-500 hover:bg-red-500/10
              transition-all duration-150 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {deleting
              ? <span className="w-4 h-4 border-2 border-zinc-600 border-t-red-500 rounded-full animate-spin" />
              : <Trash2 size={16} strokeWidth={2} className="flex-shrink-0" />
            }
          </button>
        )}

        {/* ── Share — Web Share API on mobile, clipboard on desktop ─────── */}
        <button
          onClick={handleShare}
          aria-label="Share this anonymous post"
          className="
            flex items-center gap-1.5
            min-h-[44px] px-3 rounded-xl
            text-sm font-medium
            text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300
            transition-all duration-150 active:scale-95
            focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-1
          "
        >
          <Share2 size={16} strokeWidth={2} className="flex-shrink-0" />
          <span className="hidden sm:inline text-xs">Share</span>
        </button>

        {/* ── Report button ─────────────────────────────────────────────── */}
        <button
          onClick={() => !reported && setShowConfirm((v) => !v)}
          disabled={reported}
          aria-label={reported ? "Already reported" : "Report this post"}
          aria-expanded={showConfirm}
          className={`
            flex items-center gap-1.5
            min-h-[44px] px-3 rounded-xl
            text-sm font-medium
            transition-all duration-150 active:scale-95
            focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1
            disabled:opacity-50 disabled:cursor-not-allowed
            ${showConfirm
              ? "text-amber-500 bg-amber-500/10"
              : "text-zinc-500 hover:bg-zinc-800 hover:text-amber-400"
            }
            ${reported ? "text-zinc-600" : ""}
          `}
        >
          <Flag size={16} strokeWidth={showConfirm ? 2.5 : 2} className="flex-shrink-0" />
          <span className="hidden sm:inline text-xs">
            {reported ? "Reported" : "Report"}
          </span>
        </button>
      </footer>

      {/* ── Inline report confirmation dialog ───────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: showConfirm ? "1fr" : "0fr",
          transition: "grid-template-rows 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          <div style={{
            opacity: showConfirm ? 1 : 0,
            transition: "opacity 150ms ease 50ms",
          }}>
            <ReportConfirm
              onConfirm={handleReport}
              onCancel={() => setShowConfirm(false)}
              loading={reporting}
            />
          </div>
        </div>
      </div>
    </article>
  );
};

export default AnonPostCard;
