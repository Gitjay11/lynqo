/**
 * AnonymousSection.jsx — The Viral Hook Section (Theme-Aware)
 *
 * Background: bg-bg-primary border-t border-app-border
 * Cards: bg-bg-surface border-app-border
 */

import { Check } from "lucide-react";
import { Link } from "react-router-dom";

// ── Checkpoint bullet ─────────────────────────────────────────────────────────
const Checkpoint = ({ text }) => (
  <li className="flex items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
    <Check
      size={20}
      strokeWidth={2.5}
      style={{ color: "var(--success)" }}
      className="flex-shrink-0"
    />
    <span>{text}</span>
  </li>
);

// ── Mock anon post card ───────────────────────────────────────────────────────
const AnonCard = ({ content, likes, time }) => (
  <div
    className="rounded-xl p-4"
    style={{
      backgroundColor: "var(--bg-elevated)",
      border: "1px solid var(--border)",
    }}
  >
    {/* Top row: ghost emoji + "Anonymous" + timestamp */}
    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
      <span>👻</span>
      <span className="font-medium" style={{ color: "var(--text-secondary)" }}>Anonymous</span>
      <span>· {time}</span>
    </div>

    {/* Post content */}
    <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-primary)" }}>{content}</p>

    {/* Bottom row: likes + flag */}
    <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
      <button
        className="flex items-center gap-1 transition-colors min-h-0"
        onMouseEnter={e => e.currentTarget.style.color = "var(--text-secondary)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
      >
        <span>🤍</span>
        <span>{likes}</span>
      </button>
      <button
        className="flex items-center gap-1 transition-colors min-h-0"
        onMouseEnter={e => e.currentTarget.style.color = "var(--text-secondary)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
      >
        <span>🚩</span>
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const AnonymousSection = () => {
  return (
    <section
      id="anonymous"
      className="py-20 px-4"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

        {/* ── Left: Text content ────────────────────────────────────────────── */}
        <div>
          {/* Label pill */}
          <span
            className="
              inline-block
              text-xs
              px-3 py-1.5 rounded-full
            "
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            👻 Anonymous Posting
          </span>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl font-bold mt-4" style={{ color: "var(--text-primary)" }}>
            Say it. Anonymously.
          </h2>

          {/* Description */}
          <p className="text-base mt-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            The things you want to say but can't. Say them here. Your identity
            stays completely hidden.
          </p>

          {/* Checkpoints */}
          <ul className="mt-6 space-y-3">
            <Checkpoint text="Your identity is always hidden" />
            <Checkpoint text="Community moderation keeps it safe" />
            <Checkpoint text="Like and engage — all anonymously" />
          </ul>

          {/* CTA */}
          <Link
            to="/signup"
            id="anon-cta-signup"
            className="
              inline-flex items-center justify-center
              min-h-[48px] px-6 py-3 mt-8
              text-white font-semibold text-base
              rounded-full
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2
            "
            style={{ backgroundColor: "var(--accent)" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--accent-hover)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "var(--accent)"}
          >
            Start Confessing →
          </Link>
        </div>

        {/* ── Right: Mock anon feed ─────────────────────────────────────────── */}
        <div
          className="
            rounded-2xl
            p-5 space-y-3
            mt-10 lg:mt-0
          "
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <AnonCard
            content="The canteen food has been getting worse every week. Someone needs to say it 💀"
            likes="24"
            time="2h ago"
          />
          <AnonCard
            content="Finals week and the WiFi is down again. Classic."
            likes="61"
            time="45m ago"
          />
        </div>

      </div>
    </section>
  );
};

export default AnonymousSection;
