/**
 * PostCardSkeleton.jsx — Shimmer Skeleton for PostCard
 *
 * Renders an animated placeholder that matches the visual layout of
 * <PostCard /> exactly:
 *  - Author row: avatar circle + two text lines (name + meta)
 *  - Three content lines of varying widths (mimics a real text paragraph)
 *  - Action row: three icon-button placeholders
 *
 * Usage:
 *  Render 3× while loading instead of a full-screen spinner.
 *  This gives users a preview of the content shape so the page
 *  feels faster even before data arrives.
 *
 *  {loading && [0, 1, 2].map((i) => <PostCardSkeleton key={i} />)}
 *
 * Responsive:
 *  Mobile: edge-to-edge, border-bottom (matches PostCard mobile style)
 *  md+:    rounded card with shadow (matches PostCard md+ style)
 *
 * No props — purely presentational.
 */

// ─────────────────────────────────────────────────────────────────────────────
const PostCardSkeleton = () => (
  <div
    aria-hidden="true"
    className="
      bg-white w-full
      border-b border-gray-100
      md:rounded-2xl md:border md:border-gray-100 md:shadow-sm
      animate-pulse
    "
  >
    {/* ── Author row ──────────────────────────────────────────────────────── */}
    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
      {/* Avatar circle */}
      <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />

      {/* Name + meta stack */}
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded-full w-32" />
        <div className="h-3 bg-gray-200 rounded-full w-20" />
      </div>
    </div>

    {/* ── Content lines ────────────────────────────────────────────────────── */}
    <div className="px-4 pb-4 space-y-2.5">
      {/* Line 1 — full width */}
      <div className="h-3 bg-gray-200 rounded-full w-full" />
      {/* Line 2 — ~85% width */}
      <div className="h-3 bg-gray-200 rounded-full w-[85%]" />
      {/* Line 3 — ~60% width — simulates paragraph trailing line */}
      <div className="h-3 bg-gray-200 rounded-full w-[60%]" />
    </div>

    {/* ── Action row ───────────────────────────────────────────────────────── */}
    <div className="flex items-center gap-3 px-4 pb-4 pt-1 border-t border-gray-50">
      {/* Like placeholder */}
      <div className="h-8 bg-gray-200 rounded-xl w-16" />
      {/* Dislike placeholder */}
      <div className="h-8 bg-gray-200 rounded-xl w-16" />
      {/* Comment placeholder */}
      <div className="h-8 bg-gray-200 rounded-xl w-16" />
    </div>
  </div>
);

export default PostCardSkeleton;
