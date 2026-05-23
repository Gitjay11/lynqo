/**
 * LandingPage.jsx — Public Landing Page (Dark Theme)
 *
 * Shown to unauthenticated visitors at "/".
 * Structure:
 *   <LandingTopBar />      ← zinc-950 bg, violet wordmark
 *   <HeroSection />        ← violet-900 → zinc-950 gradient
 *   <FeaturesSection />    ← zinc-950 bg
 *   <AnonymousSection />   ← zinc-950 bg (dark)
 *   <ChatPreviewSection /> ← zinc-900 bg
 *   <LandingFooter />      ← zinc-950 bg (dark)
 */

import { Link } from "react-router-dom";

import HeroSection        from "../components/landing/HeroSection.jsx";
import FeaturesSection    from "../components/landing/FeaturesSection.jsx";
import AnonymousSection   from "../components/landing/AnonymousSection.jsx";
import ChatPreviewSection from "../components/landing/ChatPreviewSection.jsx";
import LandingFooter      from "../components/landing/LandingFooter.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// LandingTopBar — Inline component (not exported — only used inside this page)
// ─────────────────────────────────────────────────────────────────────────────
const LandingTopBar = () => (
  <header
    className="
      fixed top-0 left-0 right-0 z-40
      h-14 lg:h-16
      bg-zinc-950/95 backdrop-blur-sm
      border-b border-zinc-800
    "
  >
    <div
      className="
        max-w-6xl mx-auto px-4
        h-full
        flex items-center justify-between
      "
    >
      {/* ── Wordmark ─────────────────────────────────────────────────────── */}
      <Link
        to="/"
        id="landing-topbar-logo"
        className="
          flex items-center gap-2
          min-h-[44px]
          text-violet-400 font-bold text-xl tracking-tight
          select-none flex-shrink-0
          focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-lg
        "
        aria-label="Lynqo home"
      >
        {/* Gradient logo mark */}
        <span
          className="
            w-8 h-8 rounded-xl
            bg-gradient-to-br from-violet-600 to-violet-400
            flex items-center justify-center
            text-white text-sm font-black
          "
        >
          L
        </span>
        <span>Lynqo</span>
      </Link>

      {/* ── Right: nav buttons ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Log In — outline */}
        <Link
          to="/login"
          id="landing-topbar-login"
          className="
            inline-flex items-center justify-center
            min-h-[44px]
            text-sm font-medium text-zinc-300
            px-3 py-1.5
            rounded-full
            border border-zinc-700
            hover:border-violet-500 hover:text-violet-400 hover:bg-zinc-800
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 focus:ring-offset-zinc-950
          "
        >
          Log In
        </Link>

        {/* Get Started — solid violet */}
        <Link
          to="/signup"
          id="landing-topbar-signup"
          className="
            inline-flex items-center justify-center
            min-h-[44px]
            text-sm font-semibold text-white
            px-4 py-1.5
            rounded-full
            bg-violet-600 hover:bg-violet-700 active:bg-violet-800
            shadow-sm shadow-violet-900/50
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 focus:ring-offset-zinc-950
          "
        >
          Get Started
        </Link>
      </div>
    </div>
  </header>
);

// ─────────────────────────────────────────────────────────────────────────────
// LandingPage — Root Container
// ─────────────────────────────────────────────────────────────────────────────
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Fixed top bar — pushes content down via pt-14 lg:pt-16 on HeroSection */}
      <LandingTopBar />

      {/* Sections render in order, each with its own background */}
      <main id="landing-main">
        <HeroSection />
        <FeaturesSection />
        <AnonymousSection />
        <ChatPreviewSection />
      </main>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;
