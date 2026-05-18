/**
 * CommentSection.jsx — Collapsible Comment Thread with Smooth Animation
 *
 * Rendered by PostCard. Visibility is controlled by PostCard's `showComments`
 * boolean, which is passed in as the `isOpen` prop.
 *
 * Animation strategy — CSS grid-rows trick:
 *  The wrapper uses `display: grid` and transitions between
 *  `grid-template-rows: 0fr` (collapsed) and `1fr` (expanded).
 *  An inner div with `overflow: hidden` + `min-h: 0` completes the clamp.
 *  This avoids JS-measured max-height and works perfectly with dynamic content.
 *
 * Props:
 *  isOpen      {boolean}  — Controls open/close (controlled by PostCard)
 *  postId      {string}   — The post's _id (for API URLs)
 *  comments    {Array}    — Current comments array:
 *                           [{ _id, text, createdAt, user: { _id, name, profilePicture } }]
 *  currentUser {Object}   — Logged-in user from AuthContext
 *  onAdd       {function} — (newCommentsArray) => void — called after add
 *  onDelete    {function} — (newCommentsArray) => void — called after delete
 *  postAuthorId {string}  — Post author's _id (post authors can delete any comment)
 *
 * API calls:
 *  POST   /api/posts/:id/comment              { text }
 *  DELETE /api/posts/:id/comment/:commentId
 */

import { useState, useRef, useEffect } from "react";
import { Send, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import api from "../../api/axios.js";
import Avatar from "../common/Avatar.jsx";

// ── Relative time helper ───────────────────────────────────────────────────────
const relTime = (dateStr) => {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
};

// ─────────────────────────────────────────────────────────────────────────────
const CommentSection = ({
  isOpen       = false,
  postId,
  comments     = [],
  currentUser,
  onAdd,
  onDelete,
  postAuthorId,
}) => {
  const [text,       setText]  = useState("");
  const [submitting, setSub]   = useState(false);
  const [deletingId, setDelId] = useState(null);

  // Focus the textarea when the section opens for a snappy UX
  const textareaRef = useRef(null);
  useEffect(() => {
    if (isOpen) {
      // Small delay so the CSS animation has started before we try to focus
      const t = setTimeout(() => textareaRef.current?.focus(), 220);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const MAX       = 300;
  const remaining = MAX - text.length;

  // ── Submit new comment ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || submitting) return;

    setSub(true);
    try {
      const { data } = await api.post(`/posts/${postId}/comment`, { text: trimmed });
      setText("");
      onAdd(data.comments); // backend returns fully-populated updated array
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post comment");
    } finally {
      setSub(false);
    }
  };

  // ── Delete a comment ──────────────────────────────────────────────────────
  const handleDelete = async (commentId) => {
    if (deletingId) return; // prevent double-tap while in-flight
    setDelId(commentId);
    try {
      const { data } = await api.delete(`/posts/${postId}/comment/${commentId}`);
      onDelete(data.comments);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete comment");
    } finally {
      setDelId(null);
    }
  };

  // ── Authorization helper ─────────────────────────────────────────────────
  const canDelete = (comment) => {
    if (!currentUser) return false;
    const uid = currentUser._id;
    return uid === comment.user?._id || uid === postAuthorId;
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    /*
     * ── Grid-rows animation wrapper ─────────────────────────────────────────
     * Transitions between 0fr (collapsed) and 1fr (expanded).
     * The inner div's overflow:hidden + min-h:0 performs the visual clamping.
     */
    <div
      aria-hidden={!isOpen}
      style={{
        display: "grid",
        gridTemplateRows: isOpen ? "1fr" : "0fr",
        transition: "grid-template-rows 240ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Inner clamp div — must have overflow:hidden and min-height:0 */}
      <div style={{ overflow: "hidden", minHeight: 0 }}>
        {/* Content container — opacity fades in slightly after height expands */}
        <div
          className="border-t border-gray-100 px-4 pt-3 pb-4 space-y-3"
          style={{
            opacity: isOpen ? 1 : 0,
            transition: "opacity 180ms ease 60ms", // 60ms delay so height leads
          }}
        >
          {/* ── Comment list ─────────────────────────────────────────────── */}
          {comments.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2 select-none">
              No comments yet. Be the first!
            </p>
          )}

          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c._id} className="flex items-start gap-2.5">

                {/* Avatar */}
                <Avatar
                  src={c.user?.profilePicture}
                  name={c.user?.name ?? "?"}
                  size="xs"
                  className="flex-shrink-0 mt-0.5"
                />

                {/* Bubble */}
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-3 py-2">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {c.user?.name ?? "Unknown"}
                    </p>
                    <p className="text-sm text-gray-700 mt-0.5 break-words whitespace-pre-wrap leading-snug">
                      {c.text}
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 ml-2">
                    {relTime(c.createdAt)}
                  </p>
                </div>

                {/* Delete — visible only to comment author or post author */}
                {canDelete(c) && (
                  <button
                    onClick={() => handleDelete(c._id)}
                    disabled={deletingId === c._id}
                    aria-label="Delete comment"
                    className="
                      flex-shrink-0 mt-1
                      flex items-center justify-center
                      w-7 h-7 min-h-0 rounded-full
                      text-gray-300 hover:text-red-400 hover:bg-red-50
                      transition-colors duration-150
                      focus:outline-none focus:ring-2 focus:ring-red-300
                      disabled:opacity-50
                    "
                  >
                    {deletingId === c._id
                      ? <span className="w-3 h-3 border-2 border-red-300/40 border-t-red-400 rounded-full animate-spin" />
                      : <Trash2 size={13} />
                    }
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* ── Add comment form ─────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="flex items-end gap-2 pt-1">

            {/* Own avatar */}
            <Avatar
              src={currentUser?.profilePicture}
              name={currentUser?.name ?? ""}
              size="xs"
              className="flex-shrink-0 mb-1"
            />

            {/* Input + character counter */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                id={`comment-input-${postId}`}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX))}
                onKeyDown={(e) => {
                  // Cmd/Ctrl + Enter submits without newline
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Write a comment…"
                rows={1}
                className="
                  w-full px-3 py-2
                  border border-gray-200 rounded-2xl
                  text-sm text-gray-900 placeholder-gray-400
                  bg-gray-50 focus:bg-white
                  focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                  resize-none overflow-hidden
                  transition duration-150
                  min-h-[40px]
                "
                style={{ fieldSizing: "content" }}
              />

              {/* Character counter — only visible when approaching the limit */}
              {remaining <= 50 && (
                <span
                  className={`
                    absolute bottom-2 right-3
                    text-[10px] tabular-nums pointer-events-none
                    ${remaining <= 10 ? "text-red-400" : "text-gray-400"}
                  `}
                >
                  {remaining}
                </span>
              )}
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              aria-label="Post comment"
              className="
                flex-shrink-0
                flex items-center justify-center
                w-9 h-9 min-h-0 rounded-full
                bg-brand-600 hover:bg-brand-700 active:bg-brand-800
                text-white
                transition-all duration-150 active:scale-95
                focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              {submitting
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Send size={15} />
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
