/**
 * Avatar.jsx — User Avatar Component (Redesigned)
 *
 * Renders a user's profile picture, or an accent-colored initials fallback.
 *
 * Sizes:
 *   xs   → 24px  (chat message bubbles, comment rows)
 *   sm   → 32px  (nav, post headers, follow lists)
 *   md   → 40px  (chat list rows)
 *   lg   → 56px  (chat window empty state)
 *   xl   → 72px  (profile page header)
 *   2xl  → 128px (profile hero / large display)
 *
 * Initials fallback: always accent bg (#e8643a) + white text — consistent brand color.
 * Hover ring: only rendered when `onClick` prop is provided.
 */

import { useMemo } from "react";

// ── Size map ──────────────────────────────────────────────────────────────────
const SIZE_MAP = {
  xs:    { wrapper: "w-6 h-6",       text: "text-[9px]"  },
  sm:    { wrapper: "w-8 h-8",       text: "text-[11px]" },
  md:    { wrapper: "w-10 h-10",     text: "text-sm"     },
  lg:    { wrapper: "w-14 h-14",     text: "text-xl"     },
  xl:    { wrapper: "w-[72px] h-[72px]", text: "text-2xl" },
  "2xl": { wrapper: "w-32 h-32",     text: "text-4xl"    },
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

  // Hover ring classes — only applied when onClick is provided
  const interactiveClasses = onClick
    ? "cursor-pointer hover:ring-2 hover:ring-[#e8643a] hover:ring-offset-2 transition-all duration-150"
    : "";

  const base = `
    ${wrapper} rounded-full flex-shrink-0 select-none overflow-hidden
    ${interactiveClasses}
    ${className}
  `;

  // ── Image avatar — wrapped in a sized div so overflow-hidden clips correctly ──
  if (src) {
    return (
      <div
        className={`${base} overflow-hidden`}
        aria-label={name ? `${name}'s avatar` : "User avatar"}
        role={onClick ? "button" : undefined}
        onClick={onClick}
      >
        <img
          src={src}
          alt={name ? `${name}'s avatar` : "User avatar"}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      </div>
    );
  }

  // ── Initials fallback — always accent bg + white text ─────────────────────
  return (
    <div
      className={`${base} flex items-center justify-center`}
      style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
      aria-label={name ? `${name}'s avatar` : "User avatar"}
      role={onClick ? "button" : undefined}
      onClick={onClick}
    >
      <span className={`${text} font-bold leading-none`}>{initials}</span>
    </div>
  );
};

export default Avatar;
