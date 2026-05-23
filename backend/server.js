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
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import anonRoutes from "./routes/anonRoutes.js";
import { initSocket } from "./socket/socketHandler.js";

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

// ── General API rate limiter — 100 requests per 15 minutes per IP ──────────
// Applied to all /api/* routes. Auth routes use a stricter limiter
// configured directly in authRoutes.js (10 req / 15 min).
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,  // Return rate-limit info in RateLimit-* headers
  legacyHeaders: false,   // Disable X-RateLimit-* headers
  message: {
    success: false,
    message: "Too many requests. Please wait a few minutes and try again.",
  },
});

// ── CORS — allow requests from the Vite dev server ─────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite dev server default
      process.env.CLIENT_URL || "http://localhost:5173",
    ],
    credentials: true, // Allow cookies / auth headers
  })
);

// ── Body parser — parse incoming JSON payloads ─────────────────────────────
app.use(express.json());

// ── Test route — verifies the API is up ────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({ message: "Campus Platform API running" });
});

// ── API Routes ─────────────────────────────────────────────────────────────
// Apply the general limiter to all API routes.
// The auth-specific limiter (10 req / 15 min) is mounted inside authRoutes.js
// so it is applied BEFORE the controllers, giving the tighter limit priority.
app.use("/api", generalLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/anon", anonRoutes);

// ── Error Handling — must be mounted AFTER all routes ──────────────────────
app.use(notFound);     // Catch any request that didn't match a route → 404
app.use(errorHandler); // Handle all errors with consistent JSON response

// ── HTTP Server + Socket.IO (initial setup, no events yet) ─────────────────
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      process.env.CLIENT_URL || "http://localhost:5173",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ── Socket.IO — delegate all real-time events to socketHandler ────────────
// initSocket registers all connection / messaging / presence events.
// Must be called AFTER the io instance is created.
initSocket(io);

// ── Start listening ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(
    `🚀 Lynqo server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`
  );
});
