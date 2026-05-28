/**
 * FeaturesSection.jsx — What Lynqo Offers (Dark Theme)
 *
 * Background: bg-zinc-950
 * Cards: bg-zinc-900 border-zinc-800
 */

import { MessageSquare, MessageCircle, Users } from "lucide-react";

// ── Card data ─────────────────────────────────────────────────────────────────
const CARDS = [
  {
    icon: MessageSquare,
    iconColor: "text-zinc-300",
    iconBg: "bg-zinc-800",
    title: "Campus Feed",
    description:
      "Post updates, ask questions, share memes, and stay connected with your entire college in a real-time feed.",
  },
  {
    icon: MessageCircle,
    iconColor: "text-zinc-300",
    iconBg: "bg-zinc-800",
    title: "Direct Messaging",
    description:
      "Chat one-on-one with any student. Real-time messages, online status, and typing indicators.",
  },
  {
    icon: Users,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    title: "Student Profiles",
    description:
      "Find students by branch and semester. Build your campus identity and network before placements.",
  },
];

// ── Single feature card ───────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, iconColor, iconBg, title, description }) => (
  <div
    className="
      bg-zinc-900 rounded-2xl border border-zinc-800
      shadow-sm hover:border-zinc-700
      transition-all duration-200
      p-6
    "
  >
    {/* Icon block */}
    <div
      className={`
        w-12 h-12 ${iconBg} rounded-xl
        flex items-center justify-center
      `}
    >
      <Icon size={22} className={iconColor} strokeWidth={2} />
    </div>

    {/* Title */}
    <h3 className="text-xl font-semibold text-zinc-50 mt-4">{title}</h3>

    {/* Description */}
    <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{description}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const FeaturesSection = () => {
  return (
    <section
      id="features"
      className="bg-zinc-950 py-20 px-4 border-t border-zinc-900"
    >
      <div className="max-w-5xl mx-auto">

        {/* ── Section header ─────────────────────────────────────────────────── */}
        <div className="text-center">
          <h2 className="
            text-3xl md:text-4xl font-bold text-zinc-50 text-center
          ">
            Everything happening on campus — right here.
          </h2>
          <p className="text-zinc-400 text-lg mt-3 text-center">
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
