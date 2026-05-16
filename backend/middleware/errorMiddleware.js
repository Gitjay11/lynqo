/**
 * errorMiddleware.js — Global Error Handler
 *
 * Two middleware functions:
 * 1. notFound     — catches any unmatched route and forwards a 404 error
 * 2. errorHandler — handles all errors passed via next(err), formats a
 *                   consistent JSON error response.
 *
 * Handles Mongoose-specific errors:
 *  - CastError        → 400 (invalid ObjectId or type cast failure)
 *  - ValidationError  → 400 (schema validation failed, field-level messages)
 *  - Duplicate key     → 400 (unique constraint violation, code 11000)
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
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "Internal Server Error";

  // ── Mongoose CastError (e.g. invalid ObjectId in URL params) ──────────
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ── Mongoose ValidationError (schema-level validation failures) ───────
  if (err.name === "ValidationError") {
    statusCode = 400;

    // Extract field-level error messages into a readable object
    const fieldErrors = Object.keys(err.errors).reduce((acc, field) => {
      acc[field] = err.errors[field].message;
      return acc;
    }, {});

    // Return field-level errors alongside a summary message
    return res.status(statusCode).json({
      success: false,
      message: "Validation failed",
      errors: fieldErrors,
      stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
  }

  // ── Mongoose duplicate key error (unique index violation) ─────────────
  if (err.code === 11000) {
    statusCode = 400;

    // err.keyValue contains the field(s) that caused the duplicate
    // e.g. { email: "test@example.com" }
    const duplicateField = Object.keys(err.keyValue).join(", ");
    message = `${duplicateField} already exists`;
  }

  // ── Default response ─────────────────────────────────────────────────
  // If the error carries a plain `errors` object (attached by the auth
  // controller from express-validator results), include it in the response
  // so the frontend receives field-level messages alongside the summary.
  res.status(statusCode).json({
    success: false,
    message,
    // Forward field-level errors when present (express-validator failures)
    ...(err.errors && typeof err.errors === "object" && !err.errors.message
      ? { errors: err.errors }
      : {}),
    // Only expose stack trace in development — never in production
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
