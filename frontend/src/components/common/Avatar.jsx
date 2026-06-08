/**
 * Avatar.jsx — User Avatar Component (Dark Theme)
 *
 * Renders a user's profile picture, or a generated initials-based fallback.
 *
 * Sizes:
 *   xs   → 24px  (chat message bubbles)
 *   sm   → 32px  (nav, post headers)
 *   md   → 40px  (chat list rows)
 *   lg   → 56px  (chat window empty state)
 *   xl   → 80px  (profile page)
 *   2xl  → 128px (profile hero)
 *
 * Fallback palette: 8 zinc tones — deterministic from name.
 */

import { useMemo } from "react";

// ── Size map ──────────────────────────────────────────────────────────────────
const SIZE_MAP = {
  xs:  { wrapper: "w-6 h-6",   text: "text-[9px]"  },
  sm:  { wrapper: "w-8 h-8",   text: "text-[11px]" },
  md:  { wrapper: "w-10 h-10", text: "text-sm"     },
  lg:  { wrapper: "w-14 h-14", text: "text-xl"     },
  xl:  { wrapper: "w-20 h-20", text: "text-2xl"    },
  "2xl": { wrapper: "w-32 h-32", text: "text-4xl"  },
};

// ── Themed fallback — uses accent-light bg + accent text ─────────────────────
// A single deterministic mapping: all avatars use the accent palette with
// slight saturation variation based on name hash for visual differentiation.
const FALLBACK_COLORS = [
  "bg-bg-elevated text-text-primary",
  "bg-accent-light text-app-accent",
  "bg-bg-elevated text-text-secondary",
  "bg-accent-light text-app-accent",
  "bg-bg-elevated text-text-primary",
  "bg-accent-light text-app-accent",
  "bg-bg-elevated text-text-secondary",
  "bg-accent-light text-app-accent",
];

// ── Deterministic color from name string ──────────────────────────────────────
const colorFromName = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
};

// ── Extract up to 2 initials ──────────────────────────────────────────────────
const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─────────────────────────────────────────────────────────────────────────────
const Avatar = ({
  src,
  name = "",
  size = "md",
  onClick,
  className = "",
}) => {
  const { wrapper, text } = SIZE_MAP[size] ?? SIZE_MAP.md;
  const initials           = useMemo(() => getInitials(name), [name]);
  const colorClass         = useMemo(() => colorFromName(name), [name]);

  const base = `
    ${wrapper} rounded-full flex-shrink-0 select-none overflow-hidden
    ${onClick ? "cursor-pointer" : ""}
    ${className}
  `;

  // ── Image avatar ─────────────────────────────────────────────────────────
  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s avatar` : "User avatar"}
        className={`${base} object-cover`}
        loading="lazy"
        onClick={onClick}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    );
  }

  // ── Initials fallback ─────────────────────────────────────────────────────
  return (
    <div
      className={`${base} flex items-center justify-center ${colorClass}`}
      aria-label={name ? `${name}'s avatar` : "User avatar"}
      role={onClick ? "button" : undefined}
      onClick={onClick}
    >
      <span className={`${text} font-bold leading-none`}>{initials}</span>
    </div>
  );
};

export default Avatar;
