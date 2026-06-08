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
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      // ── Shadows ───────────────────────────────────────────────────────────
      boxShadow: {
        // Subtle top shadow for the bottom tab bar
        "tab-top":    "0 -1px 0 0 var(--border), 0 -4px 12px 0 rgba(0,0,0,0.15)",
        // Subtle right shadow for the sidebar
        "sidebar-r":  "2px 0 12px 0 rgba(0,0,0,0.12)",
      },
    },
  },

  plugins: [],
};
