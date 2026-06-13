/**
 * Badge.jsx — Pill / Tag / Status Label Component
 *
 * Used for categories, status labels, "Hot" indicators, counts.
 *
 * Props:
 *  variant  — 'accent' (default) | 'outline' | 'solid' | 'success' | 'destructive'
 *  size     — 'sm' | 'md' (default) | 'lg'
 *  icon     — ReactNode — optional lucide-react icon (rendered at 10px)
 *  children — ReactNode
 */

// ── Variant class map ──────────────────────────────────────────────────────────
const VARIANTS = {
  accent:
    "bg-[var(--accent-light)] border border-[var(--accent-border)] text-[#9a3412] font-bold",

  outline:
    "bg-transparent border border-[var(--border)] text-[var(--text-secondary)] font-semibold",

  solid:
    "bg-[var(--accent)] text-white font-bold",

  success:
    "bg-green-50 border border-green-200 text-green-700 font-semibold " +
    "dark:bg-green-950/30 dark:border-green-800 dark:text-green-400",

  destructive:
    "bg-red-50 border border-red-200 text-red-600 font-semibold " +
    "dark:bg-red-950/30 dark:border-red-800 dark:text-red-400",
};

// ── Size class map ─────────────────────────────────────────────────────────────
const SIZES = {
  sm: "text-[9px] px-2 py-0.5 rounded-full gap-1",
  md: "text-xs px-2.5 py-1 rounded-full gap-1.5",
  lg: "text-xs px-3 py-1.5 rounded-full gap-2",
};

// ─────────────────────────────────────────────────────────────────────────────
const Badge = ({
  variant  = "accent",
  size     = "md",
  icon,
  children,
  className = "",
}) => {
  const variantClass = VARIANTS[variant] ?? VARIANTS.accent;
  const sizeClass    = SIZES[size]       ?? SIZES.md;

  return (
    <span
      className={`
        inline-flex items-center font-sans select-none
        ${variantClass}
        ${sizeClass}
        ${className}
      `.trim().replace(/\s+/g, " ")}
    >
      {icon && (
        <span aria-hidden="true" className="flex-shrink-0" style={{ width: 10, height: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </span>
      )}
      {children}
    </span>
  );
};

export default Badge;
