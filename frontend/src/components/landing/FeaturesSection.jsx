/**
 * FeaturesSection.jsx — What Lynqo Offers
 *
 * Background: white, py-20 px-4
 *
 * Layout:
 *  - Centered section header: h2 + subtitle
 *  - 3-card grid:
 *      mobile  → 1 col
 *      md:     → 2 col
 *      lg:     → 3 col
 *    gap-6, mt-12, max-w-5xl mx-auto
 *
 * Cards (exact spec):
 *  1. Campus Feed       — MessageSquare, indigo,   bg-indigo-100
 *  2. Direct Messaging  — MessageCircle, violet,   bg-violet-100
 *  3. Student Profiles  — Users,         emerald,  bg-emerald-100
 *
 * Card style: white bg, rounded-2xl, border-gray-100, shadow-sm, p-6
 *             hover:shadow-md, transition-shadow duration-200
 */

import { MessageSquare, MessageCircle, Users } from "lucide-react";

// ── Card data ─────────────────────────────────────────────────────────────────
const CARDS = [
  {
    icon: MessageSquare,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-100",
    title: "Campus Feed",
    description:
      "Post updates, ask questions, share memes, and stay connected with your entire college in a real-time feed.",
  },
  {
    icon: MessageCircle,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100",
    title: "Direct Messaging",
    description:
      "Chat one-on-one with any student. Real-time messages, online status, and typing indicators.",
  },
  {
    icon: Users,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
    title: "Student Profiles",
    description:
      "Find students by branch and semester. Build your campus identity and network before placements.",
  },
];

// ── Single feature card ───────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, iconColor, iconBg, title, description }) => (
  <div
    className="
      bg-white rounded-2xl border border-gray-100
      shadow-sm hover:shadow-md
      transition-shadow duration-200
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
    <h3 className="text-xl font-semibold text-gray-900 mt-4">{title}</h3>

    {/* Description */}
    <p className="text-gray-500 text-sm mt-2 leading-relaxed">{description}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const FeaturesSection = () => {
  return (
    <section
      id="features"
      className="bg-white py-20 px-4"
    >
      <div className="max-w-5xl mx-auto">

        {/* ── Section header ─────────────────────────────────────────────────── */}
        <div className="text-center">
          <h2 className="
            text-3xl md:text-4xl font-bold text-gray-900 text-center
          ">
            Everything happening on campus — right here.
          </h2>
          <p className="text-gray-500 text-lg mt-3 text-center">
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
