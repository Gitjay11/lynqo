/**
 * AnonymousSection.jsx — The Viral Hook Section
 *
 * Background: bg-gray-900 (dark — strong contrast from the white FeaturesSection above)
 * Padding:    py-20 px-4
 *
 * Layout:
 *  - Mobile: single column, stacked (text first, visual second)
 *  - lg:     two-column grid  lg:grid-cols-2 lg:gap-16 lg:items-center
 *            max-w-6xl mx-auto
 *
 * Left — white text on dark bg with 3 Check checkpoints + white CTA
 * Right — mock anon feed: container + 2 fake post cards (pure HTML/CSS)
 *
 * Mobile-first. All touch targets ≥ 44px.
 */

import { Check } from "lucide-react";
import { Link } from "react-router-dom";

// ── Checkpoint bullet ─────────────────────────────────────────────────────────
const Checkpoint = ({ text }) => (
  <li className="flex items-center gap-3 text-white/80 text-sm">
    <Check
      size={20}
      strokeWidth={2.5}
      className="text-emerald-400 flex-shrink-0"
    />
    <span>{text}</span>
  </li>
);

// ── Mock anon post card ───────────────────────────────────────────────────────
const AnonCard = ({ content, likes, time }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
    {/* Top row: ghost emoji + "Anonymous" + timestamp */}
    <div className="flex items-center gap-2 text-white/60 text-xs">
      <span>👻</span>
      <span className="font-medium">Anonymous</span>
      <span>· {time}</span>
    </div>

    {/* Post content */}
    <p className="text-white/80 text-sm mt-2 leading-relaxed">{content}</p>

    {/* Bottom row: likes + flag */}
    <div className="flex items-center gap-4 mt-3 text-white/40 text-xs">
      <button className="flex items-center gap-1 hover:text-white/70 transition-colors min-h-0">
        <span>🤍</span>
        <span>{likes}</span>
      </button>
      <button className="flex items-center gap-1 hover:text-white/70 transition-colors min-h-0">
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
      className="bg-gray-900 py-20 px-4"
    >
      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

        {/* ── Left: Text content ────────────────────────────────────────────── */}
        <div>
          {/* Label pill */}
          <span className="
            inline-block
            bg-white/10 text-white/80 text-xs
            px-3 py-1.5 rounded-full
          ">
            👻 Anonymous Posting
          </span>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-4">
            Say it. Anonymously.
          </h2>

          {/* Description */}
          <p className="text-white/70 text-base mt-4 leading-relaxed">
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
              bg-white hover:bg-gray-100 active:bg-gray-200
              text-gray-900 font-semibold text-base
              rounded-full
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900
            "
          >
            Start Confessing →
          </Link>
        </div>

        {/* ── Right: Mock anon feed ─────────────────────────────────────────── */}
        <div className="
          bg-white/5 border border-white/10 rounded-2xl
          p-5 space-y-3
          mt-10 lg:mt-0
        ">
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
