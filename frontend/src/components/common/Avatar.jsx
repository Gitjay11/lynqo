/**
 * Avatar.jsx — User Avatar Component
 *
 * Displays a user's profile photo, or a generated initial-letter fallback
 * when no photo URL is available. Used in Navbar, Sidebar, posts, comments,
 * and the ProfilePage upload trigger.
 *
 * Props:
 *  src       {string}   — Cloudinary (or any) image URL. Optional.
 *  name      {string}   — User's display name. Used for alt text + fallback initials.
 *  size      {string}   — 'xs' | 'sm' | 'md' | 'lg' | 'xl'  (default: 'md')
 *  className {string}   — Additional Tailwind classes passed by the parent.
 *  onClick   {function} — Optional click handler (used by ProfilePage upload trigger).
 *  style     {object}   — Optional inline styles for the root element.
 *
 * Size map (diameter):
 *  xs  →  24px   (inline / comment thread)
 *  sm  →  32px   (post header)
 *  md  →  40px   (navbar / most UI)
 *  lg  →  80px   (profile header — large card context)
 *  xl  →  128px  (full profile page hero)
 */

const SIZE_MAP = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-20 h-20 text-xl",    // 80px — corrected from w-14 h-14
  xl: "w-32 h-32 text-4xl",   // 128px — corrected from w-20 h-20
};

// Generate a deterministic background color from the user's name
// so different users always get a different (but consistent) hue.
const PALETTE = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-teal-500",
];

const getColorClass = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

// Extract up to two initials from a display name ("Jay Singh" → "JS")
const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
};

// ─────────────────────────────────────────────────────────────────────────────
const Avatar = ({ src, name = "", size = "md", className = "", onClick, style }) => {
  const sizeClass  = SIZE_MAP[size] ?? SIZE_MAP.md;
  const colorClass = getColorClass(name);
  const initials   = getInitials(name);

  // Add cursor-pointer automatically when a click handler is provided
  // (e.g. when used as the avatar upload trigger on ProfilePage)
  const clickable = onClick ? "cursor-pointer" : "";
  const base = `rounded-full object-cover flex-shrink-0 select-none ${sizeClass} ${clickable} ${className}`;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={style}
        className={`${base} bg-gray-100`}
        onClick={onClick}
        onError={(e) => {
          // Hide broken image; the parent should handle fallback via state
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  // ── Fallback: colored circle with initials ────────────────────────────────
  return (
    <div
      aria-label={name}
      style={style}
      onClick={onClick}
      className={`
        ${base} ${colorClass}
        flex items-center justify-center
        text-white font-semibold tracking-wide
      `}
    >
      {initials}
    </div>
  );
};

export default Avatar;
