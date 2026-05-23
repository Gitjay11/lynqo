/**
 * HeroSection.jsx — Full-Viewport Landing Hero (Dark Theme)
 *
 * Background: from-violet-900 via-zinc-950 to-zinc-950 gradient
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
        bg-gradient-to-br from-violet-900 via-zinc-950 to-zinc-950
        flex flex-col items-center justify-center
        text-center
        px-4
        pt-14 lg:pt-16
      "
    >
      {/* ── Decorative floating circles ──────────────────────────────────── */}

      {/* Top-left — large */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full bg-violet-800/20"
      />
      {/* Top-right — small */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-10 right-8 w-16 h-16 rounded-full bg-violet-600/15"
      />
      {/* Mid-right — medium */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -right-12 w-32 h-32 rounded-full bg-violet-800/10"
      />
      {/* Bottom-right — large */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -right-20 w-48 h-48 rounded-full bg-violet-700/15"
      />
      {/* Bottom-left — small */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-16 left-6 w-8 h-8 rounded-full bg-violet-500/20"
      />
      {/* Center-left — tiny accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -left-8 w-16 h-16 rounded-full bg-violet-600/10"
      />

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto w-full">

        {/* 1. College pill tag */}
        <div className="
          inline-flex items-center gap-2
          bg-violet-800/30 text-violet-300 text-xs
          border border-violet-700/40
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
          font-bold text-zinc-50 leading-tight
          mb-4
        ">
          Everything happening on campus —{" "}
          <span className="whitespace-nowrap text-violet-300">right here.</span>
        </h1>

        {/* 3. Subheadline */}
        <p className="
          text-zinc-400 text-lg md:text-xl
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
          {/* Primary — violet solid */}
          <Link
            to="/signup"
            id="hero-cta-signup"
            className="
              w-full sm:w-auto
              inline-flex items-center justify-center
              min-h-[48px] px-8 py-3
              bg-violet-600 hover:bg-violet-700 active:bg-violet-800
              text-white font-semibold text-base
              rounded-full
              shadow-lg shadow-violet-900/50
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-950
            "
          >
            Get Started →
          </Link>

          {/* Secondary — transparent, zinc-600 border */}
          <Link
            to="/login"
            id="hero-cta-login"
            className="
              w-full sm:w-auto
              inline-flex items-center justify-center
              min-h-[48px] px-8 py-3
              bg-transparent
              border border-zinc-600
              text-zinc-300 font-semibold text-base
              rounded-full
              hover:bg-zinc-800 hover:border-zinc-500 active:bg-zinc-700
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-950
            "
          >
            Login
          </Link>
        </div>

        {/* 5. Trust line */}
        <p className="text-zinc-600 text-sm mt-4 select-none">
          Free forever. No ads. No nonsense.
        </p>

      </div>

      {/* 6. Bouncing chevron — anchored to bottom of viewport */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
        <ChevronDown
          size={28}
          className="text-zinc-600 animate-bounce"
          aria-hidden="true"
        />
      </div>
    </section>
  );
};

export default HeroSection;
