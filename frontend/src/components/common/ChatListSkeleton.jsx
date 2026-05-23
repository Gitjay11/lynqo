/**
 * ChatListSkeleton.jsx — Shimmer rows for chat conversation list (Dark Theme)
 *
 * Renders 6 placeholder rows on zinc-900 bg with zinc-800 shimmer.
 */

// ── Single skeleton row ───────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div
    aria-hidden="true"
    className="flex items-center gap-3 px-4 py-3 min-h-[72px]"
  >
    {/* Avatar circle */}
    <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse flex-shrink-0" />

    {/* Name + preview bars */}
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-zinc-800 rounded-lg animate-pulse w-28" />
      <div className="h-3 bg-zinc-800 rounded-lg animate-pulse w-48" />
    </div>

    {/* Timestamp shimmer */}
    <div className="h-2.5 bg-zinc-800 rounded-lg animate-pulse w-10 flex-shrink-0" />
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
