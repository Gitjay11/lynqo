/**
 * HeroSection.jsx — Full-Viewport Landing Hero
 *
 * Background: deep indigo → violet gradient (from-indigo-600 via-indigo-500 to-violet-500)
 * Height:     min-h-screen — fills the entire first viewport
 * Layout:     flex col, centered vertically + horizontally, text-center
 *
 * Content stack (top → bottom):
 *  1. College pill tag
 *  2. H1 headline
 *  3. Subheadline
 *  4. CTA buttons (primary + secondary)
 *  5. Trust line
 *  6. Bouncing chevron-down at very bottom
 *
 * Decorative elements:
 *  - 6 absolutely positioned CSS circles (bg-white/5, bg-white/10)
 *    pointer-events-none so they never block clicks
 *
 * Mobile-first. All touch targets ≥ 44px.
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
        bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500
        flex flex-col items-center justify-center
        text-center
        px-4
        pt-14 lg:pt-16
      "
    >
      {/* ── Decorative floating circles (pure CSS, no images) ──────────────── */}

      {/* Top-left — large */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full bg-white/5"
      />
      {/* Top-right — small */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-10 right-8 w-16 h-16 rounded-full bg-white/10"
      />
      {/* Mid-right — medium */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -right-12 w-32 h-32 rounded-full bg-white/5"
      />
      {/* Bottom-right — large */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -right-20 w-48 h-48 rounded-full bg-white/10"
      />
      {/* Bottom-left — small */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-16 left-6 w-8 h-8 rounded-full bg-white/10"
      />
      {/* Center-left — tiny accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -left-8 w-16 h-16 rounded-full bg-white/5"
      />

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto w-full">

        {/* 1. College pill tag */}
        <div className="
          inline-flex items-center gap-2
          bg-white/10 text-white text-xs
          px-4 py-1.5 rounded-full
          mb-8 select-none
        ">
          <span>🎓</span>
          <span className="font-medium tracking-wide">
            Exclusively for college students
          </span>
        </div>

        {/* 2. H1 headline */}
        <h1 className="
          text-4xl md:text-5xl lg:text-6xl
          font-bold text-white leading-tight
          mb-4
        ">
          Everything happening on campus —{" "}
          <span className="whitespace-nowrap">right here.</span>
        </h1>

        {/* 3. Subheadline */}
        <p className="
          text-white/80 text-lg md:text-xl
          max-w-lg mx-auto mt-4
          leading-relaxed
        ">
          The private space our campus was missing.
        </p>

        {/* 4. CTA buttons */}
        <div className="
          mt-8 flex flex-col sm:flex-row
          gap-3 items-center
          w-full sm:w-auto
        ">
          {/* Primary — white bg, indigo text */}
          <Link
            to="/signup"
            id="hero-cta-signup"
            className="
              w-full sm:w-auto
              inline-flex items-center justify-center
              min-h-[48px] px-8 py-3
              bg-white hover:bg-gray-50 active:bg-gray-100
              text-indigo-700 font-semibold text-base
              rounded-full
              shadow-lg shadow-indigo-900/30
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600
            "
          >
            Get Started →
          </Link>

          {/* Secondary — transparent, white border + text */}
          <Link
            to="/login"
            id="hero-cta-login"
            className="
              w-full sm:w-auto
              inline-flex items-center justify-center
              min-h-[48px] px-8 py-3
              bg-transparent
              border border-white
              text-white font-semibold text-base
              rounded-full
              hover:bg-white/10 active:bg-white/20
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600
            "
          >
            Login
          </Link>
        </div>

        {/* 5. Trust line */}
        <p className="text-white/50 text-sm mt-4 select-none">
          Free forever. No ads. No nonsense.
        </p>

      </div>

      {/* 6. Bouncing chevron — anchored to bottom of viewport */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
        <ChevronDown
          size={28}
          className="text-white/50 animate-bounce"
          aria-hidden="true"
        />
      </div>
    </section>
  );
};

export default HeroSection;
