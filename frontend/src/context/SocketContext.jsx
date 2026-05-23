/**
 * SocketContext.jsx — Global Socket.IO Connection + Online Presence
 *
 * Creates and provides a single Socket.IO client instance.
 * The socket connects only when a user is authenticated.
 * Disconnects automatically on logout or unmount.
 *
 * Context value shape:
 *   { socket: Socket | null, onlineUsers: Set<string> }
 *
 * onlineUsers — a Set of userId strings that are currently connected.
 * Updated in real-time by listening to user_online / user_offline events
 * at this top level so every consumer (ChatList, ChatWindow, OnlineDot)
 * shares one listener and one source of truth — no prop-drilling needed.
 */

import { createContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../hooks/useAuth.js";

export const SocketContext = createContext({ socket: null, onlineUsers: new Set() });

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket]           = useState(null);
  // Set<string> — userId strings of all currently-online users
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // ── Helper: add a userId to the online set ────────────────────────────────
  const addOnlineUser = useCallback((userId) => {
    setOnlineUsers((prev) => {
      const next = new Set(prev);
      next.add(userId);
      return next;
    });
  }, []);

  // ── Helper: remove a userId from the online set ──────────────────────────
  const removeOnlineUser = useCallback((userId) => {
    setOnlineUsers((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  // ── Wire / re-wire socket when auth state changes ─────────────────────────
  useEffect(() => {
    if (!user) {
      // User logged out — disconnect and clear presence state
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setOnlineUsers(new Set());
      return;
    }

    // Create socket connection only when user is logged in
    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      query: { userId: user.id },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // ── Presence event listeners ──────────────────────────────────────────
    // user_online  → { userId }   broadcast when someone connects
    // user_offline → { userId }   broadcast when someone disconnects
    newSocket.on("user_online",  ({ userId }) => addOnlineUser(userId));
    newSocket.on("user_offline", ({ userId }) => removeOnlineUser(userId));

    setSocket(newSocket);

    // Cleanup on unmount or user change — remove listeners before disconnect
    return () => {
      newSocket.off("user_online");
      newSocket.off("user_offline");
      newSocket.disconnect();
    };
  }, [user]); // re-run when auth state changes (login / logout)

  // ── Context value — stable shape consumed by useSocket() ─────────────────
  const value = { socket, onlineUsers };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
