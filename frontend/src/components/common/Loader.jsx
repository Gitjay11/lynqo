/**
 * Loader.jsx — Flexible Loading Spinner (Themed)
 *
 * Used across the app for full-screen loading gates and inline loading states.
 *
 * Props:
 *  size       — 'sm' | 'md' (default) | 'lg'
 *  fullScreen — boolean — fixed inset-0 overlay (default false)
 *  text       — string  — label below spinner (default "Loading...")
 */

// ── Size map ───────────────────────────────────────────────────────────────────
const SIZE_MAP = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-[3px]",
};

// ─────────────────────────────────────────────────────────────────────────────
const Loader = ({ size = "md", fullScreen = false, text = "Loading..." }) => {
  const spinnerClass = SIZE_MAP[size] ?? SIZE_MAP.md;

  const spinner = (
    <>
      {/* Spinner ring */}
      <span
        className={`
          ${spinnerClass}
          rounded-full
          border-[var(--border)] border-t-[var(--accent)]
          animate-spin flex-shrink-0
        `}
        style={{ borderTopColor: "var(--accent)", borderColor: "var(--border)" }}
        aria-hidden="true"
      />
      {/* Label */}
      {text && (
        <p className="font-sans font-medium text-xs text-[var(--text-muted)] mt-2 select-none">
          {text}
        </p>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <div
        role="status"
        aria-label={text || "Loading"}
        className="fixed inset-0 flex flex-col items-center justify-center z-50"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={text || "Loading"}
      className="flex flex-col items-center justify-center gap-3 py-8"
    >
      {spinner}
    </div>
  );
};

export default Loader;
