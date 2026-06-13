/**
 * server.js — Lynqo Backend Entry Point
 *
 * Responsibilities:
 *  - Load environment variables from .env
 *  - Connect to MongoDB via config/db.js
 *  - Configure Express middleware (CORS, JSON body parser, morgan)
 *  - Register all API route files
 *  - Mount error-handling middleware (must be LAST)
 *  - Start HTTP server with Socket.IO attached
 *  - Delegate all real-time events to socket/socketHandler.js
 */

import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// ── Route imports (stubs — filled in per feature stage) ────────────────────
import authRoutes         from "./routes/authRoutes.js";
import userRoutes         from "./routes/userRoutes.js";
import postRoutes         from "./routes/postRoutes.js";
import chatRoutes         from "./routes/chatRoutes.js";
import anonRoutes         from "./routes/anonRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import searchRoutes       from "./routes/searchRoutes.js";
import { initSocket }     from "./socket/socketHandler.js";
import { setIO }          from "./socket/socketInstance.js";

// ── Connect to MongoDB ─────────────────────────────────────────────────────
connectDB();

// ── Express app ────────────────────────────────────────────────────────────
const app = express();

// ── Security headers — Helmet (must be first middleware) ───────────────────
// Sets X-Content-Type-Options, X-Frame-Options, HSTS, CSP, etc.
app.use(helmet());

// ── Request logging — only in development ──────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ── General API rate limiter — production only ──────────────────────────────
// In development this limiter is DISABLED — you'll hit it constantly while
// testing (page loads, likes, comments, etc. all fire API calls).
// In production it limits to 300 requests per 15 minutes per IP.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 300 : 0, // 0 = unlimited in dev
  skip: () => process.env.NODE_ENV !== "production",    // skip entirely in dev
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: "Too many requests. Please wait a few minutes and try again.",
  },
});

// ── CORS — allow requests from the Vite dev server ─────────────────────────
// In development: allow ANY localhost port (Vite may land on 5173, 5174, etc.)
// In production:  only allow CLIENT_URL from environment.
const allowedOrigin = (origin, callback) => {
  // Allow requests with no origin (curl, Postman, mobile apps)
  if (!origin) return callback(null, true);

  const isDev = process.env.NODE_ENV !== "production";
  const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);

  if (isDev && isLocalhost) return callback(null, true);
  if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return callback(null, true);

  callback(new Error(`CORS: origin '${origin}' not allowed`));
};

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true, // Allow cookies / auth headers
  })
);

// ── Body parser — parse incoming JSON payloads ─────────────────────────────
app.use(express.json());

// ── Test route — verifies the API is up ────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({ message: "Campus Platform API running" });
});

// ── API Routes ────────────────────────────────────────────────────────────────
// Apply the general limiter to all API routes.
// Auth-specific limiter (stricter) is applied inside authRoutes.js.
app.use("/api", generalLimiter);

app.use("/api/auth",          authRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/posts",         postRoutes);
app.use("/api/chat",          chatRoutes);
app.use("/api/anon",          anonRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search",        searchRoutes);

// ── Error Handling — must be mounted AFTER all routes ──────────────────────
app.use(notFound);     // Catch any request that didn't match a route → 404
app.use(errorHandler); // Handle all errors with consistent JSON response

// ── HTTP Server + Socket.IO (initial setup, no events yet) ─────────────────
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigin, // same dynamic origin function as Express CORS
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ── Socket.IO — delegate all real-time events to socketHandler ────────────
// initSocket registers all connection / messaging / presence events.
// Must be called AFTER the io instance is created.
initSocket(io);

// ── Socket singleton — store io for use in controllers/utilities ───────────
// setIO must be called AFTER initSocket so the instance is fully configured.
// Any controller can then call getIO() to emit real-time events without
// needing io passed through the function call chain.
setIO(io);

// ── Start listening ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(
    `🚀 Lynqo server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`
  );
});
