/**
 * NotificationItem.jsx — Single Notification Row (Upgraded)
 *
 * Renders one notification entry inside the NotificationPanel list.
 *
 * Props:
 *  notification {object}  — the notification document from the API
 *  onClick      {fn}      — called when the row is clicked (marks read + navigates)
 *  onDelete     {fn}      — called with (event, notificationId)
 *
 * Layout:
 *  [avatar + type badge] | [message text] [timestamp] | [unread dot] | [delete ×]
 *
 * Privacy rule:
 *  For type === 'like_anon', a masked User icon replaces the sender's avatar.
 */

import { Trash2, Heart, ThumbsDown, MessageSquare, MessageCircle, User } from "lucide-react";
import { formatDistanceToNow }  from "date-fns";
import Avatar                   from "../common/Avatar.jsx";

// ── Icon map — one entry per notification type ────────────────────────────────
const TYPE_ICON = {
  like_post:    { Icon: Heart,          useError: false },
  dislike_post: { Icon: ThumbsDown,     useError: true  },
  comment_post: { Icon: MessageSquare,  useError: false },
  like_anon:    { Icon: Heart,          useError: false },
  new_message:  { Icon: MessageCircle,  useError: false },
};

// ── Relative timestamp helper ─────────────────────────────────────────────────
const relativeTime = (date) => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "";
  }
};

// ─────────────────────────────────────────────────────────────────────────────
const NotificationItem = ({ notification, onClick, onDelete }) => {
  const { Icon, useError } = TYPE_ICON[notification.type] ?? TYPE_ICON.like_post;
  const isAnon             = notification.type === "like_anon";
  const isUnread           = !notification.read;

  return (
    <li className="border-b border-[var(--border)] last:border-b-0">
      <button
        id={`notification-${notification._id}`}
        onClick={() => onClick(notification)}
        aria-label={notification.message}
        className={`
          flex items-start gap-3 px-4 py-3 w-full text-left
          hover:bg-[var(--bg-elevated)]
          cursor-pointer transition-colors duration-150
          group
          ${isUnread ? "bg-[var(--accent-light)]/20" : ""}
        `.trim().replace(/\s+/g, " ")}
      >
        {/* ── Avatar column ─────────────────────────────────────────────── */}
        <div className="relative flex-shrink-0 mt-0.5">
          {isAnon ? (
            // Anonymous — privacy layer: never show sender avatar
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            >
              <User size={14} style={{ color: "var(--text-muted)" }} aria-hidden="true" />
            </div>
          ) : (
            <Avatar
              src={notification.sender?.profilePicture}
              name={notification.sender?.name}
              size="sm"
            />
          )}

          {/* Type badge — overlaid bottom-right of avatar */}
          <span
            className="
              absolute -bottom-1 -right-1
              w-4 h-4 rounded-full
              flex items-center justify-center
            "
            style={{
              backgroundColor: useError ? "var(--error, #ef4444)" : "var(--accent)",
              boxShadow:       "0 0 0 1.5px var(--bg-surface)",
            }}
            aria-hidden="true"
          >
            <Icon size={9} color="#ffffff" strokeWidth={2.5} />
          </span>
        </div>

        {/* ── Content column ────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Message text */}
          <p
            className="font-sans font-normal text-xs text-[var(--text-primary)] leading-relaxed"
            style={{ fontWeight: isUnread ? 600 : 400 }}
          >
            {notification.message}
          </p>
          {/* Timestamp */}
          <p className="font-sans font-normal text-[10px] text-[var(--text-muted)] mt-1">
            {relativeTime(notification.createdAt)}
          </p>
        </div>

        {/* ── Unread dot ────────────────────────────────────────────────── */}
        {isUnread && (
          <span
            className="w-2 h-2 rounded-full bg-[var(--accent)] flex-shrink-0 mt-1.5"
            aria-hidden="true"
          />
        )}

        {/* ── Delete button — appears on group hover ────────────────────── */}
        <button
          onClick={(e) => onDelete?.(e, notification._id)}
          aria-label="Delete notification"
          className="
            opacity-0 group-hover:opacity-100
            p-1 rounded-lg flex-shrink-0
            flex items-center justify-center
            min-h-[28px] min-w-[28px]
            text-[var(--text-muted)]
            hover:text-red-500 hover:bg-red-500/10
            transition-all duration-150
          "
          onClick={(e) => { e.stopPropagation(); onDelete?.(e, notification._id); }}
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </button>
    </li>
  );
};

export default NotificationItem;
