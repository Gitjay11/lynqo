/**
 * Loader.jsx — Full-screen loading spinner (Dark Theme)
 *
 * bg-zinc-950, violet-600 spinner.
 */

const Loader = () => (
  <div
    role="status"
    aria-label="Loading"
    className="
      min-h-[100dvh] w-full
      flex flex-col items-center justify-center
      bg-zinc-950
    "
  >
    {/* Spinner ring */}
    <span
      className="
        w-10 h-10 rounded-full
        border-4 border-zinc-800 border-t-violet-500
        animate-spin
      "
      aria-hidden="true"
    />

    {/* Label */}
    <p className="mt-4 text-sm text-zinc-500 font-medium select-none">
      Loading…
    </p>
  </div>
);

export default Loader;
