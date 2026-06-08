/**
 * ThemeContext.jsx — Global Theme State + Toggle
 *
 * Two themes supported:
 *   'warm-light' → data-theme="" (default, light mode)
 *   'warm-dark'  → data-theme="dark"
 *
 * On mount: reads 'lynqo-theme' from localStorage, applies the matching
 * data-theme attribute to <html>, and exposes the current theme to the tree.
 *
 * On toggle: flips the theme, updates <html> attribute, saves to localStorage.
 *
 * Exports:
 *   ThemeProvider — wrap <App /> with this in main.jsx
 *   useTheme()    — returns { theme, toggleTheme, isDark }
 */

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY  = "lynqo-theme";
const DARK_VALUE   = "warm-dark";
const LIGHT_VALUE  = "warm-light";

// ── Context ───────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export const ThemeProvider = ({ children }) => {
  // Read initial theme from localStorage (if any), default to light
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === DARK_VALUE
        ? DARK_VALUE
        : LIGHT_VALUE;
    } catch {
      return LIGHT_VALUE;
    }
  });

  // Apply data-theme attribute to <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === DARK_VALUE) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable (private browsing, storage quota, etc.) — ignore
    }
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === DARK_VALUE ? LIGHT_VALUE : DARK_VALUE));

  const isDark = theme === DARK_VALUE;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
};

export default ThemeContext;
