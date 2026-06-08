/**
 * NotFoundPage.jsx — 404 Page (Themed)
 *
 * bg-bg-primary full-screen, all text uses themed variables.
 */

import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

// ─────────────────────────────────────────────────────────────────────────────
const NotFoundPage = () => {
  const { user } = useAuth();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >

      {/* 1. Giant decorative 404 */}
      <p
        className="text-8xl md:text-9xl font-bold select-none leading-none"
        style={{ color: "var(--text-muted)" }}
      >
        404
      </p>

      {/* 2. Headline */}
      <h1 className="text-xl md:text-2xl font-semibold mt-6 text-center" style={{ color: "var(--text-primary)" }}>
        Looks like this page got lost on campus.
      </h1>

      {/* 3. Subtext */}
      <p className="mt-2 text-center text-sm max-w-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        The page you are looking for does not exist or has been moved.
      </p>

      {/* 4. Action buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
        {/* Primary */}
        <Link
          to={user ? "/feed" : "/"}
          id="not-found-primary-cta"
          className="
            w-full sm:w-auto
            inline-flex items-center justify-center
            min-h-[48px] px-6 py-3
            text-white font-semibold text-sm
            rounded-full
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2
            active:scale-95
          "
          style={{ backgroundColor: "var(--accent)" }}
        >
          {user ? "Go to Feed" : "Go Home"}
        </Link>

        {/* Secondary */}
        <Link
          to="/"
          id="not-found-home-cta"
          className="
            w-full sm:w-auto
            inline-flex items-center justify-center
            min-h-[48px] px-6 py-3
            font-semibold text-sm
            rounded-full
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2
          "
          style={{
            border:     "1px solid var(--border)",
            color:      "var(--text-secondary)",
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-elevated)"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
        >
          Go Home
        </Link>
      </div>

      {/* 5. Lynqo wordmark */}
      <p
        className="font-bold mt-16 text-sm tracking-wide"
        style={{ color: "var(--text-muted)" }}
      >
        Lynqo
      </p>

    </div>
  );
};

export default NotFoundPage;
