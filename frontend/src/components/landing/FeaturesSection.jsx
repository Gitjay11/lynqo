/**
 * FeaturesSection.jsx — What Lynqo Offers (Theme-Aware)
 *
 * Background: bg-bg-surface
 * Cards: bg-bg-elevated border-app-border
 */

import { MessageSquare, MessageCircle, Users } from "lucide-react";

// ── Card data ─────────────────────────────────────────────────────────────────
const CARDS = [
  {
    icon: MessageSquare,
    title: "Campus Feed",
    description:
      "Post updates, ask questions, share memes, and stay connected with your entire college in a real-time feed.",
    accentIcon: false,
  },
  {
    icon: MessageCircle,
    title: "Direct Messaging",
    description:
      "Chat one-on-one with any student. Real-time messages, online status, and typing indicators.",
    accentIcon: false,
  },
  {
    icon: Users,
    title: "Student Profiles",
    description:
      "Find students by branch and semester. Build your campus identity and network before placements.",
    accentIcon: true,
  },
];

// ── Single feature card ───────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, description, accentIcon }) => (
  <div
    className="
      rounded-2xl
      shadow-sm
      transition-all duration-200
      p-6
    "
    style={{
      backgroundColor: "var(--bg-elevated)",
      border: "1px solid var(--border)",
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--text-muted)"}
    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
  >
    {/* Icon block */}
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center"
      style={
        accentIcon
          ? { backgroundColor: "var(--accent-light)", color: "var(--accent)" }
          : { backgroundColor: "var(--bg-surface)", color: "var(--text-secondary)" }
      }
    >
      <Icon size={22} strokeWidth={2} />
    </div>

    {/* Title */}
    <h3 className="text-xl font-semibold mt-4" style={{ color: "var(--text-primary)" }}>{title}</h3>

    {/* Description */}
    <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{description}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const FeaturesSection = () => {
  return (
    <section
      id="features"
      className="py-20 px-4"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="max-w-5xl mx-auto">

        {/* ── Section header ─────────────────────────────────────────────────── */}
        <div className="text-center">
          <h2
            className="text-3xl md:text-4xl font-bold text-center"
            style={{ color: "var(--text-primary)" }}
          >
            Everything happening on campus — right here.
          </h2>
          <p className="text-lg mt-3 text-center" style={{ color: "var(--text-secondary)" }}>
            The private space our campus was missing.
          </p>
        </div>

        {/* ── Cards grid ────────────────────────────────────────────────────── */}
        <div className="
          grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
          gap-6 mt-12
        ">
          {CARDS.map((card) => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;
