/**
 * socketHandler.js — Lynqo Real-Time Chat (Socket.IO)
 *
 * Wires all Socket.IO events for the one-to-one private messaging system.
 * Called once from server.js with the `io` instance after the HTTP server
 * has started listening.
 *
 * ── Online-user map ────────────────────────────────────────────────────────
 * onlineUsers: { [userId: string]: socketId: string }
 *
 * An in-memory object keyed by userId → socketId.
 * This lets the server quickly look up whether a specific user is connected
 * and emit directly to them if needed (see getSocketId helper below).
 *
 * ⚠️  In-memory limitation:
 *  This approach works perfectly for a single-server deployment (which covers
 *  this stage). If the app is later scaled horizontally across multiple Node
 *  processes, each process will have its own isolated map. At that point this
 *  should be migrated to a Redis-backed Socket.IO adapter (socket.io-redis).
 *  Flag for future stage.
 *
 * ── Security note ─────────────────────────────────────────────────────────
 * userId is read from socket.handshake.query.userId (client-supplied).
 * This is intentional for this stage. A future hardening step would verify
 * a JWT passed via socket.handshake.auth.token and derive the userId from it,
 * preventing a malicious client from impersonating another user's online status.
 *
 * ── Event flow summary ─────────────────────────────────────────────────────
 *  connect        → register in onlineUsers, broadcast user_online
 *  join_room      → socket.join(conversationId)
 *  send_message   → persist Message, update Conversation.lastMessage, emit receive_message to room
 *  typing         → emit user_typing to others in room
 *  stop_typing    → emit stop_typing to others in room
 *  disconnect     → remove from onlineUsers, broadcast user_offline
 */

import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

// ── In-memory online-user registry ───────────────────────────────────────────
// Format: { userId (string) → socketId (string) }
// Mutated on connect/disconnect. Read by getSocketId().
const onlineUsers = {};

/**
 * getSocketId — Look up the current socket ID for a connected user.
 *
 * @param   {string} userId  - The Mongoose ObjectId string of the user.
 * @returns {string|undefined} The socket.id if the user is online, else undefined.
 *
 * Usage example (direct emit from a route handler):
 *   import { getSocketId } from "../socket/socketHandler.js";
 *   const sid = getSocketId(recipientId);
 *   if (sid) io.to(sid).emit("notification", payload);
 */
export const getSocketId = (userId) => onlineUsers[userId];

/**
 * initSocket — Register all Socket.IO event listeners.
 *
 * @param {import("socket.io").Server} io - The Socket.IO server instance.
 */
export const initSocket = (io) => {
  io.on("connection", (socket) => {
    // ── Read userId from handshake query ─────────────────────────────────────
    // The client connects as: io("http://localhost:5000", { query: { userId } })
    const userId = socket.handshake.query.userId;

    // ── Register user in onlineUsers map ─────────────────────────────────────
    // Only register if a valid userId was supplied.
    // Anonymous/unauthenticated sockets (no userId) are allowed to connect
    // but won't appear in the online map or receive user_online events.
    if (userId) {
      onlineUsers[userId] = socket.id;

      // Attach userId to the socket object so handlers below can reference it
      // without reading the query string again.
      socket.userId = userId;

      console.log(`🟢 User online: ${userId} (socket: ${socket.id})`);

      // Broadcast to ALL connected clients so their online-indicator UI updates.
      io.emit("user_online", { userId });
    } else {
      console.log(`🔌 Anonymous socket connected: ${socket.id}`);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // EVENT: join_room
    // Client emits this immediately after opening a conversation thread.
    // The socket joins a room named after the conversationId so that subsequent
    // `send_message` emits reach everyone in that thread.
    //
    // Client payload: { conversationId: string }
    // ──────────────────────────────────────────────────────────────────────────
    socket.on("join_room", ({ conversationId }) => {
      if (!conversationId) return;

      socket.join(conversationId);
      console.log(
        `📥 Socket ${socket.id} joined room: ${conversationId}`
      );
    });

    // ──────────────────────────────────────────────────────────────────────────
    // EVENT: send_message
    // Primary messaging event. Persists the message to MongoDB, updates the
    // conversation's lastMessage reference, then emits the full populated
    // message to everyone in the conversation room.
    //
    // Client payload: { conversationId: string, text: string }
    //
    // Emits to room: "receive_message" → { message: <populated Message doc> }
    //
    // Error handling: if DB operations fail we emit "message_error" back to
    // the sender only, so they can display a retry option in the UI.
    // ──────────────────────────────────────────────────────────────────────────
    socket.on("send_message", async ({ conversationId, text }) => {
      // ── Basic validation ────────────────────────────────────────────────
      if (!conversationId || !text || !text.trim()) {
        socket.emit("message_error", {
          error: "conversationId and non-empty text are required",
        });
        return;
      }

      if (!socket.userId) {
        socket.emit("message_error", {
          error: "Not authenticated — reconnect with a valid userId",
        });
        return;
      }

      if (text.trim().length > 1000) {
        socket.emit("message_error", {
          error: "Message cannot exceed 1000 characters",
        });
        return;
      }

      try {
        // ── 1. Persist message to DB ──────────────────────────────────────
        const newMessage = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          text: text.trim(),
        });

        // ── 2. Populate sender for the emitted payload ────────────────────
        // Re-fetch with populate — .create() doesn't populate refs.
        const populatedMessage = await Message.findById(newMessage._id).populate(
          "sender",
          "name profilePicture"
        );

        // ── 3. Update conversation.lastMessage + touch updatedAt ──────────
        // updatedAt is updated automatically because we're calling .save().
        // Alternatively findByIdAndUpdate also touches updatedAt via timestamps.
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: newMessage._id,
          // `updatedAt` is handled by Mongoose's timestamps option; no manual
          // update needed. findByIdAndUpdate will trigger it automatically
          // because the document is being modified.
        });

        // ── 4. Broadcast populated message to everyone in the room ────────
        // io.to() includes the sender's socket, which allows the sender's UI
        // to render the message as confirmed (was sent → now acknowledged).
        io.to(conversationId).emit("receive_message", {
          message: populatedMessage,
        });

        console.log(
          `💬 Message in room ${conversationId} from user ${socket.userId}`
        );
      } catch (err) {
        console.error("[send_message] DB error:", err.message);

        // Emit error only to the sender so they can show a "Failed to send" UI
        socket.emit("message_error", {
          error: "Failed to save message — please try again",
        });
      }
    });

    // ──────────────────────────────────────────────────────────────────────────
    // EVENT: typing
    // Lightweight indicator — no DB write. Emits user_typing to everyone in
    // the room EXCEPT the sender (socket.to() excludes the emitting socket).
    //
    // Client payload: { conversationId: string }
    // Emits to others in room: "user_typing" → { senderId: string }
    // ──────────────────────────────────────────────────────────────────────────
    socket.on("typing", ({ conversationId }) => {
      if (!conversationId || !socket.userId) return;

      // socket.to() → emit to the room EXCLUDING this socket (the typer)
      socket.to(conversationId).emit("user_typing", {
        senderId: socket.userId,
      });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // EVENT: stop_typing
    // Counterpart to `typing`. Tells the recipient to hide the typing indicator.
    //
    // Client payload: { conversationId: string }
    // Emits to others in room: "stop_typing" → { senderId: string }
    // ──────────────────────────────────────────────────────────────────────────
    socket.on("stop_typing", ({ conversationId }) => {
      if (!conversationId || !socket.userId) return;

      socket.to(conversationId).emit("stop_typing", {
        senderId: socket.userId,
      });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // EVENT: disconnect
    // Fires automatically when the socket closes (tab closed, network drop, etc.)
    // Remove from onlineUsers and broadcast user_offline so all clients can
    // update their presence indicators immediately.
    // ──────────────────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      if (socket.userId) {
        // Only remove if this socket is still the registered one for the user.
        // Guards against a race condition where a user reconnects quickly and
        // the new socket's entry is wiped by the old socket's disconnect event.
        if (onlineUsers[socket.userId] === socket.id) {
          delete onlineUsers[socket.userId];

          // Broadcast to ALL clients so online status indicators update
          io.emit("user_offline", { userId: socket.userId });

          console.log(
            `🔴 User offline: ${socket.userId} (socket: ${socket.id})`
          );
        }
      } else {
        console.log(`❌ Anonymous socket disconnected: ${socket.id}`);
      }
    });
  });
};
