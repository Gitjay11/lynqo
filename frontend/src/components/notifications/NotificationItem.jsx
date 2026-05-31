/**
 * NotificationItem.jsx — Single Notification Row
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
const TYPE_ICON = {
  like_post:    { Icon: Heart,         color: "text-white",   bg: "bg-zinc-700"    },
  dislike_post: { Icon: ThumbsDown,    color: "text-red-400", bg: "bg-red-500/10"  },
  comment_post: { Icon: MessageSquare, color: "text-white",   bg: "bg-zinc-700"    },
  like_anon:    { Icon: Heart,         color: "text-white",   bg: "bg-zinc-700"    },
  new_message:  { Icon: MessageCircle, color: "text-white",   bg: "bg-zinc-700"    },
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
    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-semibold text-zinc-300">{initials}</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const NotificationItem = ({ notification, onClick, onDelete }) => {
  const { Icon, color, bg } = TYPE_ICON[notification.type] ?? TYPE_ICON.like_post;

  // For anonymous post likes we never show the real sender avatar
  const isAnon = notification.type === "like_anon";

  return (
    <li>
      <button
        id={`notification-${notification._id}`}
        onClick={() => onClick(notification)}
        className={`
          w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left
          transition-colors duration-100 min-h-[56px] group
          ${notification.read
            ? "hover:bg-zinc-800/60"
            : "bg-zinc-800/40 hover:bg-zinc-800/70"
          }
        `}
        aria-label={notification.message}
      >
        {/* ── Avatar column ──────────────────────────────────────────────── */}
        <div className="relative flex-shrink-0 mt-0.5">
          {isAnon ? (
            // Anon: masked icon — privacy layer 2 (layer 1 is the message text)
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
              <User size={14} className="text-zinc-400" />
            </div>
          ) : (
            <MiniAvatar
              src={notification.sender?.profilePicture}
              name={notification.sender?.name}
            />
          )}

          {/* Type badge — overlaid bottom-right of avatar */}
          <span
            className={`
              absolute -bottom-1 -right-1
              w-4 h-4 rounded-full ${bg}
              flex items-center justify-center
              ring-1 ring-zinc-900
            `}
            aria-hidden="true"
          >
            <Icon size={9} className={color} strokeWidth={2.5} />
          </span>
        </div>

        {/* ── Content column ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Message text — bold when unread */}
          <p
            className={`text-xs leading-snug ${
              notification.read ? "text-zinc-400" : "text-zinc-100 font-medium"
            }`}
          >
            {notification.message}
          </p>
          {/* Relative timestamp */}
          <p className="text-[10px] text-zinc-600 mt-0.5">
            {relativeTime(notification.createdAt)}
          </p>
        </div>

        {/* ── Unread dot ─────────────────────────────────────────────────── */}
        {!notification.read && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0 mt-2"
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
            text-zinc-600 hover:text-red-400 hover:bg-red-500/10
            transition-all duration-150 flex-shrink-0
            min-h-[28px] min-w-[28px] flex items-center justify-center
          "
        >
          <Trash2 size={13} />
        </button>
      </button>
    </li>
  );
};

export default NotificationItem;
