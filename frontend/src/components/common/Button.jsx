/**
 * Button.jsx — Unified Button Component
 *
 * The single button primitive used everywhere in the app.
 * Do NOT use raw <button> elements elsewhere — always use this.
 *
 * Props:
 *  variant       — 'primary' | 'secondary' | 'ghost' | 'accent-light' | 'destructive'
 *  size          — 'xs' | 'sm' | 'md' | 'lg' | 'full'
 *  loading       — boolean — shows spinner, disables interaction, cursor-wait
 *  disabled      — boolean
 *  icon          — ReactNode — lucide-react icon element
 *  iconPosition  — 'left' (default) | 'right'
 *  fullWidth     — boolean — w-full + justify-center
 *  onClick       — function
 *  type          — 'button' (default) | 'submit' | 'reset'
 *  children      — ReactNode
 *  className     — string — additional classes (use sparingly)
 */

// ── Variant class map ──────────────────────────────────────────────────────────
const VARIANTS = {
  primary:
    "bg-[var(--accent)] text-white font-bold " +
    "hover:bg-[#d4572f] active:scale-95 " +
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 " +
    "transition-all duration-150",

  secondary:
    "bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold " +
    "border border-[var(--border)] " +
    "hover:bg-[var(--bg-elevated)] hover:border-[var(--accent)] " +
    "active:scale-95 transition-all duration-150",

  ghost:
    "bg-transparent text-[var(--text-secondary)] font-semibold " +
    "hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] " +
    "active:scale-95 transition-all duration-150",

  "accent-light":
    "bg-[var(--accent-light)] text-[#9a3412] font-bold " +
    "border border-[var(--accent-border)] " +
    "hover:opacity-90 active:scale-95 " +
    "transition-all duration-150",

  destructive:
    "bg-transparent text-red-500 font-semibold " +
    "hover:bg-red-50 dark:hover:bg-red-950/30 " +
    "active:scale-95 transition-all duration-150",
};

// ── Size class map ─────────────────────────────────────────────────────────────
const SIZES = {
  xs:   "text-xs px-3 py-1.5 rounded-lg gap-1",
  sm:   "text-xs px-4 py-2 rounded-xl gap-1.5",
  md:   "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg:   "text-sm px-6 py-3 rounded-xl gap-2",
  full: "text-sm px-4 py-3 rounded-xl gap-2 w-full justify-center",
};

// ── Icon size per button size ──────────────────────────────────────────────────
const ICON_SIZE = {
  xs: 12,
  sm: 16,
  md: 16,
  lg: 20,
  full: 16,
};

// ─────────────────────────────────────────────────────────────────────────────
const Button = ({
  variant = "primary",
  size    = "md",
  loading    = false,
  disabled   = false,
  icon,
  iconPosition = "left",
  fullWidth  = false,
  onClick,
  type    = "button",
  children,
  className = "",
  ...rest
}) => {
  const isDisabled = disabled || loading;
  const iconSz     = ICON_SIZE[size] ?? 16;

  // Spinner element — same size as icon
  const Spinner = () => (
    <span
      aria-hidden="true"
      style={{ width: iconSz, height: iconSz }}
      className="rounded-full border-2 border-current border-t-transparent animate-spin flex-shrink-0"
    />
  );

  // Resolve icon node — clone with correct size if it's a valid React element
  const IconNode = icon && !loading
    ? <span aria-hidden="true" className="flex-shrink-0" style={{ width: iconSz, height: iconSz, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
    : null;

  const variantClass = VARIANTS[variant] ?? VARIANTS.primary;
  const sizeClass    = SIZES[size]       ?? SIZES.md;
  const widthClass   = (fullWidth && size !== "full") ? "w-full justify-center" : "";

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`
        inline-flex items-center font-sans select-none
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1
        ${variantClass}
        ${sizeClass}
        ${widthClass}
        ${loading ? "cursor-wait" : ""}
        ${className}
      `.trim().replace(/\s+/g, " ")}
      {...rest}
    >
      {/* Left icon or spinner */}
      {loading && <Spinner />}
      {!loading && iconPosition === "left" && IconNode}

      {/* Label */}
      {children && <span className="leading-none">{children}</span>}

      {/* Right icon */}
      {!loading && iconPosition === "right" && IconNode}
    </button>
  );
};

export default Button;
