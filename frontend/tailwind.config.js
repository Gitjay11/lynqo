/** @type {import('tailwindcss').Config} */
export default {
  // Scan all source files so Tailwind can tree-shake unused classes in production
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],

  theme: {
    extend: {
      // ── CSS-variable-mapped theme tokens (light + dark via data-theme) ────
      // Use these everywhere: bg-bg-primary, text-text-primary, border-app-border, etc.
      colors: {
        "bg-primary":   "var(--bg-primary)",
        "bg-surface":   "var(--bg-surface)",
        "bg-elevated":  "var(--bg-elevated)",
        "app-border":   "var(--border)",
        "text-primary": "var(--text-primary)",
        "text-secondary":"var(--text-secondary)",
        "text-muted":   "var(--text-muted)",
        "app-accent":   "var(--accent)",
        "app-accent-hover": "var(--accent-hover)",
        "accent-light": "var(--accent-light)",
        "app-error":    "var(--error)",
        "app-success":  "var(--success)",
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
        sans:    ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      // ── Letter spacing extensions ─────────────────────────────────────────
      letterSpacing: {
        tightest: "-0.04em",
        tighter:  "-0.03em",
        tight:    "-0.02em",
        snug:     "-0.01em",
      },

      // ── Shadows ───────────────────────────────────────────────────────────
      boxShadow: {
        // Subtle top shadow for the bottom tab bar
        "tab-top":    "0 -1px 0 0 var(--border), 0 -4px 12px 0 rgba(0,0,0,0.15)",
        // Subtle right shadow for the sidebar
        "sidebar-r":  "2px 0 12px 0 rgba(0,0,0,0.12)",
      },

      // ── Micro-animation keyframes ─────────────────────────────────────────
      // All durations ≤ 300ms — fast and snappy.
      // Wrapped in @media (prefers-reduced-motion: no-preference) in index.css.
      keyframes: {
        // Page/element entry — subtle upward drift
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Quick opacity-only fade (panel backdrop)
        "fade-in-fast": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        // Modal / sheet slide up from below
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // ChatWindow entry on desktop
        "slide-in-right": {
          "0%":   { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        // Centered dialog pop-in
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        // Like button heartbeat — triggers only when toggling ON
        "heart-pop": {
          "0%":   { transform: "scale(1)" },
          "40%":  { transform: "scale(1.3)" },
          "70%":  { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)" },
        },
        // Form error shake
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%":      { transform: "translateX(-4px)" },
          "40%":      { transform: "translateX(4px)" },
          "60%":      { transform: "translateX(-3px)" },
          "80%":      { transform: "translateX(3px)" },
        },
        // Notification badge pop-in
        "badge-pop": {
          "0%":   { transform: "scale(0)" },
          "60%":  { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
        // Shimmer for skeleton loaders
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      // ── Animation utilities ───────────────────────────────────────────────
      animation: {
        "fade-in":       "fade-in 0.2s ease-out",
        "fade-in-fast":  "fade-in-fast 0.15s ease-out",
        "slide-up":      "slide-up 0.25s ease-out",
        "slide-in-right":"slide-in-right 0.2s ease-out",
        "scale-in":      "scale-in 0.15s ease-out",
        "heart-pop":     "heart-pop 0.3s ease-out",
        "shake":         "shake 0.3s ease-out",
        "badge-pop":     "badge-pop 0.2s ease-out",
        "shimmer":       "shimmer 1.5s infinite linear",
      },
    },
  },

  plugins: [],
};
