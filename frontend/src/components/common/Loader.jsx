/**
 * Loader.jsx — Full-screen loading spinner (Themed)
 *
 * bg-bg-primary background, accent-colored spinner ring.
 */

const Loader = () => (
  <div
    role="status"
    aria-label="Loading"
    className="min-h-[100dvh] w-full flex flex-col items-center justify-center"
    style={{ backgroundColor: "var(--bg-primary)" }}
  >
    {/* Spinner ring */}
    <span
      className="w-10 h-10 rounded-full border-4 animate-spin"
      style={{
        borderColor:     "var(--border)",
        borderTopColor:  "var(--accent)",
      }}
      aria-hidden="true"
    />

    {/* Label */}
    <p className="mt-4 text-sm font-medium select-none" style={{ color: "var(--text-secondary)" }}>
      Loading…
    </p>
  </div>
);

export default Loader;
