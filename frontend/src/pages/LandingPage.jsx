/**
 * LandingPage.jsx — Public Landing Page (Theme-Aware)
 *
 * The landing page is fully theme-aware — it adapts to both light ("Warm Cream")
 * and dark ("Warm Black") modes via CSS variables.
 *
 * Structure:
 *   <LandingTopBar />      ← themed top bar
 *   <HeroSection />        ← bg-bg-primary hero
 *   <FeaturesSection />    ← bg-bg-surface bg
 *   <AnonymousSection />   ← bg-bg-primary bg
 *   <ChatPreviewSection /> ← bg-bg-surface bg
 *   <LandingFooter />      ← themed footer
 */

import { Link } from "react-router-dom";

import HeroSection        from "../components/landing/HeroSection.jsx";
import FeaturesSection    from "../components/landing/FeaturesSection.jsx";
import AnonymousSection   from "../components/landing/AnonymousSection.jsx";
import ChatPreviewSection from "../components/landing/ChatPreviewSection.jsx";
import LandingFooter      from "../components/landing/LandingFooter.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// LandingTopBar — Fixed app-bar for the landing page
// ─────────────────────────────────────────────────────────────────────────────
const LandingTopBar = () => (
  <header
    className="
      fixed top-0 left-0 right-0 z-40
      h-14 lg:h-16
      backdrop-blur-sm
    "
    style={{
      backgroundColor: "var(--bg-surface)",
      borderBottom: "1px solid var(--border)",
    }}
  >
    <div
      className="
        max-w-6xl mx-auto px-4
        h-full
        flex items-center justify-between
      "
    >
      {/* ── Wordmark ───────────────────────────────────────────────────────── */}
      <Link
        to="/"
        id="landing-topbar-logo"
        className="
          flex items-center gap-2
          min-h-[44px]
          font-bold text-xl tracking-tight
          select-none flex-shrink-0
          focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-lg
        "
        style={{ color: "var(--text-primary)" }}
        aria-label="Lynqo home"
      >
        {/* Logo mark */}
        <span
          className="
            w-8 h-8 rounded-xl
            flex items-center justify-center
            text-white text-sm font-black
          "
          style={{ backgroundColor: "var(--accent)" }}
        >
          L
        </span>
        <span>Lynqo</span>
      </Link>

      {/* ── Right: nav buttons ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Log In — outline */}
        <Link
          to="/login"
          id="landing-topbar-login"
          className="
            inline-flex items-center justify-center
            min-h-[44px]
            text-sm font-medium
            px-3 py-1.5
            rounded-full
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-1
          "
          style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.borderColor = "var(--text-muted)"; e.currentTarget.style.backgroundColor = "var(--bg-elevated)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          Log In
        </Link>

        {/* Get Started — accent solid */}
        <Link
          to="/signup"
          id="landing-topbar-signup"
          className="
            inline-flex items-center justify-center
            min-h-[44px]
            text-sm font-semibold text-white
            px-4 py-1.5
            rounded-full
            shadow-sm
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-1
          "
          style={{ backgroundColor: "var(--accent)" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--accent-hover)"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "var(--accent)"}
        >
          Get Started
        </Link>
      </div>
    </div>
  </header>
);

// ─────────────────────────────────────────────────────────────────────────────
const LandingPage = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      <LandingTopBar />

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
