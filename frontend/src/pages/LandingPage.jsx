/**
 * LandingPage.jsx — Public Landing Page
 *
 * Shown to unauthenticated visitors at "/".
 * If a user IS logged in, App.jsx redirects "/" → "/feed" before this renders.
 *
 * Structure:
 *   <LandingTopBar />      ← defined inline below (not a separate file)
 *   <HeroSection />        ← white bg
 *   <FeaturesSection />    ← gray-50 bg
 *   <AnonymousSection />   ← gray-900 bg (dark)
 *   <ChatPreviewSection /> ← indigo-50 bg
 *   <LandingFooter />      ← gray-900 bg (dark)
 *
 * This page does NOT use AppLayout, Navbar, Sidebar, or BottomTabBar.
 * It manages its own top bar (LandingTopBar) defined inline here.
 *
 * Scroll-smooth behaviour is provided globally via:
 *   index.css → html { scroll-behavior: smooth }
 */

import { Link } from "react-router-dom";

// ── Landing section components ────────────────────────────────────────────────
import HeroSection        from "../components/landing/HeroSection.jsx";
import FeaturesSection    from "../components/landing/FeaturesSection.jsx";
import AnonymousSection   from "../components/landing/AnonymousSection.jsx";
import ChatPreviewSection from "../components/landing/ChatPreviewSection.jsx";
import LandingFooter      from "../components/landing/LandingFooter.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// LandingTopBar — Inline component (not exported — only used inside this page)
//
// Spec:
//  - Fixed at top, full width, white background, subtle bottom shadow
//  - Height: 56px mobile / 64px desktop (h-14 / lg:h-16)
//  - Left:  Lynqo wordmark — bold, indigo-600, text-xl
//  - Right: "Log In" (outline) + "Get Started" (solid, rounded-full)
//  - Both buttons fit on mobile at text-sm, px-3, py-1.5
// ─────────────────────────────────────────────────────────────────────────────
const LandingTopBar = () => (
  <header
    className="
      fixed top-0 left-0 right-0 z-40
      h-14 lg:h-16
      bg-white/95 backdrop-blur-sm
      border-b border-gray-100 shadow-sm
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
          text-indigo-600 font-bold text-xl tracking-tight
          select-none flex-shrink-0
          focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-lg
        "
        aria-label="Lynqo home"
      >
        {/* Gradient logo mark */}
        <span
          className="
            w-8 h-8 rounded-xl
            bg-gradient-to-br from-indigo-500 to-violet-600
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
            text-sm font-medium text-gray-700
            px-3 py-1.5
            rounded-full
            border border-gray-200
            hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1
          "
        >
          Log In
        </Link>

        {/* Get Started — solid indigo */}
        <Link
          to="/signup"
          id="landing-topbar-signup"
          className="
            inline-flex items-center justify-center
            min-h-[44px]
            text-sm font-semibold text-white
            px-4 py-1.5
            rounded-full
            bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
            shadow-sm shadow-indigo-200
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1
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
    <div className="min-h-screen bg-white">
      {/* Fixed top bar — pushes content down via pt-14 lg:pt-16 on HeroSection */}
      <LandingTopBar />

      {/* Sections render in order, each with its own background color */}
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
