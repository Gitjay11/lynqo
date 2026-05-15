/**
 * socketHandler.js — Socket.IO Event Handlers
 * All real-time events are wired here.
 * (Filled in Stage 5 — Real-time Chat)
 */

/**
 * @param {import("socket.io").Server} io
 */
export const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};
