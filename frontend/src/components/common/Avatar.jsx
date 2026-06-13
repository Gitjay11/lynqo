/**
 * Avatar.jsx — User Avatar Component (Upgraded)
 *
 * Renders a user's profile picture, or an accent-colored initials fallback.
 * Supports online indicator dot and image error → initials fallback.
 *
 * Sizes:
 *   xs   → 24px  (chat message bubbles, comment rows)
 *   sm   → 32px  (nav, post headers, follow lists)
 *   md   → 40px  (chat list rows)
 *   lg   → 56px  (chat window empty state)
 *   xl   → 72px  (profile page header)
 *   2xl  → 128px (profile hero / large display)
 *
 * Props:
 *  src       — string  — image URL
 *  name      — string  — user name (for initials fallback + aria-label)
 *  size      — string  — 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 *  onClick   — function — makes avatar clickable with hover ring
 *  online    — boolean — shows green online indicator dot
 *  className — string  — extra classes on the wrapper
 */

import { useState, useMemo } from "react";

// ── Size map ──────────────────────────────────────────────────────────────────
const SIZE_MAP = {
  xs:    { wrapper: "w-6 h-6",         text: "text-[8px]"  },
  sm:    { wrapper: "w-8 h-8",         text: "text-xs"     },
  md:    { wrapper: "w-10 h-10",       text: "text-sm"     },
  lg:    { wrapper: "w-14 h-14",       text: "text-base"   },
  xl:    { wrapper: "w-[72px] h-[72px]", text: "text-xl"   },
  "2xl": { wrapper: "w-32 h-32",       text: "text-4xl"    },
};

// ── Online dot size map ────────────────────────────────────────────────────────
const DOT_SIZE = {
  xs:    "w-1.5 h-1.5",
  sm:    "w-2.5 h-2.5",
  md:    "w-2.5 h-2.5",
  lg:    "w-3 h-3",
  xl:    "w-3.5 h-3.5",
  "2xl": "w-4 h-4",
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
  name      = "",
  size      = "md",
  onClick,
  online    = false,
  className = "",
}) => {
  const [imgError, setImgError] = useState(false);
  const { wrapper, text } = SIZE_MAP[size] ?? SIZE_MAP.md;
  const initials            = useMemo(() => getInitials(name), [name]);

  // Clickable hover ring — only when onClick is provided
  const interactiveClasses = onClick
    ? "cursor-pointer hover:ring-2 hover:ring-[var(--accent)] hover:ring-offset-2 hover:ring-offset-[var(--bg-surface)] hover:scale-105 transition-all duration-150"
    : "";

  // Shared base classes for the avatar circle
  const avatarClasses = `
    ${wrapper} rounded-full flex-shrink-0 select-none overflow-hidden
    ${interactiveClasses}
    ${className}
  `.trim().replace(/\s+/g, " ");

  // Render the avatar circle (image or initials)
  const AvatarCircle = () => {
    // Show image only if src exists AND no load error
    if (src && !imgError) {
      return (
        <div
          className={avatarClasses}
          aria-label={name ? `${name}'s avatar` : "User avatar"}
          role={onClick ? "button" : undefined}
          onClick={onClick}
        >
          <img
            src={src}
            alt={name ? `${name}'s avatar` : "User avatar"}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </div>
      );
    }

    // Initials fallback
    return (
      <div
        className={`${avatarClasses} flex items-center justify-center`}
        style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
        aria-label={name ? `${name}'s avatar` : "User avatar"}
        role={onClick ? "button" : undefined}
        onClick={onClick}
      >
        <span className={`${text} font-bold leading-none`}>{initials}</span>
      </div>
    );
  };

  // If online indicator is needed, wrap in relative container
  if (online) {
    const dotClass = DOT_SIZE[size] ?? DOT_SIZE.md;
    return (
      <div className="relative inline-flex flex-shrink-0">
        <AvatarCircle />
        {/* Green online dot */}
        <span
          className={`
            absolute bottom-0 right-0
            ${dotClass}
            rounded-full bg-green-500
            border-2 border-[var(--bg-surface)]
          `}
          aria-label="Online"
          title="Online"
        />
      </div>
    );
  }

  return <AvatarCircle />;
};

export default Avatar;
