/**
 * socketInstance.js — Socket.IO Singleton
 *
 * Problem it solves:
 *  Controllers need access to the `io` instance to emit real-time events
 *  (e.g., push a notification to a connected user). But `io` is created in
 *  server.js, which is the entry point — importing server.js from a controller
 *  would create a circular dependency.
 *
 * Solution:
 *  This module holds a module-level reference to the `io` instance.
 *  server.js calls setIO(io) once after Socket.IO is initialised.
 *  Any controller/utility then calls getIO() to retrieve the same instance.
 *
 * Usage in server.js:
 *   import { setIO } from './socket/socketInstance.js';
 *   setIO(io); // called once, right after initSocket(io)
 *
 * Usage in any controller or utility:
 *   import { getIO } from '../socket/socketInstance.js';
 *   const io = getIO();
 *   io.to(socketId).emit('new_notification', payload);
 *
 * ⚠️  Horizontal scaling note:
 *  This in-process singleton works for a single Node.js instance.
 *  If the app is ever scaled across multiple processes, migrate to
 *  a Redis-backed Socket.IO adapter (socket.io-redis) and replace this
 *  with a Redis pub/sub emit pattern.
 */

// Module-level holder — undefined until setIO() is called.
let _io;

/**
 * setIO — Store the Socket.IO server instance.
 * Must be called exactly once from server.js after `new Server(httpServer, ...)`.
 *
 * @param {import('socket.io').Server} ioInstance
 */
export const setIO = (ioInstance) => {
  _io = ioInstance;
};

/**
 * getIO — Retrieve the stored Socket.IO server instance.
 * Returns undefined if called before setIO() — this should never happen in
 * normal operation since server.js calls setIO() synchronously at startup.
 *
 * @returns {import('socket.io').Server}
 */
export const getIO = () => _io;
