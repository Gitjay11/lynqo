/**
 * server.js — Lynqo Backend Entry Point
 *
 * Responsibilities:
 *  - Load environment variables
 *  - Connect to MongoDB
 *  - Configure Express middleware (security, logging, CORS, parsing)
 *  - Mount all API routes
 *  - Attach global error handlers
 *  - Start HTTP server + Socket.IO
 */

import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// ── Route imports (stubs — will be filled in later stages) ──
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import anonRoutes from "./routes/anonRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

// ── Socket handler (stub — will be filled in the chat stage) ──
import { initSocket } from "./socket/socketHandler.js";

// ── Connect to database ─────────────────────────────────────────────────────
connectDB();

// ── Express app ────────────────────────────────────────────────────────────
const app = express();

// ── Security headers (helmet) ───────────────────────────────────────────────
app.use(helmet());

// ── CORS — allow frontend dev server and future production origin ───────────
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite dev server
      process.env.CLIENT_URL || "http://localhost:5173",
    ],
    credentials: true, // Allow cookies / auth headers
  })
);

// ── HTTP request logging (dev only) ────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ── Body parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Global rate limiter — prevents brute-force on all /api routes ───────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // max 200 requests per window per IP
  message: { success: false, message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// ── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/auth",  authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/anon",  anonRoutes);
app.use("/api/chat",  chatRoutes);

// ── Health check endpoint ───────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Lynqo API is running 🚀" });
});

// ── Global error handlers (must be last) ────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── HTTP Server + Socket.IO ─────────────────────────────────────────────────
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

// Initialise all socket event handlers
initSocket(io);

// ── Start listening ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Lynqo server running on port ${PORT} [${process.env.NODE_ENV}]`);
});
