/**
 * AnonPostCard.jsx — Anonymous Feed Post Card (Redesigned)
 *
 * Visual redesign: ghost emoji avatar, Heart like icon, hot badge (>30 likes),
 * line-clamp-4 with "Show more", comment section with ghost avatars for ALL
 * commenters (no identity revealed), theme-aware report confirm dialog,
 * hover lift animation, accent left-border on hot posts.
 *
 * All existing API calls preserved exactly:
 *   PUT /api/anon/:id/like
 *   PUT /api/anon/:id/dislike
 *   PUT /api/anon/:id/report
 *   DELETE /api/anon/:id
 *   GET /api/anon/:id/comments    (new — comment section)
 *   POST /api/anon/:id/comment    (new — comment section)
 *   DELETE /api/anon/comment/:id  (new — comment section, own only)
 *
 * SECURITY: realAuthor is never received, stored, or displayed.
 */

import { useState, useCallback, useEffect } from "react";
import {
  Heart, ThumbsDown, MessageCircle, Flag, Share2,
  AlertTriangle, Trash2, Flame, Send, Loader2, X,
} from "lucide-react";
import toast                   from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import api                     from "../../api/axios.js";
import Badge                   from "../common/Badge.jsx";
import Button                  from "../common/Button.jsx";
import Loader                  from "../common/Loader.jsx";
import ConfirmDialog           from "../common/ConfirmDialog.jsx";

// ── Relative time helper ─────────────────────────────────────────────────────
const relTime = (dateStr) => {
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); }
  catch { return ""; }
};

// ── Ghost avatar — used for poster and ALL commenters ────────────────────────
const GhostAvatar = ({ size = "md" }) => {
  const dim = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center flex-shrink-0`}
      style={{
        backgroundColor: "var(--accent-light)",
        border:          "1px solid var(--accent-border)",
      }}
      aria-hidden="true"
    >
      <span className={`${size === "sm" ? "text-sm" : "text-lg"} leading-none select-none`}>
        👻
      </span>
    </div>
  );
};

// ── Report confirmation dialog (theme-aware, no hardcoded amber) ─────────────
const ReportConfirm = ({ onConfirm, onCancel, loading }) => (
  <div
    role="alertdialog"
    aria-modal="false"
    aria-label="Report confirmation"
    className="mx-4 mb-3 p-3 rounded-xl flex items-start gap-3 animate-fade-in"
    style={{
      backgroundColor: "var(--accent-light)",
      border:          "1px solid var(--accent-border)",
    }}
  >
    <AlertTriangle
      size={14}
      className="flex-shrink-0 mt-0.5"
      style={{ color: "var(--accent)" }}
    />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
        Report this post?
      </p>
      <p className="text-[11px] font-normal mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        If 5 or more users report it, the post will be hidden automatically.
      </p>
      <div className="flex gap-2 mt-2">
        <Button
          onClick={onConfirm}
          disabled={loading}
          loading={loading}
          variant="primary"
          size="xs"
          icon={<Flag size={11} />}
        >
          Yes, Report
        </Button>
        <Button
          onClick={onCancel}
          disabled={loading}
          variant="ghost"
          size="xs"
        >
          Cancel
        </Button>
      </div>
    </div>
  </div>
);

// ── Comment section ───────────────────────────────────────────────────────────
const CommentSection = ({ postId }) => {
  const [comments,       setComments]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [commentText,    setCommentText]    = useState("");
  const [submitting,     setSubmitting]     = useState(false);
  const [deletingId,     setDeletingId]     = useState(null);   // commentId being deleted
  const [confirmDelete,  setConfirmDelete]  = useState(null);   // commentId awaiting confirm

  // Load comments on mount (GET /api/anon/:id/comments)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await api.get(`/anon/${postId}/comments`);
        if (!cancelled) setComments(data.comments ?? []);
      } catch {
        // show empty rather than spinner forever
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  // POST /api/anon/:id/comment
  const submitComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/anon/${postId}/comment`, { content: trimmed });
      setComments((prev) => [...prev, data.comment]);
      setCommentText("");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE /api/anon/:id/comment/:commentId  (after confirm)
  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    const commentId = confirmDelete;
    setConfirmDelete(null);
    setDeletingId(commentId);
    try {
      await api.delete(`/anon/${postId}/comment/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to delete comment");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>

      {/* Loading */}
      {loading && <Loader size="sm" text="" />}

      {/* Comment list */}
      {!loading && (
        <>
          {comments.length === 0 && (
            <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>
              No comments yet. Be the first!
            </p>
          )}

          <div className="flex flex-col gap-3 mb-3">
            {comments.map((comment) => (
              <div key={comment._id} className="flex gap-2.5">
                <GhostAvatar size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                      Anonymous
                    </span>
                    <span className="text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {relTime(comment.createdAt)}
                    </span>

                    {/* Delete own comment — shows after confirm */}
                    {comment.isOwner && (
                      <button
                        onClick={() => setConfirmDelete(comment._id)}
                        disabled={deletingId === comment._id}
                        aria-label="Delete comment"
                        className="ml-auto flex-shrink-0 p-1 rounded-lg min-h-0
                                   transition-colors duration-150
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                      >
                        {deletingId === comment._id
                          ? <Loader2 size={11} className="animate-spin" />
                          : <Trash2 size={11} />
                        }
                      </button>
                    )}
                  </div>
                  <p className="text-xs leading-[1.65] mt-0.5 break-words" style={{ color: "var(--text-primary)" }}>
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Comment input */}
      <div
        className="flex gap-2 items-center pt-3"
        style={{ borderTop: comments.length > 0 ? "1px solid var(--border)" : "none" }}
      >
        <GhostAvatar size="sm" />
        <input
          type="text"
          placeholder="Comment anonymously..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
          className="flex-1 rounded-full px-4 py-2 text-xs outline-none transition-colors"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border:          "1px solid var(--border)",
            color:           "var(--text-primary)",
          }}
          onFocus={(e)  => { e.currentTarget.style.borderColor = "var(--accent)"; }}
          onBlur={(e)   => { e.currentTarget.style.borderColor = "var(--border)"; }}
        />
        {commentText.trim() && (
          <button
            onClick={submitComment}
            disabled={submitting}
            aria-label="Send comment"
            className="w-7 h-7 rounded-full flex items-center justify-center
                       flex-shrink-0 min-h-0 transition-all duration-150
                       active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {submitting
              ? <Loader2 size={12} className="animate-spin text-white" />
              : <Send size={12} className="text-white" />
            }
          </button>
        )}
      </div>

      {/* Delete comment confirmation dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete comment?"
        message="This will permanently remove your anonymous comment."
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={handleDeleteConfirmed}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const AnonPostCard = ({ post, currentUser, onHidden, onDelete }) => {
  const userId  = currentUser?._id;
  const isHot   = (post.likes?.length ?? 0) > 30;

  const [deleting,          setDeleting]          = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [likeCount,         setLikeCount]         = useState(post.likes?.length ?? 0);
  const [isLiked,           setIsLiked]           = useState(
    () => (post.likes ?? []).some((id) => id?.toString() === userId)
  );
  const [likingInFlight,    setLikingInFlight]    = useState(false);
  const [likeAnimating,     setLikeAnimating]     = useState(false);
  const [dislikeCount,      setDislikeCount]      = useState(post.dislikes?.length ?? 0);
  const [isDisliked,        setIsDisliked]        = useState(
    () => (post.dislikes ?? []).some((id) => id?.toString() === userId)
  );
  const [dislikingInFlight, setDislikingInFlight] = useState(false);
  const [showConfirm,       setShowConfirm]       = useState(false);
  const [reporting,         setReporting]         = useState(false);
  const [reported,          setReported]          = useState(false);
  const [showComments,      setShowComments]      = useState(false);
  const [isExpanded,        setIsExpanded]        = useState(false);
  const [commentCount,      setCommentCount]      = useState(post.commentCount ?? 0);

  // Content truncation — "Show more" after 280 chars (~4 lines)
  const CONTENT_LIMIT = 280;
  const isLong        = (post.content?.length ?? 0) > CONTENT_LIMIT;
  const displayText   = isLong && !isExpanded
    ? post.content.slice(0, CONTENT_LIMIT) + "…"
    : post.content;

  // ── Toggle Like (PUT /api/anon/:id/like) ──────────────────────────────────
  const handleLike = useCallback(async () => {
    if (likingInFlight) return;
    // ─ Heart pop fires only when toggling ON
    if (!isLiked) {
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 300);
    }
    const prevLiked    = isLiked;
    const prevCount    = likeCount;
    const prevDisliked = isDisliked;
    const prevDCount   = dislikeCount;

    setIsLiked(!isLiked);
    setLikeCount((n) => (isLiked ? n - 1 : n + 1));
    if (!isLiked && isDisliked) {
      setIsDisliked(false);
      setDislikeCount((n) => Math.max(0, n - 1));
    }

    setLikingInFlight(true);
    try {
      const { data } = await api.put(`/anon/${post._id}/like`);
      setLikeCount(data.likes);
      setIsLiked(data.liked);
    } catch (err) {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      setIsDisliked(prevDisliked);
      setDislikeCount(prevDCount);
      toast.error(err.response?.data?.message || "Failed to update reaction");
    } finally {
      setLikingInFlight(false);
    }
  }, [isLiked, likeCount, isDisliked, dislikeCount, likingInFlight, post._id]);

  // ── Toggle Dislike (PUT /api/anon/:id/dislike) ────────────────────────────
  const handleDislike = useCallback(async () => {
    if (dislikingInFlight) return;
    const prevDisliked = isDisliked;
    const prevDCount   = dislikeCount;
    const prevLiked    = isLiked;
    const prevCount    = likeCount;

    setIsDisliked(!isDisliked);
    setDislikeCount((n) => (isDisliked ? n - 1 : n + 1));
    if (!isDisliked && isLiked) {
      setIsLiked(false);
      setLikeCount((n) => Math.max(0, n - 1));
    }

    setDislikingInFlight(true);
    try {
      const { data } = await api.put(`/anon/${post._id}/dislike`);
      setDislikeCount(data.dislikes);
      setIsDisliked(data.disliked);
    } catch (err) {
      setIsDisliked(prevDisliked);
      setDislikeCount(prevDCount);
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error(err.response?.data?.message || "Failed to update reaction");
    } finally {
      setDislikingInFlight(false);
    }
  }, [isDisliked, dislikeCount, isLiked, likeCount, dislikingInFlight, post._id]);

  // ── Share ─────────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    const postUrl   = `${window.location.origin}/anon/${post._id}`;
    const shareText = post.content?.slice(0, 100) + (post.content?.length > 100 ? "…" : "");

    if (navigator.share) {
      try {
        await navigator.share({ title: "Check out this anonymous post on Lynqo", text: shareText, url: postUrl });
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

  // ── Delete (called after confirmation) ──────────────────────────────────
  const handleDelete = async () => {
    if (deleting) return;
    setShowDeleteConfirm(false);
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

  // ── Report (PUT /api/anon/:id/report) ────────────────────────────────────
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

  // Shared action button base style
  const actionBtn = `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
    transition-all duration-150 active:scale-95 focus:outline-none min-h-0`;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <article
      aria-label="Anonymous post"
      className="rounded-2xl cursor-pointer hover:-translate-y-0.5 transition-all duration-200"
      style={{
        backgroundColor: "var(--bg-surface)",
        border:          "1px solid var(--border)",
        /* Accent left border on hot posts */
        borderLeft:      isHot ? "2.5px solid var(--accent)" : "1px solid var(--border)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor   = "var(--border)";
        e.currentTarget.style.borderLeft    = isHot
          ? "2.5px solid var(--accent)"
          : "1px solid var(--border)";
      }}
    >
      {/* ── Card header ────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-0">
        <GhostAvatar size="md" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold font-display leading-tight" style={{ color: "var(--text-primary)" }}>
            Anonymous
          </p>
          <p className="text-[10px] tabular-nums mt-0.5" style={{ color: "var(--text-muted)" }}>
            {relTime(post.createdAt)}
          </p>
        </div>

        {/* Hot badge — shows when likes > 30 */}
        {isHot && (
          <Badge variant="accent" icon={<Flame size={10} />} className="ml-auto flex-shrink-0">
            Hot
          </Badge>
        )}
      </header>

      {/* ── Post image (optional) ─────────────────────────────────────────── */}
      {post.image && (
        <div className="px-4 pt-3">
          <div
            className="w-full aspect-video rounded-xl overflow-hidden"
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
      <div className="px-4 pt-3 pb-3">
        <p
          className="text-sm leading-[1.65] whitespace-pre-wrap break-words"
          style={{ color: "var(--text-primary)" }}
        >
          {displayText}
        </p>

        {/* Show more / Show less toggle */}
        {isLong && (
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="text-xs font-semibold mt-1 min-h-0 transition-opacity hover:opacity-70"
            style={{ color: "var(--accent)" }}
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {/* ── Action row ───────────────────────────────────────────────────── */}
      <footer
        className="flex items-center gap-1 px-3 pb-2 pt-1"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {/* Like button — Heart icon */}
        <button
          onClick={handleLike}
          disabled={likingInFlight}
          aria-label={isLiked ? "Unlike post" : "Like post"}
          aria-pressed={isLiked}
          className={`${actionBtn} disabled:cursor-not-allowed disabled:opacity-60`}
          style={isLiked
            ? { color: "var(--accent)", backgroundColor: "var(--accent-light)" }
            : { color: "var(--text-muted)" }
          }
          onMouseEnter={(e) => {
            if (!isLiked) {
              e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
              e.currentTarget.style.color           = "var(--accent)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isLiked) {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color           = "var(--text-muted)";
            }
          }}
        >
          <Heart
            size={15}
            strokeWidth={isLiked ? 0 : 2}
            fill={isLiked ? "var(--accent)" : "none"}
            className={`flex-shrink-0 ${likeAnimating ? "animate-heart-pop" : ""}`}
          />
          {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
        </button>

        {/* Dislike button — clicking while liked: un-likes then dislikes (social media behaviour) */}
        <button
          onClick={handleDislike}
          disabled={dislikingInFlight}
          aria-label={isDisliked ? "Remove dislike" : "Dislike post"}
          aria-pressed={isDisliked}
          className={`${actionBtn} disabled:cursor-not-allowed disabled:opacity-60`}
          style={isDisliked
            ? { color: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)" }
            : { color: "var(--text-muted)" }
          }
          onMouseEnter={(e) => {
            if (!isDisliked) {
              e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
              e.currentTarget.style.color           = "#ef4444";
            }
          }}
          onMouseLeave={(e) => {
            if (!isDisliked) {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color           = "var(--text-muted)";
            }
          }}
        >
          <ThumbsDown size={15} strokeWidth={isDisliked ? 2.5 : 2} className="flex-shrink-0" />
          {dislikeCount > 0 && <span className="tabular-nums">{dislikeCount}</span>}
        </button>

        {/* Comment button — MessageCircle */}
        <button
          onClick={() => setShowComments((v) => !v)}
          aria-label="Toggle comments"
          className={actionBtn}
          style={showComments
            ? { color: "var(--accent)", backgroundColor: "var(--accent-light)" }
            : { color: "var(--text-muted)" }
          }
          onMouseEnter={(e) => {
            if (!showComments) {
              e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
              e.currentTarget.style.color           = "var(--text-primary)";
            }
          }}
          onMouseLeave={(e) => {
            if (!showComments) {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color           = "var(--text-muted)";
            }
          }}
        >
          <MessageCircle size={15} className="flex-shrink-0" />
          {commentCount > 0 && <span className="tabular-nums">{commentCount}</span>}
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Delete button (owner only) — shows confirm dialog */}
        {onDelete && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            aria-label="Delete post"
            className={`${actionBtn} hover:text-red-500 hover:bg-red-500/10
                        disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ color: "var(--text-muted)" }}
          >
            {deleting
              ? <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                      style={{ borderColor: "var(--border)", borderTopColor: "#ef4444" }} />
              : <Trash2 size={14} strokeWidth={2} className="flex-shrink-0" />
            }
          </button>
        )}

        {/* Share button */}
        <button
          onClick={handleShare}
          aria-label="Share this anonymous post"
          className={actionBtn}
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
            e.currentTarget.style.color           = "var(--text-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color           = "var(--text-muted)";
          }}
        >
          <Share2 size={14} strokeWidth={2} className="flex-shrink-0" />
        </button>

        {/* Report button */}
        {reported ? (
          <span className="px-2 text-xs" style={{ color: "var(--text-muted)" }}>
            Reported
          </span>
        ) : (
          <button
            onClick={() => setShowConfirm((v) => !v)}
            aria-label="Report this post"
            aria-expanded={showConfirm}
            className={`${actionBtn} hover:text-red-500 hover:bg-red-50
                        dark:hover:text-red-400 dark:hover:bg-red-950/30`}
            style={showConfirm
              ? { color: "var(--accent)", backgroundColor: "var(--accent-light)" }
              : { color: "var(--text-muted)" }
            }
          >
            <Flag size={13} strokeWidth={showConfirm ? 2.5 : 2} className="flex-shrink-0" />
          </button>
        )}
      </footer>

      {/* ── Report confirmation (animated expand) ────────────────────────────── */}
      <div
        style={{
          display:          "grid",
          gridTemplateRows: showConfirm ? "1fr" : "0fr",
          transition:       "grid-template-rows 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          <div style={{ opacity: showConfirm ? 1 : 0, transition: "opacity 150ms ease 50ms" }}>
            <ReportConfirm
              onConfirm={handleReport}
              onCancel={() => setShowConfirm(false)}
              loading={reporting}
            />
          </div>
        </div>
      </div>

      {/* ── Comment section (animated expand) ────────────────────────────────── */}
      <div
        className="px-4 pb-2"
        style={{
          display:          "grid",
          gridTemplateRows: showComments ? "1fr" : "0fr",
          transition:       "grid-template-rows 300ms ease-in-out",
        }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          {showComments && (
            <CommentSection
              postId={post._id}
              onCommentAdded={() => setCommentCount((n) => n + 1)}
            />
          )}
        </div>
      </div>
      {/* ── Delete confirmation dialog ─────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete anonymous post?"
        message="This will permanently remove your post. This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />

    </article>
  );
};

export default AnonPostCard;
