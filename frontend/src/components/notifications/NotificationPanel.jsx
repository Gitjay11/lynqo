/**
 * NotificationPanel.jsx — Dropdown Notification Panel (Upgraded)
 *
 * Dropdown card showing recent notifications.
 * Uses NotificationItem for each row, EmptyState for empty list.
 */

import { useEffect }        from "react";
import { useNotifications } from "../../hooks/useNotifications.js";
import NotificationItem     from "./NotificationItem.jsx";
import EmptyState           from "../common/EmptyState.jsx";

// ── Skeleton row — shown while loading ────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex items-start gap-3 px-4 py-3 border-b border-[var(--border)] last:border-b-0">
    <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2 pt-0.5">
      <div className="skeleton h-3 w-4/5 rounded-full" />
      <div className="skeleton h-2.5 w-1/3 rounded-full" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const NotificationPanel = ({ onClose }) => {
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // ── Close on Escape ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Handle notification click: mark read + close panel ───────────────────
  const handleNotifClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    onClose();
  };

  // ── Handle delete ────────────────────────────────────────────────────────
  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteNotification?.(id);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Notifications"
      className="
        absolute right-0 top-[calc(100%+8px)] z-50
        w-80
        max-h-96
        bg-[var(--bg-surface)] border border-[var(--border)]
        rounded-2xl shadow-xl
        overflow-hidden
        flex flex-col
        animate-slide-up
      "
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {/* Title */}
        <h2 className="font-display font-bold text-sm text-[var(--text-primary)]">
          Notifications
        </h2>

        {/* Mark all read — only when there are unread */}
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="
              font-sans font-semibold text-xs text-[var(--accent)]
              cursor-pointer hover:underline
              transition-colors duration-150
              focus:outline-none
            "
          >
            Mark all read
          </button>
        )}
      </div>

      {/* ── Scrollable notification list ─────────────────────────────────── */}
      <div className="overflow-y-auto max-h-[320px] flex-1">

        {/* Loading — 3 skeleton rows */}
        {loading && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}

        {/* Empty state */}
        {!loading && notifications.length === 0 && (
          <EmptyState
            emoji="🔔"
            title="You're all caught up"
            subtitle="No new notifications"
          />
        )}

        {/* Notification rows */}
        {!loading && notifications.length > 0 && (
          <ul role="list" className="divide-y-0">
            {notifications.map((n) => (
              <NotificationItem
                key={n._id}
                notification={n}
                onClick={handleNotifClick}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
