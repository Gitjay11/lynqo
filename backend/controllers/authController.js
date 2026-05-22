/**
 * authController.js — Authentication Controllers
 *
 * Handles all auth-related business logic:
 *  - registerUser  → POST /api/auth/register
 *  - loginUser     → POST /api/auth/login
 *  - getMe         → GET  /api/auth/me         (protected)
 *  - logoutUser    → POST /api/auth/logout      (protected)
 *
 * Validation is performed at the route level using express-validator.
 * This controller reads the validation result and short-circuits if invalid.
 *
 * Token generation is delegated to utils/generateToken.js.
 * Password is NEVER returned in any response.
 */

import { validationResult } from "express-validator";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// ── Helper — extract and format express-validator errors ──────────────────
// Returns a flat object: { fieldName: "error message", ... }
const getValidationErrors = (req) => {
  const result = validationResult(req);
  if (result.isEmpty()) return null;

  // Map each error to { field: message } for a consistent API shape
  const formatted = {};
  result.array().forEach(({ path, msg }) => {
    // Only keep the first error per field to avoid noisy responses
    if (!formatted[path]) formatted[path] = msg;
  });
  return formatted;
};

// ── Helper — build the safe user payload (no password) ────────────────────
// Used consistently across all responses that return user data.
const buildUserPayload = (user) => ({
  id:             user._id,   // always "id" — never "_id" — on the client
  name:           user.name,
  email:          user.email,
  branch:         user.branch,
  semester:       user.semester,
  bio:            user.bio,
  profilePicture: user.profilePicture,
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const registerUser = async (req, res, next) => {
  try {
    // ── 1. Check express-validator results from route middleware ──────────
    const errors = getValidationErrors(req);
    if (errors) {
      res.status(400);
      return next(
        Object.assign(new Error("Validation failed"), { errors })
      );
    }

    const { name, email, password, branch, semester } = req.body;

    // ── 2. Duplicate email check ──────────────────────────────────────────
    // Mongoose unique index would also catch this, but we check first to
    // return a clear, user-friendly 400 before hitting the DB index error.
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400);
      return next(new Error("An account with this email already exists"));
    }

    // ── 3. Create the user ────────────────────────────────────────────────
    // Password hashing is handled automatically by the pre-save hook in User.js
    const user = await User.create({
      name,
      email,
      password,
      branch,
      semester,
    });

    // ── 4. Respond with user payload + token ─────────────────────────────
    return res.status(201).json({
      success: true,
      user: buildUserPayload(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Login an existing user
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const loginUser = async (req, res, next) => {
  try {
    // ── 1. Check express-validator results ────────────────────────────────
    const errors = getValidationErrors(req);
    if (errors) {
      res.status(400);
      return next(
        Object.assign(new Error("Validation failed"), { errors })
      );
    }

    const { email, password } = req.body;

    // ── 2. Find user by email — explicitly include password field ─────────
    // Since password has no select:false on the schema, this fetch returns it.
    // We still use .select("+password") defensively in case it is added later.
    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    // ── 3. Validate credentials ───────────────────────────────────────────
    // Use a single vague error message to prevent email enumeration attacks.
    // Never reveal whether the email exists or the password was wrong.
    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      return next(new Error("Invalid email or password"));
    }

    // ── 4. Respond with user payload + token ─────────────────────────────
    return res.status(200).json({
      success: true,
      user: buildUserPayload(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get the currently authenticated user's profile
// @route   GET /api/auth/me
// @access  Protected (requires valid JWT)
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    // Return the same normalised shape as login/register so the client
    // always receives { id, name, email, ... } — never the raw Mongoose doc
    // with _id. This prevents _id vs id mismatches after a page refresh.
    return res.status(200).json({
      success: true,
      user: buildUserPayload(req.user),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Logout the current user
// @route   POST /api/auth/logout
// @access  Protected (requires valid JWT)
//
// NOTE: JWT is stateless — there is no server-side session to invalidate.
// Logout is fully handled client-side by discarding the stored token.
// This endpoint exists for semantic completeness and to give the frontend
// a consistent "logout" call. A token blacklist can be added later if needed.
// ─────────────────────────────────────────────────────────────────────────────
export const logoutUser = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};
