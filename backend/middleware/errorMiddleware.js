/**
 * errorMiddleware.js — Global Error Handler
 *
 * Two middleware functions:
 * 1. notFound   — catches any unmatched route and forwards a 404 error
 * 2. errorHandler — handles all errors passed via next(err), formats a
 *                   consistent JSON error response.
 *
 * Mount AFTER all route definitions in server.js.
 */

// ── 1. 404 Not Found catcher ──────────────────────────────────────────────
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// ── 2. Global error handler ───────────────────────────────────────────────
export const errorHandler = (err, req, res, next) => {
  // If the response status is still 200, default to 500 (server error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Only expose stack trace in development — never in production
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
