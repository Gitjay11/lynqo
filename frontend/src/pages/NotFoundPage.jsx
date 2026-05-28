/**
 * NotFoundPage.jsx — 404 Page (Dark Theme)
 *
 * Shown when no route matches the wildcard "*" catch-all.
 * Completely standalone — no Navbar, Sidebar, or BottomTabBar.
 *
 * Layout: min-h-screen, centered column, zinc-950 bg, px-4
 *
 * Content (top → bottom):
 *  1. Giant decorative "404"     — text-8xl md:text-9xl, text-violet-900/30
 *  2. Headline                   — text-xl md:text-2xl, font-semibold, text-zinc-50
 *  3. Subtext                    — text-sm, text-zinc-400, max-w-sm
 *  4. Two buttons (stacked mobile, side-by-side sm+):
 *       - "Go to Feed" → /feed if logged in, / if not
 *       - "Go Home"    → / always (outline style)
 *  5. Lynqo wordmark             — bottom, text-violet-400, tracking-wide
 *
 * Mobile-first. All touch targets ≥ 44px (min-h-[48px]).
 */

import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

// ─────────────────────────────────────────────────────────────────────────────
const NotFoundPage = () => {
  const { user } = useAuth();

  return (
    <div className="
      min-h-screen flex flex-col items-center justify-center
      bg-zinc-950 px-4 text-center
    ">

      {/* 1. Giant decorative 404 */}
      <p className="
        text-8xl md:text-9xl font-bold text-zinc-900/20
        select-none leading-none
      ">
        404
      </p>

      {/* 2. Headline */}
      <h1 className="
        text-xl md:text-2xl font-semibold text-zinc-50
        mt-6 text-center
      ">
        Looks like this page got lost on campus.
      </h1>

      {/* 3. Subtext */}
      <p className="
        text-zinc-400 mt-2 text-center text-sm
        max-w-sm leading-relaxed
      ">
        The page you are looking for does not exist or has been moved.
      </p>

      {/* 4. Action buttons */}
      <div className="
        mt-8 flex flex-col sm:flex-row
        gap-3 items-center
        w-full sm:w-auto
      ">
        {/* Primary — "Go to Feed": /feed if logged in, / if not */}
        <Link
          to={user ? "/feed" : "/"}
          id="not-found-primary-cta"
          className="
            w-full sm:w-auto
            inline-flex items-center justify-center
            min-h-[48px] px-6 py-3
            bg-white hover:bg-zinc-100 active:bg-zinc-200
            text-black font-semibold text-sm
            rounded-full
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950
          "
        >
          {user ? "Go to Feed" : "Go to Feed"}
        </Link>

        {/* Secondary — "Go Home": always / */}
        <Link
          to="/"
          id="not-found-home-cta"
          className="
            w-full sm:w-auto
            inline-flex items-center justify-center
            min-h-[48px] px-6 py-3
            border border-zinc-700
            text-zinc-300 font-semibold text-sm
            rounded-full
            hover:bg-zinc-800 active:bg-zinc-700
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950
          "
        >
          Go Home
        </Link>
      </div>

      {/* 5. Lynqo wordmark */}
      <p className="text-zinc-600 font-bold mt-16 text-sm tracking-wide">
        Lynqo
      </p>

    </div>
  );
};

export default NotFoundPage;
