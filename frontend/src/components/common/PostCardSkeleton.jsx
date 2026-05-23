/**
 * PostCardSkeleton.jsx — Shimmer placeholder for feed posts (Dark Theme)
 *
 * Uses zinc-800/zinc-700 shimmer on zinc-900 card background.
 */

// ── Shimmer bar helper ────────────────────────────────────────────────────────
const Bar = ({ className }) => (
  <div className={`bg-zinc-800 rounded-lg animate-pulse ${className}`} />
);

// ─────────────────────────────────────────────────────────────────────────────
const PostCardSkeleton = () => (
  <div
    aria-hidden="true"
    aria-label="Loading post"
    className="
      bg-zinc-900 w-full
      border-b border-zinc-800
      md:rounded-2xl md:border md:border-zinc-800 md:shadow-sm
    "
  >
    {/* ── Header row: avatar + name/timestamp ─────────────────────────────── */}
    <div className="flex items-center gap-3 px-4 pt-4 pb-2">
      {/* Avatar shimmer */}
      <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse flex-shrink-0" />

      {/* Name + time shimmer */}
      <div className="flex-1 space-y-2">
        <Bar className="h-3 w-32" />
        <Bar className="h-2.5 w-20" />
      </div>
    </div>

    {/* ── Content shimmer ─────────────────────────────────────────────────── */}
    <div className="px-4 pb-4 space-y-2">
      <Bar className="h-3.5 w-full" />
      <Bar className="h-3.5 w-[90%]" />
      <Bar className="h-3.5 w-[75%]" />
    </div>

    {/* ── Action row shimmer ──────────────────────────────────────────────── */}
    <div className="flex items-center gap-3 px-4 pb-4 border-t border-zinc-800 pt-3">
      <Bar className="h-7 w-16 rounded-xl" />
      <Bar className="h-7 w-16 rounded-xl" />
      <div className="flex-1" />
      <Bar className="h-7 w-12 rounded-xl" />
    </div>
  </div>
);

export default PostCardSkeleton;
