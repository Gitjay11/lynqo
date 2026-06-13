/**
 * authRoutes.js — Authentication Routes
 *
 * Defines all routes under /api/auth:
 *  POST   /api/auth/register  → registerUser
 *  POST   /api/auth/login     → loginUser
 *  GET    /api/auth/me        → protect, getMe
 *  POST   /api/auth/logout    → protect, logoutUser
 *
 * Validation rules are defined here using express-validator's `body()` checks.
 * The controller reads the result via validationResult(req) and rejects early
 * if any rule fails — keeping controller logic clean.
 *
 * `protect` is the JWT auth guard from authMiddleware.js.
 */

import express from "express";
import { body } from "express-validator";
import rateLimit from "express-rate-limit";

import { protect } from "../middleware/authMiddleware.js";
import {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
} from "../controllers/authController.js";

// ── Auth-specific rate limiter ────────────────────────────────────────────────
// Production: 10 req / 15 min — prevents brute-force / credential stuffing.
// Development: 100 req / 15 min — no one wants to be locked out while testing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 10 : 100,
  skip: () => process.env.NODE_ENV !== "production", // skip entirely in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many attempts. Please wait 15 minutes before trying again.",
  },
});

const router = express.Router();

// ── Shared validation rules ───────────────────────────────────────────────
// Keeping them as named arrays makes it easy to reuse or extend per route.

/**
 * Register validation rules
 * All fields are required; fine-grained messages mirror the schema constraints.
 */
const registerValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2 }).withMessage("Name must be at least 2 characters")
    .isLength({ max: 50 }).withMessage("Name cannot exceed 50 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),

  body("branch")
    .trim()
    .notEmpty().withMessage("Branch is required"),

  body("semester")
    .notEmpty().withMessage("Semester is required")
    .isInt({ min: 1, max: 8 }).withMessage("Semester must be a number between 1 and 8"),
];

/**
 * Login validation rules
 * Minimal — just ensure both fields are present before hitting the DB.
 */
const loginValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required"),
];

// ── Routes ────────────────────────────────────────────────────────────────

// POST /api/auth/register — Public (rate-limited)
router.post("/register", authLimiter, registerValidation, registerUser);

// POST /api/auth/login — Public (rate-limited)
router.post("/login", authLimiter, loginValidation, loginUser);

// GET /api/auth/me — Protected: requires valid JWT
router.get("/me", protect, getMe);

// POST /api/auth/logout — Protected: token must be valid to log out
router.post("/logout", protect, logoutUser);

export default router;
