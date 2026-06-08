/**
 * ChatListSkeleton.jsx — Shimmer rows for chat conversation list (Themed)
 *
 * Renders 6 placeholder rows using CSS variable themed colors.
 */

// ── Single skeleton row ───────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div
    aria-hidden="true"
    className="flex items-center gap-3 px-4 py-3 min-h-[72px]"
  >
    {/* Avatar circle */}
    <div
      className="w-10 h-10 rounded-full animate-pulse flex-shrink-0"
      style={{ backgroundColor: "var(--bg-elevated)" }}
    />

    {/* Name + preview bars */}
    <div className="flex-1 space-y-2">
      <div
        className="h-3.5 rounded-lg animate-pulse w-28"
        style={{ backgroundColor: "var(--bg-elevated)" }}
      />
      <div
        className="h-3 rounded-lg animate-pulse w-48"
        style={{ backgroundColor: "var(--bg-elevated)" }}
      />
    </div>

    {/* Timestamp shimmer */}
    <div
      className="h-2.5 rounded-lg animate-pulse w-10 flex-shrink-0"
      style={{ backgroundColor: "var(--bg-elevated)" }}
    />
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
