/** @type {import('tailwindcss').Config} */
export default {
  // Scan all source files so Tailwind can tree-shake unused classes in production
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],

  theme: {
    extend: {
      // ── Brand / Primary palette — VIOLET (was indigo) ─────────────────────
      // Primary action color: brand-600 (#7C3AED) per the Deep Violet design spec.
      colors: {
        brand: {
          50:  "#f5f3ff", // violet-50  — light tint backgrounds
          100: "#ede9fe", // violet-100
          200: "#ddd6fe", // violet-200
          300: "#c4b5fd", // violet-300
          400: "#a78bfa", // violet-400 — active tabs, read receipts
          500: "#8b5cf6", // violet-500 — rings, highlights
          600: "#7c3aed", // violet-600 — PRIMARY action (buttons, active nav)
          700: "#6d28d9", // violet-700 — hover state
          800: "#5b21b6", // violet-800 — active/pressed
          900: "#4c1d95", // violet-900 — hero gradient anchor
        },

        // ── Accent palette (violet — matches brand now) ─────────────────────
        accent: {
          50:  "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },

        // ── Dark surface tones (zinc) ─────────────────────────────────────────
        // App background: zinc-950 (#09090B)
        // Card surfaces:  zinc-900 (#18181B)
        // Elevated cards: zinc-800 (#27272A)
        // Borders:        zinc-700 (#3F3F46)
        surface: {
          50:  "#09090b", // zinc-950 — page background
          100: "#18181b", // zinc-900 — card surface
          200: "#27272a", // zinc-800 — elevated card / input bg
          300: "#3f3f46", // zinc-700 — borders
        },
      },

      // ── Spacing tokens ────────────────────────────────────────────────────
      spacing: {
        sidebar: "240px",
      },
      width: {
        sidebar: "240px",
      },

      // Mobile touch target minimum
      minHeight: {
        touch:  "44px",
        tabbar: "56px",
      },

      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      // ── Shadows ───────────────────────────────────────────────────────────
      boxShadow: {
        // Subtle top shadow for the bottom tab bar (dark-mode aware)
        "tab-top": "0 -1px 0 0 #3f3f46, 0 -4px 12px 0 rgba(0,0,0,0.3)",
        // Subtle right shadow for the sidebar
        "sidebar-r": "2px 0 12px 0 rgba(0,0,0,0.4)",
      },
    },
  },

  plugins: [],
};
