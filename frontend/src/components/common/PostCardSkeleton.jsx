/**
 * PostCardSkeleton.jsx — Shimmer placeholder for feed posts (Themed)
 *
 * Uses bg-bg-elevated shimmer on bg-bg-surface card background.
 */

// ── Shimmer bar helper ────────────────────────────────────────────────────────
const Bar = ({ className }) => (
  <div
    className={`rounded-lg animate-pulse ${className}`}
    style={{ backgroundColor: "var(--bg-elevated)" }}
  />
);

// ─────────────────────────────────────────────────────────────────────────────
const PostCardSkeleton = () => (
  <div
    aria-hidden="true"
    aria-label="Loading post"
    style={{
      backgroundColor: "var(--bg-surface)",
      borderBottom:    "1px solid var(--border)",
    }}
    className="w-full md:rounded-2xl md:shadow-sm"
  >
    {/* ── Header row: avatar + name/timestamp ─────────────────────────────── */}
    <div className="flex items-center gap-3 px-4 pt-4 pb-2">
      {/* Avatar shimmer */}
      <div
        className="w-8 h-8 rounded-full animate-pulse flex-shrink-0"
        style={{ backgroundColor: "var(--bg-elevated)" }}
      />

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
    <div
      className="flex items-center gap-3 px-4 pb-4 pt-3"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <Bar className="h-7 w-16 rounded-xl" />
      <Bar className="h-7 w-16 rounded-xl" />
      <div className="flex-1" />
      <Bar className="h-7 w-12 rounded-xl" />
    </div>
  </div>
);

export default PostCardSkeleton;
