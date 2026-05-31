/**
 * NotificationContext.jsx — Global Notification State
 *
 * Provides notification state and actions to the entire app.
 *
 * Context value shape:
 *  {
 *    notifications:      Notification[]  — array of notification objects (up to 30)
 *    unreadCount:        number          — count of unread notifications
 *    loading:            boolean         — true while initial fetch is in-flight
 *    isPanelOpen:        boolean         — whether the notification panel is open
 *    openPanel:          () => void      — open the notification panel
 *    closePanel:         () => void      — close the notification panel
 *    fetchNotifications: () => Promise   — re-fetch from API
 *    markAsRead:         (id) => Promise — mark single notification read
 *    markAllAsRead:      () => Promise   — mark all read
 *    deleteNotification: (id) => Promise — remove a notification
 *  }
 *
 * Real-time strategy:
 *  Listens for 'new_notification' socket events and prepends new notifications
 *  to local state. A subtle toast is shown only when:
 *   a) The notification panel is NOT currently open, AND
 *   b) The user is NOT already on the page where the notification leads
 *      (e.g. no toast for a new_message if already inside that chat)
 *
 * Placement in provider tree (App.jsx):
 *  AuthProvider → SocketProvider → NotificationProvider → Routes
 *  NotificationProvider is inside SocketProvider so it can access the socket
 *  instance via useSocket(). It is inside AuthProvider so it can read the
 *  user to know when to fetch.
 */

import { createContext, useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api/axios.js";
import { useAuth } from "../hooks/useAuth.js";
import { useSocket } from "../hooks/useSocket.js";

// ── Route resolver — same logic as NotificationPanel/NotificationItem ─────────
// Determines which page a notification links to. Used to suppress toasts when
// the user is already on that page.
const resolveNotificationRoute = (notification) => {
  if (notification.type === "new_message" && notification.conversationId) {
    return `/chat/${notification.conversationId}`;
  }
  if (notification.type === "like_anon") return "/anon";
  return "/feed";
};

// eslint-disable-next-line react-refresh/only-export-components
export const NotificationContext = createContext({
  notifications:      [],
  unreadCount:        0,
  loading:            false,
  isPanelOpen:        false,
  openPanel:          () => {},
  closePanel:         () => {},
  fetchNotifications: async () => {},
  markAsRead:         async () => {},
  markAllAsRead:      async () => {},
  deleteNotification: async () => {},
});

export const NotificationProvider = ({ children }) => {
  const { user }        = useAuth();
  const { socket }      = useSocket();
  const location        = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);

  // ── Panel open/close state — lives here so the toast logic can read it ────
  // NotificationBell consumes openPanel/closePanel/isPanelOpen from context
  // instead of maintaining its own local useState.
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const openPanel  = useCallback(() => setIsPanelOpen(true),  []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);

  // Ref so the socket handler always reads the latest values without needing
  // to be re-registered when they change (avoids stale closure issues).
  const isPanelOpenRef = useRef(isPanelOpen);
  const locationRef    = useRef(location);
  useEffect(() => { isPanelOpenRef.current = isPanelOpen; }, [isPanelOpen]);
  useEffect(() => { locationRef.current    = location;    }, [location]);

  // Ref to avoid re-registering socket listener on every render
  const socketRef = useRef(socket);
  useEffect(() => { socketRef.current = socket; }, [socket]);

  // ── Fetch notifications from API ──────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await api.get("/notifications");
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      // Non-fatal — fail silently so a notifications error doesn't break the app
      console.error("[NotificationContext] Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ── Initial fetch on login ────────────────────────────────────────────────
  // Re-runs when user changes (login / logout cycle).
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      // User logged out — clear state
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchNotifications]);

  // ── Real-time: listen for 'new_notification' socket event ─────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      // ── 1. Always update state (panel badge + list) ───────────────────────
      setNotifications((prev) => [notification, ...prev].slice(0, 30));
      setUnreadCount((prev) => prev + 1);

      // ── 2. Conditionally show a toast ─────────────────────────────────────
      // Suppress toast if:
      //  a) The notification panel is currently open (user already sees it), OR
      //  b) The user is already on the page where this notification would navigate
      //     (e.g. already in that chat conversation, already on /feed, etc.)
      //
      // We read from refs here because the handler is registered once and would
      // capture stale closure values if we used the state variables directly.
      const panelIsOpen     = isPanelOpenRef.current;
      const currentPath     = locationRef.current.pathname;
      const destinationPath = resolveNotificationRoute(notification);
      const alreadyOnPage   = currentPath === destinationPath;

      if (!panelIsOpen && !alreadyOnPage) {
        toast("🔔 New notification", {
          duration: 3000,
          style: {
            background:   "#18181B", // zinc-900 — matches existing app toast style
            color:        "#FAFAFA",
            borderRadius: "12px",
            fontSize:     "14px",
            padding:      "12px 16px",
          },
        });
      }
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket]);

  // ── markAsRead — single notification ─────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    // Optimistic update: flip read flag locally before the API call
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.put(`/notifications/${id}/read`);
    } catch (err) {
      // On failure: revert the optimistic update
      console.error("[NotificationContext] markAsRead error:", err.message);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // ── markAllAsRead — bulk ──────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    // Optimistic update: mark all read locally
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const previousCount = unreadCount;
    setUnreadCount(0);

    try {
      await api.put("/notifications/read-all");
    } catch (err) {
      console.error("[NotificationContext] markAllAsRead error:", err.message);
      // Revert: re-fetch from server for accuracy
      setUnreadCount(previousCount);
      fetchNotifications();
    }
  }, [unreadCount, fetchNotifications]);

  // ── deleteNotification — remove from list ─────────────────────────────────
  const deleteNotification = useCallback(async (id) => {
    // Optimistic update: remove from list, adjust unread count
    const target = notifications.find((n) => n._id === id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (target && !target.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await api.delete(`/notifications/${id}`);
    } catch (err) {
      console.error("[NotificationContext] deleteNotification error:", err.message);
      // Revert: re-fetch for accuracy
      fetchNotifications();
    }
  }, [notifications, fetchNotifications]);

  // ── Context value ─────────────────────────────────────────────────────────
  const value = {
    notifications,
    unreadCount,
    loading,
    isPanelOpen,
    openPanel,
    closePanel,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
