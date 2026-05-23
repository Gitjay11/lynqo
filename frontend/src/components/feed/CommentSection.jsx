/**
 * CommentSection.jsx — Collapsible Post Comments (Dark Theme)
 *
 * bg-zinc-900 card, comment bubbles bg-zinc-800, input bg-zinc-800
 */

import { useState, useCallback } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import Avatar from "../common/Avatar.jsx";

// ── Relative timestamp helper ─────────────────────────────────────────────────
const relTime = (d) => {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }); }
  catch { return ""; }
};

// ── Single comment row ────────────────────────────────────────────────────────
const CommentRow = ({ comment }) => (
  <div className="flex items-start gap-2.5">
    <Avatar
      src={comment.author?.profilePicture}
      name={comment.author?.name ?? ""}
      size="xs"
      className="flex-shrink-0 mt-0.5"
    />
    <div className="flex-1 min-w-0">
      {/* Bubble */}
      <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-3 py-2 inline-block max-w-full">
        <p className="text-xs font-semibold text-zinc-100 leading-tight">
          {comment.author?.name ?? "Unknown"}
        </p>
        <p className="text-sm text-zinc-300 mt-0.5 leading-snug break-words whitespace-pre-wrap">
          {comment.text}
        </p>
      </div>
      {/* Timestamp */}
      <p className="text-[10px] text-zinc-600 mt-0.5 pl-1">
        {relTime(comment.createdAt)}
      </p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const CommentSection = ({ postId, initialComments = [], currentUser }) => {
  const [comments, setComments] = useState(initialComments);
  const [text,     setText]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [open,     setOpen]     = useState(false);

  const canSubmit = text.trim().length > 0 && !loading;

  // ── Submit new comment ──────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const trimmed = text.trim();
    setText("");
    setLoading(true);
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { text: trimmed });
      setComments((prev) => [...prev, data.comment]);
      if (!open) setOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to post comment");
      setText(trimmed); // restore text on error
    } finally {
      setLoading(false);
    }
  }, [text, canSubmit, postId, open]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-zinc-800">

      {/* ── Toggle comments button ─────────────────────────────────────────── */}
      {comments.length > 0 && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="
            flex items-center gap-1.5 px-4 py-2
            text-xs text-zinc-500 hover:text-zinc-300
            transition-colors duration-150 min-h-0
          "
        >
          <MessageSquare size={13} />
          {open
            ? "Hide comments"
            : `${comments.length} comment${comments.length !== 1 ? "s" : ""}`}
        </button>
      )}

      {/* ── Comment list — animated expand/collapse ────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          <div
            style={{
              opacity: open ? 1 : 0,
              transition: "opacity 150ms ease 50ms",
            }}
            className="px-4 py-3 space-y-3"
          >
            {comments.map((c) => (
              <CommentRow key={c._id} comment={c} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Comment input form ─────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-2"
      >
        {/* Current user avatar */}
        <Avatar
          src={currentUser?.profilePicture}
          name={currentUser?.name ?? ""}
          size="xs"
          className="flex-shrink-0"
        />

        {/* Input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a comment…"
          maxLength={500}
          aria-label="Write a comment"
          className="
            flex-1 px-3 py-2
            bg-zinc-800 border border-zinc-700 rounded-full
            text-sm text-zinc-100 placeholder-zinc-600
            focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
            transition duration-200 min-h-0 h-9
          "
        />

        {/* Send */}
        <button
          type="submit"
          disabled={!canSubmit}
          aria-label="Post comment"
          className="
            flex items-center justify-center
            w-9 h-9 rounded-full
            bg-violet-600 hover:bg-violet-700 active:bg-violet-800
            disabled:opacity-40 disabled:cursor-not-allowed
            text-white transition-all duration-150 min-h-0 flex-shrink-0
            focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 focus:ring-offset-zinc-900
          "
        >
          {loading
            ? <Loader2 size={14} className="animate-spin" />
            : <Send size={14} strokeWidth={2.5} />
          }
        </button>
      </form>

    </div>
  );
};

export default CommentSection;
