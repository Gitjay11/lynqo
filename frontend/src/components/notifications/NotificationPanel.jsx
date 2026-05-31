/**
 * NotificationPanel.jsx — Notification Dropdown Panel
 *
 * Renders the full notification panel that opens when the bell is clicked.
 * Delegates per-item rendering to <NotificationItem />.
 *
 * Structure:
 *  ┌─────────────────────────────────┐
 *  │  🔔 Notifications   [Mark all] │  ← header
 *  ├─────────────────────────────────┤
 *  │  [skeleton]                     │  ← while loading
 *  │  — or —                         │
 *  │  [empty state]                  │  ← no notifications
 *  │  — or —                         │
 *  │  [NotificationItem]             │  ← populated list
 *  │  [NotificationItem]             │
 *  └─────────────────────────────────┘
 *
 * Routing on item click (resolved inside NotificationItem's onClick handler):
 *  like_post / dislike_post / comment_post → /feed
 *  like_anon                               → /anon
 *  new_message                             → /chat/:conversationId
 *
 * Mobile-first: full-width on mobile, max-w-[380px] on sm+.
 * Panel is absolutely positioned and clipped to the viewport width.
 */

import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications.js";
import NotificationItem from "./NotificationItem.jsx";

// ── Route resolver — determines where clicking a notification navigates ────────
const resolveRoute = (notification) => {
  const { type, conversationId } = notification;
  if (type === "new_message" && conversationId) return `/chat/${conversationId}`;
  if (type === "like_anon") return "/anon";
  return "/feed";
};

// ── Loading skeleton — shown while the initial API fetch is in-flight ──────────
const NotificationSkeleton = () => (
  <div className="space-y-1 p-2">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-start gap-3 p-3 rounded-xl animate-pulse">
        <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-zinc-800 rounded w-3/4" />
          <div className="h-2 bg-zinc-800 rounded w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const NotificationPanel = ({ onClose }) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // ── Item click: mark read (if unread) + navigate + close panel ───────────
  const handleItemClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    navigate(resolveRoute(notification));
    onClose();
  };

  // ── Delete: stop event propagation then call context action ──────────────
  const handleDelete = async (e, id) => {
    e.stopPropagation(); // prevent the parent button's onClick (handleItemClick)
    await deleteNotification(id);
  };

  // ── Mark all: stop propagation so the panel itself doesn't close ─────────
  const handleMarkAll = async (e) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  return (
    <div
      id="notification-panel"
      role="dialog"
      aria-label="Notifications"
      className="
        z-50 overflow-hidden
        animate-in fade-in slide-in-from-top-2 duration-150
        bg-zinc-900 rounded-2xl
        border border-zinc-800 shadow-2xl shadow-black/60

        fixed inset-x-0 top-14 mx-4
        sm:absolute sm:inset-auto sm:right-0 sm:top-[calc(100%+8px)] sm:mx-0
        sm:w-80
      "
    >
      {/* ── Panel header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-100">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs font-bold text-black bg-white rounded-full px-1.5 py-0.5 leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        {/* "Mark all read" button — only visible when unread count > 0 */}
        {unreadCount > 0 && (
          <button
            id="mark-all-read-btn"
            onClick={handleMarkAll}
            aria-label="Mark all notifications as read"
            className="
              flex items-center gap-1.5 text-xs text-zinc-400
              hover:text-zinc-100 transition-colors duration-150
              min-h-[36px] px-2 rounded-lg hover:bg-zinc-800
            "
          >
            <CheckCheck size={14} />
            <span className="hidden sm:inline">Mark all read</span>
          </button>
        )}
      </div>

      {/* ── Scrollable content area ────────────────────────────────────────── */}
      <div className="max-h-[70vh] overflow-y-auto overscroll-contain">
        {loading ? (
          /* Skeleton while fetching */
          <NotificationSkeleton />

        ) : notifications.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
              <Bell size={22} className="text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-zinc-300">You're all caught up 🎉</p>
            <p className="text-xs text-zinc-600 mt-1">
              New likes, comments and messages will appear here.
            </p>
          </div>

        ) : (
          /* Notification list — each item rendered by NotificationItem */
          <ul className="py-1.5 space-y-0.5 px-1.5">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onClick={handleItemClick}
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
