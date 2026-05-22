/**
 * useSocket.js — Custom hook to consume SocketContext
 *
 * Returns: { socket: Socket | null, onlineUsers: Set<string> }
 *
 * Usage:
 *   const { socket, onlineUsers } = useSocket();
 *
 *   // Check if a user is online
 *   const isOnline = onlineUsers.has(userId);
 *
 *   // Emit a socket event
 *   socket?.emit("join_room", { conversationId });
 */

import { useContext } from "react";
import { SocketContext } from "../context/SocketContext.jsx";

export const useSocket = () => {
  return useContext(SocketContext);
};
