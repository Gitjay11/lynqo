/**
 * LandingFooter.jsx — Landing Page Footer (Section 8)
 *
 * Background: var(--text-primary) — always-dark, regardless of theme.
 * All text hardcoded as rgba(245,240,232,…) since this section is
 * intentionally dark in both light and dark app modes.
 *
 * Content:
 *   • Lynqo wordmark (font-black, "o" in accent #e8643a)
 *   • Tagline: "Made for you. Built with love."
 *   • Three links: Privacy Policy, Terms of Service, Contact
 *   • Copyright: © 2026 Lynqo. Made for college students.
 */

const LandingFooter = () => {
  const LINKS = [
    { label: "Privacy Policy"   },
    { label: "Terms of Service" },
    { label: "Contact"          },
  ];

  return (
    <footer
      id="footer"
      className="py-10 px-4 text-center"
      style={{
        backgroundColor: "var(--text-primary)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="max-w-5xl mx-auto">

        {/* ── Wordmark ─────────────────────────────────────────────────────── */}
        <p
          className="text-xl font-black"
          style={{ color: "#f5f0e8", letterSpacing: "-0.03em" }}
        >
          Lynq<span style={{ color: "#e8643a" }}>o</span>
        </p>

        {/* ── Tagline ──────────────────────────────────────────────────────── */}
        <p
          className="text-xs mt-1 mb-6"
          style={{ color: "rgba(245,240,232,0.3)" }}
        >
          Made for you. Built with love.
        </p>

        {/* ── Nav links ────────────────────────────────────────────────────── */}
        <div className="flex justify-center gap-6 mb-6">
          {LINKS.map(({ label }) => (
            <button
              key={label}
              className="text-xs transition-colors duration-150 cursor-pointer min-h-0"
              style={{ color: "rgba(245,240,232,0.3)" }}
              onMouseEnter={e =>
                (e.currentTarget.style.color = "rgba(245,240,232,0.6)")
              }
              onMouseLeave={e =>
                (e.currentTarget.style.color = "rgba(245,240,232,0.3)")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Copyright ────────────────────────────────────────────────────── */}
        <p className="text-xs" style={{ color: "rgba(245,240,232,0.2)" }}>
          © 2026 Lynqo. Made for college students.
        </p>

      </div>
    </footer>
  );
};

export default LandingFooter;
