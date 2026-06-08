/**
 * AnonymousSection.jsx — Anonymous Confessions (Section 4)
 *
 * Background: var(--text-primary) — intentionally always-dark regardless of theme.
 * All text values are hardcoded as rgba(245,240,232,…) because this section
 * is designed to look dark in both light and dark app modes.
 *
 * Layout:
 *   Mobile  → single column (text then cards)
 *   Desktop → lg:grid-cols-2, gap-16, items-center; left = text, right = cards
 */

import { Ghost, Check, Heart, ThumbsDown } from "lucide-react";
import { Link } from "react-router-dom";

// ── Checkpoint row ────────────────────────────────────────────────────────────
const Checkpoint = ({ text }) => (
  <div
    className="flex items-center gap-3 text-sm"
    style={{ color: "rgba(245,240,232,0.7)" }}
  >
    <Check
      size={16}
      strokeWidth={2.5}
      style={{ color: "#e8643a", flexShrink: 0 }}
    />
    {text}
  </div>
);

// ── Mock anon post card ───────────────────────────────────────────────────────
// Dark glass card — always rendered on this always-dark section background.
const AnonCard = ({ content, likes, time }) => (
  <div
    className="rounded-2xl p-4"
    style={{
      backgroundColor: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}
  >
    {/* Header row — ghost circle + "Anonymous" + timestamp */}
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
        style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
      >
        👻
      </div>
      <span
        className="text-xs"
        style={{ color: "rgba(245,240,232,0.5)" }}
      >
        Anonymous
      </span>
      <span
        className="text-xs ml-auto"
        style={{ color: "rgba(245,240,232,0.3)" }}
      >
        {time}
      </span>
    </div>

    {/* Post content */}
    <p
      className="text-sm leading-relaxed mt-2 mb-3"
      style={{ color: "rgba(245,240,232,0.8)" }}
    >
      {content}
    </p>

    {/* Action row: liked heart (accent) + thumbs-down (muted) */}
    <div className="flex items-center gap-4">
      <button className="flex items-center gap-1.5 min-h-0" aria-label="Like">
        <Heart size={14} fill="#e8643a" style={{ color: "#e8643a" }} />
        <span className="text-xs" style={{ color: "#e8643a" }}>{likes}</span>
      </button>
      <button className="flex items-center gap-1.5 min-h-0" aria-label="Dislike">
        <ThumbsDown size={14} style={{ color: "rgba(245,240,232,0.3)" }} />
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const AnonymousSection = () => (
  <section
    id="anonymous"
    className="py-16 px-4"
    style={{ backgroundColor: "var(--text-primary)" }}
  >
    <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

      {/* ── Left column — text ───────────────────────────────────────────── */}
      <div>

        {/* Badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            border: "0.5px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          <Ghost size={13} />
          Anonymous
        </div>

        {/* Headline */}
        <h2
          className="text-3xl md:text-4xl font-black mt-4 mb-3"
          style={{ color: "#f5f0e8", letterSpacing: "-0.03em" }}
        >
          Say it. Anonymously.
        </h2>

        {/* Description */}
        <p
          className="text-sm leading-relaxed mb-6 max-w-sm"
          style={{ color: "rgba(245,240,232,0.6)" }}
        >
          The things you want to say but can't. Say them here. Your identity
          stays completely hidden.
        </p>

        {/* Checkpoints */}
        <div className="space-y-3 mb-8">
          <Checkpoint text="Your identity is always hidden" />
          <Checkpoint text="Community moderation keeps it safe" />
          <Checkpoint text="Like and engage — all anonymously" />
        </div>

        {/* CTA */}
        <Link
          to="/signup"
          id="anon-cta-signup"
          className="
            inline-flex items-center justify-center
            text-sm font-bold text-white
            px-6 py-3 rounded-xl
            transition-all duration-150 active:scale-95
            focus:outline-none
          "
          style={{ backgroundColor: "#e8643a" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#d4572f")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#e8643a")}
        >
          Start Confessing →
        </Link>

      </div>

      {/* ── Right column — mock anon posts ───────────────────────────────── */}
      <div className="space-y-3 mt-10 lg:mt-0">
        <AnonCard
          content='"The canteen food gets worse every week and nobody says anything 💀"'
          likes="47"
          time="2h ago"
        />
        <AnonCard
          content='"Finals week and the WiFi is down again. Every. Single. Semester."'
          likes="89"
          time="45m ago"
        />
      </div>

    </div>
  </section>
);

export default AnonymousSection;
