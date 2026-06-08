/**
 * FeaturesSection.jsx — Features Grid (Section 3)
 *
 * Background:  var(--bg-surface), border-y border-[var(--border)]
 * Padding:     py-16 px-4
 * Container:   max-w-5xl mx-auto
 * Grid:        1 col (mobile) → 2 col (sm) → 4 col (lg)
 *
 * Cards hover: accent border + shadow-sm
 */

import { LayoutGrid, Ghost, MessageCircle, Users } from "lucide-react";

// ── Card data ─────────────────────────────────────────────────────────────────
const CARDS = [
  {
    icon: LayoutGrid,
    title: "Campus Feed",
    description:
      "Posts, memes, announcements and updates from your entire college in one real-time feed.",
  },
  {
    icon: Ghost,
    title: "Anonymous",
    description:
      "Say what you really think. Confessions, opinions, campus secrets — all completely anonymous.",
  },
  {
    icon: MessageCircle,
    title: "Direct Chat",
    description:
      "Real-time one-on-one messaging with any student. No phone number needed.",
  },
  {
    icon: Users,
    title: "Student Profiles",
    description:
      "Find students by branch and semester. Skills, hobbies, and looking for tags.",
  },
];

// ── Single feature card ───────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, description }) => (
  <div
    className="rounded-2xl p-5 transition-all duration-200 cursor-default"
    style={{
      backgroundColor: "var(--bg-primary)",
      border: "1px solid var(--border)",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = "#e8643a";
      e.currentTarget.style.boxShadow = "0 1px 4px rgba(232,100,58,0.08)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = "var(--border)";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    {/* Icon container */}
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
      style={{ backgroundColor: "var(--accent-light)" }}
    >
      <Icon size={20} strokeWidth={2} style={{ color: "#e8643a" }} />
    </div>

    {/* Title */}
    <h3
      className="text-sm font-bold mb-2"
      style={{ color: "var(--text-primary)" }}
    >
      {title}
    </h3>

    {/* Description */}
    <p
      className="text-xs leading-relaxed"
      style={{ color: "var(--text-secondary)" }}
    >
      {description}
    </p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const FeaturesSection = () => (
  <section
    id="features"
    className="py-16 px-4"
    style={{
      backgroundColor: "var(--bg-surface)",
      borderTop:    "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
    }}
  >
    <div className="max-w-5xl mx-auto">

      {/* ── Section label (pill badge) ────────────────────────────────────── */}
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
        style={{
          backgroundColor: "var(--accent-light)",
          border: "0.5px solid var(--accent-border)",
          color: "#9a3412",
        }}
      >
        <LayoutGrid size={13} />
        Features
      </div>

      {/* ── Section title ─────────────────────────────────────────────────── */}
      <h2
        className="text-3xl md:text-4xl font-black mt-3 mb-2"
        style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
      >
        One platform. Endless connections.
      </h2>

      {/* ── Section subtitle ──────────────────────────────────────────────── */}
      <p
        className="text-sm leading-relaxed mb-10 max-w-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        Everything your campus needs in one place — no more scattered WhatsApp groups.
      </p>

      {/* ── Cards grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map(card => (
          <FeatureCard key={card.title} {...card} />
        ))}
      </div>

    </div>
  </section>
);

export default FeaturesSection;
