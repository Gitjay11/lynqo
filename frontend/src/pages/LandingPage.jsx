/**
 * LandingPage.jsx — Public Landing Page (Theme-Aware)
 *
 * Sections rendered in order:
 *   1. <LandingTopBar />      — fixed nav: wordmark + Login + Join Free
 *   2. <HeroSection />        — badge, headline, CTA, avatar row, mockup
 *   3. <FeaturesSection />    — 4-card feature grid
 *   4. <AnonymousSection />   — always-dark anon confessions section
 *   5. <ChatPreviewSection /> — DM feature showcase
 *   6. <StatsBar />           — 4 quick-stat boxes (inline)
 *   7. <FinalCTASection />    — always-dark CTA card (inline)
 *   8. <LandingFooter />      — always-dark footer
 *
 * Rules:
 *   - No routing, auth logic, or backend changes.
 *   - All colors via CSS variables; accent (#e8643a) hardcoded per spec.
 *   - StatsBar and FinalCTASection are inline — no separate files needed.
 */

import { Link } from "react-router-dom";

import HeroSection        from "../components/landing/HeroSection.jsx";
import FeaturesSection    from "../components/landing/FeaturesSection.jsx";
import AnonymousSection   from "../components/landing/AnonymousSection.jsx";
import ChatPreviewSection from "../components/landing/ChatPreviewSection.jsx";
import LandingFooter      from "../components/landing/LandingFooter.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 — LandingTopBar
// Fixed at top; 56 px mobile, 64 px desktop.
// Wordmark: font-weight 900, letter-spacing -0.03em, "o" in accent.
// Right: Login (ghost) + Join Free (solid accent).
// ─────────────────────────────────────────────────────────────────────────────
const LandingTopBar = () => (
  <header
    className="
      fixed top-0 left-0 right-0 z-50
      h-14 lg:h-16
      backdrop-blur-md
    "
    style={{
      backgroundColor: "var(--bg-elevated)",
      borderBottom: "0.5px solid var(--border)",
    }}
  >
    <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">

      {/* ── Wordmark ─────────────────────────────────────────────────────── */}
      <Link
        to="/"
        id="landing-topbar-logo"
        className="select-none focus:outline-none"
        style={{
          fontWeight: 900,
          letterSpacing: "-0.03em",
          fontSize: "1.25rem",
          color: "var(--text-primary)",
          textDecoration: "none",
        }}
        aria-label="Lynqo home"
      >
        Lynq<span style={{ color: "#e8643a" }}>o</span>
      </Link>

      {/* ── Right: auth buttons ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2">

        {/* Login — ghost button */}
        <Link
          to="/login"
          id="landing-topbar-login"
          className="
            inline-flex items-center justify-center
            text-sm font-semibold
            px-4 py-2 rounded-lg
            transition-all duration-150
            focus:outline-none
          "
          style={{
            border: "0.5px solid var(--border)",
            color: "var(--text-secondary)",
            backgroundColor: "transparent",
          }}
        >
          Login
        </Link>

        {/* Join Free — solid accent */}
        <Link
          to="/signup"
          id="landing-topbar-join"
          className="
            inline-flex items-center justify-center
            text-sm font-bold text-white
            px-4 py-2 rounded-lg
            transition-all duration-150
            focus:outline-none
          "
          style={{ backgroundColor: "#e8643a" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#d4572f")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#e8643a")}
        >
          Join Free
        </Link>

      </div>
    </div>
  </header>
);

// ─────────────────────────────────────────────────────────────────────────────
// Section 6 — StatsBar
// bg-surface with border-y; 2-col mobile → 4-col md.
// Number in text-primary, unit/symbol in accent #e8643a.
// ─────────────────────────────────────────────────────────────────────────────
const STATS = [
  { number: "500", unit: "+", label: "Students joined" },
  { number: "2k",  unit: "+", label: "Posts created"   },
  { number: "100", unit: "%", label: "Free forever"    },
  { number: "1",   unit: "",  label: "College (more coming)" },
];

const StatsBar = () => (
  <section
    id="stats"
    className="py-10 px-4"
    style={{
      backgroundColor: "var(--bg-surface)",
      borderTop:    "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
    }}
  >
    <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
      {STATS.map(({ number, unit, label }) => (
        <div key={label}>
          <p
            className="text-3xl font-black"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
          >
            {number}
            <span style={{ color: "#e8643a" }}>{unit}</span>
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            {label}
          </p>
        </div>
      ))}
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────────────────
// Section 7 — FinalCTASection
// Outer bg: var(--bg-primary). Inner card bg: var(--text-primary) — always dark.
// ─────────────────────────────────────────────────────────────────────────────
const FinalCTASection = () => (
  <section
    id="final-cta"
    className="py-16 px-4"
    style={{ backgroundColor: "var(--bg-primary)" }}
  >
    <div className="max-w-5xl mx-auto">
      {/* Always-dark inner card */}
      <div
        className="rounded-3xl p-10 text-center"
        style={{ backgroundColor: "var(--text-primary)" }}
      >
        <h2
          className="text-3xl md:text-4xl font-black mb-3"
          style={{ color: "#f5f0e8", letterSpacing: "-0.03em" }}
        >
          Ready to join your campus?
        </h2>
        <p
          className="text-sm mb-8 leading-relaxed"
          style={{ color: "rgba(245,240,232,0.5)" }}
        >
          The private space our campus was missing. Sign up in 30 seconds.
        </p>
        <Link
          to="/signup"
          id="final-cta-signup"
          className="
            inline-flex items-center justify-center
            text-sm font-bold text-white
            px-8 py-3.5 rounded-xl
            transition-all duration-150 active:scale-95
            focus:outline-none
          "
          style={{ backgroundColor: "#e8643a" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#d4572f")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#e8643a")}
        >
          Join Lynqo — it's free
        </Link>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────────────────
// LandingPage — root wrapper
// font-family: Inter; -webkit-font-smoothing: antialiased; scroll-behavior: smooth
// ─────────────────────────────────────────────────────────────────────────────
const LandingPage = () => (
  <div
    className="min-h-screen"
    style={{
      backgroundColor: "var(--bg-primary)",
      fontFamily: "'Inter', sans-serif",
      WebkitFontSmoothing: "antialiased",
      scrollBehavior: "smooth",
    }}
  >
    <LandingTopBar />

    <main id="landing-main">
      <HeroSection />
      <FeaturesSection />
      <AnonymousSection />
      <ChatPreviewSection />
      <StatsBar />
      <FinalCTASection />
    </main>

    <LandingFooter />
  </div>
);

export default LandingPage;
