/**
 * LandingFooter.jsx — Landing Page Footer (Theme-Aware)
 *
 * Background: bg-bg-surface border-t border-app-border
 */

const LandingFooter = () => {
  const LINKS = [
    { label: "Privacy Policy" },
    { label: "Terms of Service" },
    { label: "Contact" },
  ];

  return (
    <footer
      id="footer"
      className="py-12 px-4"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="max-w-6xl mx-auto text-center">

        {/* ── Row 1: Brand ───────────────────────────────────────────────────── */}
        <p className="font-bold text-2xl" style={{ color: "var(--text-primary)" }}>
          Lynqo
        </p>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          Made for you. Built with ❤️.
        </p>

        {/* ── Row 2: Links ───────────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap justify-center gap-6">
          {LINKS.map(({ label }) => (
            <button
              key={label}
              className="
                text-sm
                transition-colors duration-150
                cursor-pointer
                min-h-0
              "
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text-secondary)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Row 3: Bottom bar ──────────────────────────────────────────────── */}
        <div
          className="mt-8 pt-8"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            © 2025 Lynqo. Made for you. Built with ❤️.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default LandingFooter;
