/**
 * HeroSection.jsx — Hero (Section 2)
 *
 * Background:  var(--bg-primary)
 * Padding:     pt-20 pb-16 px-4  (accounts for 56–64 px fixed nav)
 * Content:     text-center, max-w-xl mx-auto
 *
 * Sub-components:
 *   AppPreviewMockup — static decorative feed; hidden below sm breakpoint
 */

import { Link }           from "react-router-dom";
import { GraduationCap, Heart } from "lucide-react";

// ── Avatar config (overlapping stack) ─────────────────────────────────────────
const AVATARS = [
  { initials: "AJ", bg: "#e8643a" },
  { initials: "RS", bg: "#5a9e8a" },
  { initials: "PM", bg: "#8a7a6a" },
  { initials: "KJ", bg: "#b8a070" },
];

// ── Decorative app-feed mockup ────────────────────────────────────────────────
// Purely visual — no real data, no API calls, hidden below sm.
const AppPreviewMockup = () => (
  <div
    className="max-w-sm mx-auto mt-10 hidden sm:block"
    style={{
      backgroundColor: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderRadius: "1rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      padding: "1rem",
    }}
  >
    {/* Mini top bar — Lynqo wordmark */}
    <div
      className="flex items-center gap-2 pb-3 mb-3"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <span
        style={{
          fontWeight: 900,
          letterSpacing: "-0.03em",
          fontSize: "0.875rem",
          color: "var(--text-primary)",
        }}
      >
        Lynq<span style={{ color: "#e8643a" }}>o</span>
      </span>
    </div>

    {/* ── Fake post 1 — RS, accent border-left ───────────────────────────── */}
    <div
      className="mb-3 p-3 rounded-xl"
      style={{
        backgroundColor: "var(--bg-primary)",
        border: "1px solid var(--border)",
        borderLeft: "2px solid #e8643a",
      }}
    >
      {/* Author row */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
          style={{ backgroundColor: "#e8643a" }}
        >
          RS
        </div>
        <div>
          <p
            className="text-xs font-semibold leading-none"
            style={{ color: "var(--text-primary)" }}
          >
            Rahul Sharma
          </p>
          <p
            className="text-[10px] leading-none mt-0.5"
            style={{ color: "var(--text-muted)" }}
          >
            CS · Sem 5
          </p>
        </div>
      </div>
      {/* Content */}
      <p
        className="text-xs leading-relaxed mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        Anyone else feel like DSA lab is getting impossible? Took me 4 hours on
        one problem 💀
      </p>
      {/* Liked — accent heart */}
      <div className="flex items-center gap-1">
        <Heart size={12} fill="#e8643a" style={{ color: "#e8643a" }} />
        <span className="text-[10px]" style={{ color: "#e8643a" }}>24</span>
      </div>
    </div>

    {/* ── Fake post 2 — PM, sage green avatar ────────────────────────────── */}
    <div
      className="p-3 rounded-xl"
      style={{
        backgroundColor: "var(--bg-primary)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Author row */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
          style={{ backgroundColor: "#5a9e8a" }}
        >
          PM
        </div>
        <div>
          <p
            className="text-xs font-semibold leading-none"
            style={{ color: "var(--text-primary)" }}
          >
            Priya Mehta
          </p>
          <p
            className="text-[10px] leading-none mt-0.5"
            style={{ color: "var(--text-muted)" }}
          >
            IT · Sem 7
          </p>
        </div>
      </div>
      {/* Content */}
      <p
        className="text-xs leading-relaxed mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        Our team placed 2nd at the hackathon! So proud of everyone who stayed up
        all night 🥈
      </p>
      {/* Unliked — muted heart */}
      <div className="flex items-center gap-1">
        <Heart size={12} style={{ color: "var(--text-muted)" }} />
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>61</span>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const HeroSection = () => (
  <section
    id="hero"
    className="pt-20 pb-16 px-4"
    style={{ backgroundColor: "var(--bg-primary)" }}
  >
    <div className="text-center max-w-xl mx-auto">

      {/* ── Badge ──────────────────────────────────────────────────────────── */}
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
        style={{
          backgroundColor: "var(--accent-light)",
          border: "0.5px solid var(--accent-border)",
          color: "#9a3412",
        }}
      >
        <GraduationCap size={13} />
        Only for college students
      </div>

      {/* ── Main headline ───────────────────────────────────────────────────── */}
      <h1
        className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] mb-4"
        style={{ color: "var(--text-primary)", letterSpacing: "-0.04em" }}
      >
        Everything happening on campus —
        <br />
        <span style={{ color: "#e8643a" }}>right here.</span>
      </h1>

      {/* ── Subheadline ─────────────────────────────────────────────────────── */}
      <p
        className="text-base md:text-lg leading-relaxed max-w-sm mx-auto mb-8"
        style={{ color: "var(--text-secondary)" }}
      >
        The private space our campus was missing. Post, chat, confess, and belong.
      </p>

      {/* ── Primary CTA ─────────────────────────────────────────────────────── */}
      <Link
        to="/signup"
        id="hero-cta-signup"
        className="
          inline-flex items-center justify-center
          text-sm font-bold text-white
          px-8 py-3.5 rounded-xl
          transition-all duration-150 active:scale-95
          w-full sm:w-auto
          focus:outline-none
        "
        style={{ backgroundColor: "#e8643a" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#d4572f")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#e8643a")}
      >
        Join Lynqo — it's free
      </Link>

      {/* ── Avatar row ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {/* Overlapping avatars */}
        <div className="flex items-center">
          {AVATARS.map(({ initials, bg }, i) => (
            <div
              key={initials}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{
                backgroundColor: bg,
                border: "2px solid var(--bg-primary)",
                marginLeft: i > 0 ? "-0.5rem" : "0",
                position: "relative",
                zIndex: AVATARS.length - i,
              }}
            >
              {initials}
            </div>
          ))}
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Students already on Lynqo
        </p>
      </div>

      {/* ── App preview mockup ──────────────────────────────────────────────── */}
      <AppPreviewMockup />

    </div>
  </section>
);

export default HeroSection;
