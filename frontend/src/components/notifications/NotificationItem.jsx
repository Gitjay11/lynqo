/**
 * NotificationItem.jsx — Single Notification Row (Themed)
 *
 * Renders one notification entry inside the NotificationPanel list.
 * Extracted into its own component so:
 *  1. NotificationPanel stays clean and focused on layout/state.
 *  2. This component is independently testable.
 *  3. Future per-item features (swipe-to-delete on mobile, etc.) stay isolated.
 *
 * Props:
 *  - notification {object}  — the notification document from the API
 *  - onClick      {fn}      — called when the row is clicked (marks read + navigates)
 *  - onDelete     {fn}      — called when the delete button is clicked
 *                             receives (event, notificationId) so the caller
 *                             can stopPropagation before passing to the context
 *
 * Layout (mobile-first):
 *  [avatar + type badge] | [message text] [timestamp] | [unread dot] | [delete ×]
 *
 * Privacy rule (enforced here at the UI layer):
 *  For type === 'like_anon', a masked User icon replaces the sender's avatar.
 *  This is a second defence — the message string already hides the sender name.
 */

import { Trash2, Heart, ThumbsDown, MessageSquare, MessageCircle, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ── Icon map — one entry per notification type ────────────────────────────────
// bg and color are now applied via inline styles using CSS variables
const TYPE_ICON = {
  like_post:    { Icon: Heart,         useAccent: true  },
  dislike_post: { Icon: ThumbsDown,    useError: true   },
  comment_post: { Icon: MessageSquare, useAccent: true  },
  like_anon:    { Icon: Heart,         useAccent: true  },
  new_message:  { Icon: MessageCircle, useAccent: true  },
};

// ── Relative timestamp helper ─────────────────────────────────────────────────
const relativeTime = (date) => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "";
  }
};

// ── Mini sender avatar with initials fallback ─────────────────────────────────
const MiniAvatar = ({ src, name }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name || "User"}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  // Build initials from first letter of each word, max 2 chars
  const initials = name
    ? name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}
    >
      <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{initials}</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const NotificationItem = ({ notification, onClick, onDelete }) => {
  const { Icon, useAccent, useError } = TYPE_ICON[notification.type] ?? TYPE_ICON.like_post;

  // For anonymous post likes we never show the real sender avatar
  const isAnon = notification.type === "like_anon";

  // Badge background and icon color derived from type
  const badgeBg    = useError  ? "var(--error)"  : useAccent ? "var(--accent)" : "var(--bg-elevated)";
  const badgeColor = "#ffffff";

  return (
    <li>
      <button
        id={`notification-${notification._id}`}
        onClick={() => onClick(notification)}
        className="
          w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left
          transition-colors duration-100 min-h-[56px] group
        "
        style={{
          backgroundColor: notification.read ? "transparent" : "var(--accent-light)",
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-elevated)"}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = notification.read ? "transparent" : "var(--accent-light)"}
        aria-label={notification.message}
      >
        {/* ── Avatar column ──────────────────────────────────────────────── */}
        <div className="relative flex-shrink-0 mt-0.5">
          {isAnon ? (
            // Anon: masked icon — privacy layer 2 (layer 1 is the message text)
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            >
              <User size={14} style={{ color: "var(--text-muted)" }} />
            </div>
          ) : (
            <MiniAvatar
              src={notification.sender?.profilePicture}
              name={notification.sender?.name}
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
              backgroundColor: useError ? "var(--error)" : "var(--accent)",
              /* ring matches bg-surface for clean layering */
              boxShadow: "0 0 0 1.5px var(--bg-surface)",
            }}
            aria-hidden="true"
          >
            <Icon size={9} color={badgeColor} strokeWidth={2.5} />
          </span>
        </div>

        {/* ── Content column ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Message text — bold when unread */}
          <p
            className="text-xs leading-snug"
            style={{
              color: notification.read ? "var(--text-secondary)" : "var(--text-primary)",
              fontWeight: notification.read ? 400 : 600,
            }}
          >
            {notification.message}
          </p>
          {/* Relative timestamp */}
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            {relativeTime(notification.createdAt)}
          </p>
        </div>

        {/* ── Unread dot ─────────────────────────────────────────────────── */}
        {!notification.read && (
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
            style={{ backgroundColor: "var(--accent)" }}
            aria-hidden="true"
          />
        )}

        {/* ── Delete button — appears on hover / focus-within ────────────── */}
        {/* stopPropagation is handled by the onDelete callback from the parent */}
        <button
          onClick={(e) => onDelete(e, notification._id)}
          aria-label="Delete notification"
          className="
            opacity-0 group-hover:opacity-100
            p-1 rounded-lg
            transition-all duration-150 flex-shrink-0
            min-h-[28px] min-w-[28px] flex items-center justify-center
          "
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--error)"; e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          <Trash2 size={13} />
        </button>
      </button>
    </li>
  );
};

export default NotificationItem;
