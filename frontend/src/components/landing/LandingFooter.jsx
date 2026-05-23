/**
 * LandingFooter.jsx — Landing Page Footer
 *
 * Background: bg-gray-900
 * Padding:    py-12 px-4
 * Container:  max-w-6xl mx-auto text-center
 *
 * Row 1 — Brand:
 *  Lynqo wordmark  text-white font-bold text-2xl
 *  Tagline below   text-white/40 text-sm mt-2
 *
 * Row 2 — Nav links (mt-8 flex flex-wrap justify-center gap-6):
 *  Privacy Policy | Terms of Service | Contact
 *  Each: text-white/40 text-sm hover:text-white/70 transition-colors
 *
 * Row 3 — Bottom bar (mt-8 pt-8 border-t border-white/10):
 *  Copyright line: text-white/30 text-sm
 */

const LandingFooter = () => {
  // ── Nav link data ───────────────────────────────────────────────────────────
  const LINKS = [
    { label: "Privacy Policy" },
    { label: "Terms of Service" },
    { label: "Contact" },
  ];

  return (
    <footer
      id="footer"
      className="bg-gray-900 py-12 px-4"
    >
      <div className="max-w-6xl mx-auto text-center">

        {/* ── Row 1: Brand ───────────────────────────────────────────────────── */}
        <p className="text-white font-bold text-2xl">
          Lynqo
        </p>
        <p className="text-white/40 text-sm mt-2">
          Made for you. Built with ❤️.
        </p>

        {/* ── Row 2: Links ───────────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap justify-center gap-6">
          {LINKS.map(({ label }) => (
            <button
              key={label}
              className="
                text-white/40 text-sm
                hover:text-white/70
                transition-colors duration-150
                cursor-pointer
                min-h-0
              "
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Row 3: Bottom bar ──────────────────────────────────────────────── */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <p className="text-white/30 text-sm">
            © 2025 Lynqo. Made for you. Built with ❤️.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default LandingFooter;
