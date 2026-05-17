/** @type {import('tailwindcss').Config} */
export default {
  // Scan all source files so Tailwind can tree-shake unused classes in production
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],

  theme: {
    extend: {
      // ── Brand / Primary palette (indigo) ─────────────────────────────────
      // Primary action color: brand-600 (#4F46E5) per the design spec.
      // brand-500 (#6366f1) is used for rings, highlights, and icon fills.
      colors: {
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1", // rings, highlights, active state fills
          600: "#4f46e5", // PRIMARY action color (buttons, active nav)
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },

        // ── Accent palette (violet) ─────────────────────────────────────────
        accent: {
          50:  "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6", // primary accent
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },

        // ── Neutral surface tones (warm gray) ─────────────────────────────
        // Supplements Tailwind's default gray for background surfaces
        surface: {
          50:  "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
        },
      },

      // ── Spacing tokens ────────────────────────────────────────────────────
      // Fixed sidebar width used across Sidebar.jsx and the main layout
      width: {
        sidebar: "240px",
      },

      // Mobile touch target minimum
      minHeight: {
        touch:  "44px",
        tabbar: "56px", // BottomTabBar fixed height
      },

      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      // ── Shadows ───────────────────────────────────────────────────────────
      boxShadow: {
        // Subtle top shadow for the bottom tab bar
        "tab-top": "0 -1px 0 0 #e5e7eb, 0 -4px 12px 0 rgba(0,0,0,0.04)",
        // Subtle right shadow for the sidebar
        "sidebar-r": "2px 0 12px 0 rgba(0,0,0,0.06)",
      },
    },
  },

  plugins: [],
};
