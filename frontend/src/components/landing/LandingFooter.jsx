/**
 * LandingFooter.jsx — Landing Page Footer (Dark Theme)
 *
 * Background: bg-zinc-950 border-t border-zinc-800
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
      className="bg-zinc-950 border-t border-zinc-800 py-12 px-4"
    >
      <div className="max-w-6xl mx-auto text-center">

        {/* ── Row 1: Brand ───────────────────────────────────────────────────── */}
        <p className="text-zinc-50 font-bold text-2xl">
          Lynqo
        </p>
        <p className="text-zinc-600 text-sm mt-2">
          Made for you. Built with ❤️.
        </p>

        {/* ── Row 2: Links ───────────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap justify-center gap-6">
          {LINKS.map(({ label }) => (
            <button
              key={label}
              className="
                text-zinc-600 text-sm
                hover:text-zinc-400
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
        <div className="mt-8 pt-8 border-t border-zinc-800">
          <p className="text-zinc-700 text-sm">
            © 2025 Lynqo. Made for you. Built with ❤️.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default LandingFooter;
