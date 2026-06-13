/**
 * Divider.jsx — Horizontal Section Divider
 *
 * Used to separate content sections. Optionally shows a centered text label.
 *
 * Props:
 *  label     — string — optional centered label (e.g. "or", "Today")
 *  className — string — additional wrapper classes
 */

const Divider = ({ label, className = "" }) => {
  if (!label) {
    return (
      <hr
        className={`border-t border-[var(--border)] ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      role="separator"
      aria-label={label}
    >
      {/* Left line */}
      <div className="flex-1 border-t border-[var(--border)]" aria-hidden="true" />

      {/* Label */}
      <span className="font-sans font-bold text-[10px] uppercase tracking-widest text-[var(--text-muted)] select-none whitespace-nowrap">
        {label}
      </span>

      {/* Right line */}
      <div className="flex-1 border-t border-[var(--border)]" aria-hidden="true" />
    </div>
  );
};

export default Divider;
