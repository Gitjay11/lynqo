/**
 * authMiddleware.js — JWT Authentication Guard
 *
 * Exports a single middleware: `protect`
 *
 * How it works:
 *  1. Reads the JWT from the "Authorization: Bearer <token>" header
 *  2. Verifies the token signature against JWT_SECRET
 *  3. Fetches the user from the database using the decoded user ID
 *  4. Attaches the user document to req.user (password excluded)
 *  5. Calls next() to allow the request to continue
 *
 * Returns 401 Unauthorized if:
 *  - No token is provided
 *  - The token is invalid or has been tampered with
 *  - The token has expired
 *  - The user no longer exists in the database
 *
 * Usage in routes:
 *   import { protect } from "../middleware/authMiddleware.js";
 *   router.get("/profile", protect, getProfile);
 *
 * NOTE: This middleware depends on the User model (models/User.js).
 *       It will not work until the User model schema is defined.
 */

import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * protect — Route-level middleware that ensures the request
 * is coming from an authenticated user with a valid JWT.
 */
export const protect = async (req, res, next) => {
  let token;

  // ── 1. Extract token from Authorization header ────────────────────────
  // Expected format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // If no token was found, reject immediately
  if (!token) {
    res.status(401);
    return next(new Error("Not authorized — no token provided"));
  }

  try {
    // ── 2. Verify token signature and decode payload ──────────────────
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── 3. Fetch user from DB, exclude password from the result ───────
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      res.status(401);
      return next(
        new Error("Not authorized — user belonging to this token no longer exists")
      );
    }

    // ── 4. Attach user to the request object for downstream handlers ──
    req.user = user;

    next();
  } catch (error) {
    // jwt.verify throws specific errors we can differentiate:
    //  - TokenExpiredError  → token's exp claim is in the past
    //  - JsonWebTokenError  → signature mismatch, malformed token, etc.
    res.status(401);

    if (error.name === "TokenExpiredError") {
      return next(new Error("Not authorized — token has expired"));
    }

    return next(new Error("Not authorized — invalid token"));
  }
};
