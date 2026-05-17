/**
 * SocketContext.jsx — Global Socket.IO Connection
 *
 * Creates and provides a single Socket.IO client instance.
 * The socket connects only when a user is authenticated.
 * Disconnects automatically on logout or unmount.
 *
 * (Full event wiring in Stage 5 — Real-time Chat)
 */

import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../hooks/useAuth.js";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      // If user logs out, disconnect existing socket
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Create socket connection only when user is logged in
    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      query: { userId: user._id },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // Cleanup on unmount or user change
    return () => {
      newSocket.disconnect();
    };
  }, [user]); // re-run when auth state changes

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
