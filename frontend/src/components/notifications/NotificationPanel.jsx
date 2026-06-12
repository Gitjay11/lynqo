/**
 * NotificationPanel.jsx — Dropdown Notification Panel (Themed)
 *
 * bg-bg-surface card with border-app-border shadow.
 * Unread badge: bg-app-accent text-white.
 */

import { useEffect, useRef } from "react";
import { Loader2, Bell, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "../../hooks/useNotifications.js";

// ── Relative timestamp ────────────────────────────────────────────────────────
const relTime = (d) => {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }); }
  catch { return ""; }
};

// ── Notification icon map ─────────────────────────────────────────────────────
const ICONS = {
  like:     "👍",
  dislike:  "👎",
  comment:  "💬",
  follow:   "👤",
  message:  "📩",
  default:  "🔔",
};
const notifIcon = (type) => ICONS[type] ?? ICONS.default;

// ── Single notification row ───────────────────────────────────────────────────
const NotificationRow = ({ notif, onMarkRead }) => {
  const unread = !notif.read;

  return (
    <button
      onClick={() => !notif.read && onMarkRead(notif._id)}
      disabled={notif.read}
      aria-label={notif.read ? notif.message : `Mark as read: ${notif.message}`}
      style={{
        backgroundColor: unread ? "var(--accent-light)" : "transparent",
        borderBottom:    "1px solid var(--border)",
      }}
      className="
        w-full flex items-start gap-3 px-4 py-3
        min-h-[60px] text-left
        transition-colors duration-100
        focus:outline-none
        disabled:cursor-default
      "
      onMouseEnter={e => { if (notif.read) e.currentTarget.style.backgroundColor = "var(--bg-elevated)"; }}
      onMouseLeave={e => { if (notif.read) e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      {/* Type icon */}
      <span className="flex-shrink-0 mt-0.5 text-base" aria-hidden="true">
        {notifIcon(notif.type)}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug" style={{ color: "var(--text-primary)", fontWeight: unread ? 600 : 400 }}>
          {notif.message}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
          {relTime(notif.createdAt)}
        </p>
      </div>

      {/* Unread dot */}
      {unread && (
        <span
          className="flex-shrink-0 mt-1 w-2 h-2 rounded-full"
          style={{ backgroundColor: "var(--accent)" }}
          aria-hidden="true"
        />
      )}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const NotificationPanel = ({ onClose }) => {
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const panelRef = useRef(null);

  // ── Close on Escape ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label="Notifications"
      style={{
        backgroundColor: "var(--bg-surface)",
        border:          "1px solid var(--border)",
      }}
      className="
        absolute right-0 top-[calc(100%+8px)]
        w-80 sm:w-96
        max-h-[480px]
        rounded-2xl
        shadow-xl shadow-black/20
        overflow-hidden
        flex flex-col
        z-50
        animate-slide-up
      "
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <Bell size={16} style={{ color: "var(--text-secondary)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span
              className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold rounded-full"
              style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs transition-colors min-h-0"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}
          >
            <Check size={12} />
            Mark all read
          </button>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-secondary)" }} />
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: "var(--bg-elevated)" }}
            >
              <Bell size={22} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              No notifications yet
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              We'll let you know when something happens.
            </p>
          </div>
        )}

        {!loading && notifications.map((n) => (
          <NotificationRow key={n._id} notif={n} onMarkRead={markAsRead} />
        ))}
      </div>
    </div>
  );
};

export default NotificationPanel;
