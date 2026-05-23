/**
 * ErrorBoundary.jsx — Global React Error Boundary
 *
 * A React class component (required by the Error Boundary API — hooks cannot
 * implement componentDidCatch / getDerivedStateFromError).
 *
 * Catches any unhandled JavaScript errors that occur during:
 *  - Rendering of any child component
 *  - Lifecycle methods of any child component
 *  - Constructors of any child component
 *
 * Does NOT catch:
 *  - Errors inside event handlers (use try/catch there)
 *  - Async errors (e.g. fetch failures — handle with toast)
 *  - Server-side rendering errors
 *
 * On crash, renders a full-screen friendly error page with:
 *  - A clear, non-scary message for students
 *  - A "Reload Page" button (hard reload — clears bad state)
 *  - A "Go Home" link (navigates to / — resets the route)
 *
 * Logging:
 *  Errors are sent to console.error with the full component stack.
 *  Replace the console.error with a Sentry/LogRocket call in production.
 *
 * Usage (in main.jsx):
 *  <ErrorBoundary>
 *    <App />
 *  </ErrorBoundary>
 */

import { Component } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null,
    };
  }

  // ── Invoked during render phase to update state before next paint ─────────
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message ?? "An unexpected error occurred.",
    };
  }

  // ── Invoked after error is thrown — ideal for logging ────────────────────
  componentDidCatch(error, info) {
    // TODO: Replace with Sentry.captureException(error, { extra: info }) in production
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  // ── Hard reload — clears any corrupted in-memory state ───────────────────
  handleReload = () => {
    window.location.reload();
  };

  // ── Go home — navigate to / without reloading the whole page ─────────────
  handleGoHome = () => {
    // Use window.location.href instead of React Router's navigate()
    // because the router itself may be inside the crashed subtree.
    window.location.href = "/";
  };

  // ──────────────────────────────────────────────────────────────────────────
  render() {
    if (!this.state.hasError) {
      // Happy path — render children normally
      return this.props.children;
    }

    // ── Error screen ─────────────────────────────────────────────────────────
    return (
      <div
        role="alert"
        className="
          min-h-[100dvh] w-full
          flex flex-col items-center justify-center
          bg-gray-50 px-6 text-center
        "
      >
        {/* Icon */}
        <div className="
          w-20 h-20 rounded-full
          bg-red-50 flex items-center justify-center
          mb-6
        ">
          <AlertTriangle size={36} className="text-red-400" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Oops! Something went wrong
        </h1>

        {/* Friendly message — students shouldn't see a wall of stack trace */}
        <p className="text-sm text-gray-500 max-w-[300px] leading-relaxed mb-2">
          Lynqo hit an unexpected error. Don't worry — your data is safe.
          Try reloading the page or go back to the home feed.
        </p>

        {/*
          Dev-only error detail — hidden in production via the env check.
          Vite sets import.meta.env.DEV = true in dev, false in prod build.
        */}
        {import.meta.env.DEV && this.state.errorMessage && (
          <p className="
            mt-1 mb-4 px-3 py-2
            bg-red-50 border border-red-100 rounded-lg
            text-xs text-red-500 font-mono
            max-w-[340px] break-words text-left
          ">
            {this.state.errorMessage}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 w-full max-w-[280px]">
          {/* Primary — Reload */}
          <button
            id="error-boundary-reload-btn"
            onClick={this.handleReload}
            className="
              w-full sm:w-auto
              flex items-center justify-center gap-2
              px-6 py-3 rounded-xl
              bg-brand-600 hover:bg-brand-700
              text-white text-sm font-semibold
              min-h-[44px]
              transition-colors duration-150 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2
            "
          >
            <RefreshCw size={16} />
            Reload Page
          </button>

          {/* Secondary — Go Home */}
          <button
            id="error-boundary-home-btn"
            onClick={this.handleGoHome}
            className="
              w-full sm:w-auto
              flex items-center justify-center gap-2
              px-6 py-3 rounded-xl
              border border-gray-200 hover:border-gray-300
              bg-white hover:bg-gray-50
              text-gray-700 text-sm font-medium
              min-h-[44px]
              transition-colors duration-150 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2
            "
          >
            <Home size={16} />
            Go Home
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
