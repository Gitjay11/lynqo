/**
 * HeroSection.jsx — Full-Viewport Landing Hero (Theme-Aware)
 *
 * Background: bg-bg-primary
 * Height:     min-h-screen
 * Layout:     flex col, centered vertically + horizontally, text-center
 */

import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
const HeroSection = () => {
  return (
    <section
      id="hero"
      className="
        relative overflow-hidden
        min-h-screen
        flex flex-col items-center justify-center
        text-center
        px-4
        pt-14 lg:pt-16
      "
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* ── Subtle decorative circles ─────────────────────────────────────── */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full" style={{ backgroundColor: "var(--bg-elevated)", opacity: 0.5 }} />
      <div aria-hidden="true" className="pointer-events-none absolute top-10 right-8 w-16 h-16 rounded-full" style={{ backgroundColor: "var(--border)", opacity: 0.4 }} />
      <div aria-hidden="true" className="pointer-events-none absolute top-1/2 -right-12 w-32 h-32 rounded-full" style={{ backgroundColor: "var(--bg-elevated)", opacity: 0.3 }} />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -right-20 w-48 h-48 rounded-full" style={{ backgroundColor: "var(--bg-elevated)", opacity: 0.4 }} />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-16 left-6 w-8 h-8 rounded-full" style={{ backgroundColor: "var(--border)", opacity: 0.5 }} />

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto w-full">

        {/* 1. College pill tag */}
        <div
          className="
            inline-flex items-center gap-2
            text-xs
            px-4 py-1.5 rounded-full
            mb-8 select-none
          "
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <span>🎓</span>
          <span className="font-medium tracking-wide">
            Exclusively for college students
          </span>
        </div>

        {/* 2. H1 headline */}
        <h1
          className="
            text-4xl md:text-5xl lg:text-6xl
            font-bold leading-tight
            mb-4
          "
          style={{ color: "var(--text-primary)" }}
        >
          Everything happening on campus —{" "}
          <span className="whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>right here.</span>
        </h1>

        {/* 3. Subheadline */}
        <p
          className="
            text-lg md:text-xl
            max-w-lg mx-auto mt-4
            leading-relaxed
          "
          style={{ color: "var(--text-secondary)" }}
        >
          The private space our campus was missing.
        </p>

        {/* 4. CTA buttons */}
        <div
          className="
            mt-8 flex flex-col sm:flex-row
            gap-3 items-center
            w-full sm:w-auto
          "
        >
          {/* Primary — accent solid */}
          <Link
            to="/signup"
            id="hero-cta-signup"
            className="
              w-full sm:w-auto
              inline-flex items-center justify-center
              min-h-[48px] px-8 py-3
              text-white font-semibold text-base
              rounded-full
              shadow-lg
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2
            "
            style={{ backgroundColor: "var(--accent)" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--accent-hover)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "var(--accent)"}
          >
            Get Started →
          </Link>

          {/* Secondary — bordered */}
          <Link
            to="/login"
            id="hero-cta-login"
            className="
              w-full sm:w-auto
              inline-flex items-center justify-center
              min-h-[48px] px-8 py-3
              font-semibold text-base
              rounded-full
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2
            "
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "transparent" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--bg-elevated)"; e.currentTarget.style.borderColor = "var(--text-muted)"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; }}
          >
            Login
          </Link>
        </div>

        {/* 5. Trust line */}
        <p className="text-sm mt-4 select-none" style={{ color: "var(--text-muted)" }}>
          Free forever. No ads. No nonsense.
        </p>

      </div>

      {/* 6. Bouncing chevron — anchored to bottom of viewport */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
        <ChevronDown
          size={28}
          className="animate-bounce"
          style={{ color: "var(--text-muted)" }}
          aria-hidden="true"
        />
      </div>
    </section>
  );
};

export default HeroSection;
