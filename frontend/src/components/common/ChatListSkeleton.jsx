/**
 * ChatListSkeleton.jsx — Shimmer rows for chat conversation list (Themed)
 *
 * Uses .skeleton (shimmer gradient) instead of animate-pulse.
 * Renders 6 placeholder rows.
 */

// ── Single skeleton row ───────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div
    aria-hidden="true"
    className="flex items-center gap-3 px-4 py-3 min-h-[72px]"
  >
    {/* Avatar circle */}
    <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />

    {/* Name + preview bars */}
    <div className="flex-1 space-y-2">
      <div className="skeleton h-3.5 rounded-lg w-28" />
      <div className="skeleton h-3 rounded-lg w-48" />
    </div>

    {/* Timestamp shimmer */}
    <div className="skeleton h-2.5 rounded-lg w-10 flex-shrink-0" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const ChatListSkeleton = () => (
  <div aria-label="Loading conversations">
    {Array.from({ length: 6 }).map((_, i) => (
      <SkeletonRow key={i} />
    ))}
  </div>
);

export default ChatListSkeleton;

