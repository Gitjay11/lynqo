/**
 * useNotifications.js — Custom hook to consume NotificationContext
 *
 * Returns the full notification context value:
 *  {
 *    notifications,      — Notification[] (up to 30, newest first)
 *    unreadCount,        — number of unread notifications
 *    loading,            — boolean, true while fetching
 *    fetchNotifications, — () => Promise<void>  re-fetch from server
 *    markAsRead,         — (id: string) => Promise<void>
 *    markAllAsRead,      — () => Promise<void>
 *    deleteNotification, — (id: string) => Promise<void>
 *  }
 *
 * Usage:
 *   const { notifications, unreadCount, markAllAsRead } = useNotifications();
 */

import { useContext } from "react";
import { NotificationContext } from "../context/NotificationContext.jsx";

export const useNotifications = () => {
  return useContext(NotificationContext);
};
