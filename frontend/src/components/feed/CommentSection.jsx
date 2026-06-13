/**
 * CommentSection.jsx — Collapsible Post Comments
 *
 * Features:
 *  - Flat comment list — avatar + name/time row + text
 *  - Delete own comment: trash icon → confirmation dialog → delete
 *  - Comment input: rounded-full bg-elevated, focus → accent border
 *  - Send button appears only when input has text
 *  - Avatar 24px (xs) on input row
 *
 * API routes:
 *  - POST   /api/posts/:id/comment               — add comment
 *  - DELETE /api/posts/:id/comment/:commentId     — delete comment
 */

import { useState, useCallback } from "react";
import { SendHorizonal, Loader2, Trash2 } from "lucide-react";
import ConfirmDialog from "../common/ConfirmDialog.jsx";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import Avatar from "../common/Avatar.jsx";

// ── Relative timestamp helper ─────────────────────────────────────────────────
const relTime = (d) => {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }); }
  catch { return ""; }
};

// ── Normalise a raw comment from the backend ──────────────────────────────────
// Backend schema stores the author as `user` (populated), not `author`.
// We normalise here so the rest of the component always uses `comment.author`.
const normaliseComment = (c) => ({
  ...c,
  // If the backend returns { user: {...} }, map it to { author: {...} }
  author: c.author ?? c.user ?? null,
});

// ── Single comment row ────────────────────────────────────────────────────────
const CommentRow = ({ comment, currentUser, onDelete }) => {
  const [deleting,       setDeleting]       = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const userId  = currentUser?._id ?? currentUser?.id;
  const isOwner = String(comment.author?._id ?? comment.author) === String(userId);

  const handleDeleteConfirmed = async () => {
    if (deleting) return;
    setShowConfirm(false);
    setDeleting(true);
    try {
      // Route: DELETE /api/posts/:id/comment/:commentId  (singular)
      await api.delete(`/posts/${comment.postId}/comment/${comment._id}`);
      onDelete?.(comment._id);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to delete comment");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex gap-3 mb-3 last:mb-0">
        {/* Avatar — xs = 24px */}
        <div className="flex-shrink-0 mt-0.5">
          <Avatar
            src={comment.author?.profilePicture}
            name={comment.author?.name ?? ""}
            size="xs"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name + time row */}
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-bold leading-none" style={{ color: "var(--text-primary)" }}>
              {comment.author?.name ?? "Unknown"}
            </span>
            <span className="text-[10px] font-normal tabular-nums" style={{ color: "var(--text-muted)" }}>
              {relTime(comment.createdAt)}
            </span>
          </div>
          {/* Comment text */}
          <p className="text-xs leading-[1.65] mt-0.5 break-words whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
            {comment.text}
          </p>
        </div>

        {/* Delete own comment — opens confirm dialog */}
        {isOwner && (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={deleting}
            aria-label="Delete comment"
            className="
              flex-shrink-0 self-start mt-0.5 ml-auto
              p-1 rounded-lg min-h-0
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-red-400
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
          >
            {deleting
              ? <Loader2 size={12} className="animate-spin" />
              : <Trash2 size={12} />
            }
          </button>
        )}
      </div>

      {/* Per-comment delete confirmation */}
      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete comment?"
        message="This will permanently remove your comment."
        confirmLabel="Delete"
        confirmVariant="destructive"
        loading={deleting}
        onConfirm={handleDeleteConfirmed}
        onClose={() => setShowConfirm(false)}
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const CommentSection = ({ postId, initialComments = [], currentUser }) => {
  // Normalise on mount so .author always exists (backend returns .user)
  const [comments, setComments] = useState(() => initialComments.map(normaliseComment));
  const [text,     setText]     = useState("");
  const [loading,  setLoading]  = useState(false);

  const canSubmit = text.trim().length > 0 && !loading;

  // ── Submit new comment ────────────────────────────────────────────────────
  // Route: POST /api/posts/:id/comment  (singular — matches backend)
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (!canSubmit) return;

    const trimmed = text.trim();
    setText("");
    setLoading(true);
    try {
      // Backend returns { comments: [...all comments] }
      const { data } = await api.post(`/posts/${postId}/comment`, { text: trimmed });
      // Take the last comment in the returned array (the one we just posted)
      const all = data.comments ?? [];
      const newest = all[all.length - 1];
      if (newest) setComments((prev) => [...prev, normaliseComment(newest)]);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to post comment");
      setText(trimmed);
    } finally {
      setLoading(false);
    }
  }, [text, canSubmit, postId]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // ── Delete a comment from local state ────────────────────────────────────
  const handleDeleteComment = useCallback((commentId) => {
    setComments((prev) => prev.filter((c) => c._id !== commentId));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 pt-3 pb-3" style={{ borderTop: "1px solid var(--border)" }}>

      {/* ── Comment list ─────────────────────────────────────────────────── */}
      {comments.length > 0 && (
        <div className="mb-3">
          {comments.map((c) => (
            <CommentRow
              key={c._id}
              comment={{ ...c, postId }}
              currentUser={currentUser}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}

      {/* ── Comment input form ─────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2"
      >
        {/* Current user avatar — xs = 24px */}
        <div className="flex-shrink-0">
          <Avatar
            src={currentUser?.profilePicture}
            name={currentUser?.name ?? ""}
            size="xs"
          />
        </div>

        {/* Input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment..."
          maxLength={500}
          aria-label="Write a comment"
          className="
            flex-1 px-4 py-2
            rounded-full text-xs
            transition-colors duration-200
            focus:outline-none
            min-h-0 h-8
          "
          style={{
            fontFamily: "var(--font-body)",
            backgroundColor: "var(--bg-elevated)",
            border:          text ? "1px solid var(--accent)" : "1px solid var(--border)",
            color:           "var(--text-primary)",
          }}
          onFocus={e  => e.currentTarget.style.borderColor = "var(--accent)"}
          onBlur={e   => e.currentTarget.style.borderColor = text ? "var(--accent)" : "var(--border)"}
        />

        {/* Send — only visible when input has text */}
        {(text.trim().length > 0) && (
          <button
            type="submit"
            disabled={!canSubmit}
            aria-label="Post comment"
            className="
              flex items-center justify-center
              w-7 h-7 rounded-full flex-shrink-0
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-150 min-h-0
              focus:outline-none focus:ring-2 focus:ring-offset-1
              active:scale-95
            "
            style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
          >
            {loading
              ? <Loader2 size={13} className="animate-spin" />
              : <SendHorizonal size={13} strokeWidth={2.5} />
            }
          </button>
        )}
      </form>
    </div>
  );
};

export default CommentSection;
