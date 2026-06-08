/**
 * ThemeToggle.jsx — Sun / Moon Theme Toggle Button
 *
 * - Shows Sun icon when in dark mode (click → switch to light)
 * - Shows Moon icon when in light mode (click → switch to dark)
 * - 36px button with 44px tap zone via padding
 * - Subtle scale animation on press (active:scale-90)
 * - Fully themed via CSS variables (no hardcoded colors)
 * - No text label — icon only
 *
 * Place inside Navbar next to NotificationBell.
 */

import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";

// ─────────────────────────────────────────────────────────────────────────────
const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        /* Ensure our own fast transition — override the global 0.2s for snappy icon swap */
        transition: "background-color 0.15s ease, transform 0.1s ease, border-color 0.15s ease",
        width:           "36px",
        height:          "36px",
        borderRadius:    "10px",
        border:          "1px solid var(--border)",
        backgroundColor: "var(--bg-elevated)",
        color:           "var(--text-secondary)",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        /* Larger tap zone via padding wrapper — real click area is 44px */
        padding:         "4px",
        margin:          "0 2px",
        cursor:          "pointer",
        flexShrink:      0,
      }}
      className="active:scale-90 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-1"
    >
      {isDark
        ? <Sun  size={18} strokeWidth={2} aria-hidden="true" />
        : <Moon size={18} strokeWidth={2} aria-hidden="true" />
      }
    </button>
  );
};

export default ThemeToggle;
