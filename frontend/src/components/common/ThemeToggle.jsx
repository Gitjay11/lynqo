/**
 * ThemeToggle.jsx — Sun / Moon Theme Toggle Button (Upgraded)
 *
 * - Shows Sun icon when in dark mode (click → switch to light)
 * - Shows Moon icon when in light mode (click → switch to dark)
 * - w-9 h-9 button with bg-elevated border
 * - Smooth icon-swap animation: opacity-0 scale-75 → opacity-100 scale-100
 * - Fully themed via CSS variables (no hardcoded colors)
 */

import { useState, useEffect } from "react";
import { Sun, Moon }           from "lucide-react";
import { useTheme }            from "../../context/ThemeContext.jsx";

// ─────────────────────────────────────────────────────────────────────────────
const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  // ── Icon-swap animation state ──────────────────────────────────────────────
  // When isDark changes, we briefly flash opacity-0 scale-75 then restore.
  const [animating, setAnimating] = useState(false);
  const prevDark = useState(isDark)[0]; // track without re-triggering

  const handleClick = () => {
    setAnimating(true);
    toggleTheme();
    // Remove animation class after the transition completes
    setTimeout(() => setAnimating(false), 200);
  };

  return (
    <button
      id="theme-toggle-btn"
      onClick={handleClick}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="
        w-9 h-9 rounded-xl
        flex items-center justify-center
        cursor-pointer flex-shrink-0
        bg-[var(--bg-elevated)] border border-[var(--border)]
        text-[var(--text-secondary)]
        hover:border-[var(--accent)] hover:text-[var(--accent)]
        active:scale-90
        transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
      "
    >
      {/* Icon with swap animation */}
      <span
        className={`
          flex items-center justify-center
          transition-all duration-200
          ${animating ? "opacity-0 scale-75" : "opacity-100 scale-100"}
        `}
        aria-hidden="true"
      >
        {isDark
          ? <Sun  size={18} strokeWidth={2} />
          : <Moon size={18} strokeWidth={2} />
        }
      </span>
    </button>
  );
};

export default ThemeToggle;
