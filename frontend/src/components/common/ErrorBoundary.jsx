/**
 * ErrorBoundary.jsx — Global React Error Boundary (Theme-Aware)
 *
 * Full-screen fallback UI using CSS variable tokens (bg-primary, text-primary, accent).
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

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message ?? "An unexpected error occurred.",
    };
  }

  componentDidCatch(error, info) {
    // TODO: Replace with Sentry.captureException(error, { extra: info }) in production
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // ── Error screen ─────────────────────────────────────────────────────────
    return (
      <div
        role="alert"
        className="
          min-h-[100dvh] w-full
          flex flex-col items-center justify-center
          px-6 text-center
        "
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        {/* Icon */}
        <div className="
          w-20 h-20 rounded-full
          bg-red-500/10 flex items-center justify-center
          mb-6
        ">
          <AlertTriangle size={36} className="text-red-400" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Oops! Something went wrong
        </h1>

        {/* Friendly message */}
        <p className="text-sm max-w-[300px] leading-relaxed mb-2" style={{ color: "var(--text-secondary)" }}>
          Lynqo hit an unexpected error. Don't worry — your data is safe.
          Try reloading the page or go back to the home feed.
        </p>

        {/* Dev-only error detail */}
        {import.meta.env.DEV && this.state.errorMessage && (
          <p className="
            mt-1 mb-4 px-3 py-2
            bg-red-500/10 border border-red-500/20 rounded-lg
            text-xs text-red-400 font-mono
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
              text-white text-sm font-semibold
              min-h-[44px]
              transition-colors duration-150 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-offset-2
            "
            style={{ backgroundColor: "var(--accent)" }}
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
              text-sm font-medium
              min-h-[44px]
              transition-colors duration-150 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-offset-2
            "
            style={{
              border:          "1px solid var(--border)",
              backgroundColor: "var(--bg-surface)",
              color:           "var(--text-secondary)",
            }}
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
