/**
 * ChatListSkeleton.jsx — Shimmer Skeleton for ChatList conversation rows
 *
 * Renders 3 animated placeholder rows that match the exact layout of
 * a real conversation row in <ChatList />:
 *  - Avatar circle (40px)
 *  - Name line (medium width)
 *  - Message preview line (shorter)
 *  - Timestamp placeholder (far right)
 *
 * Usage:
 *  {loading && <ChatListSkeleton />}
 *
 * No props — always renders exactly 3 rows.
 */

// ── Single skeleton row ───────────────────────────────────────────────────────
const SkeletonRow = ({ nameWidth = "w-28", previewWidth = "w-40" }) => (
  <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-b-0">
    {/* Avatar circle */}
    <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />

    {/* Text stack */}
    <div className="flex-1 space-y-2 min-w-0">
      <div className="flex items-center justify-between">
        {/* Name */}
        <div className={`h-3.5 bg-gray-200 rounded-full ${nameWidth}`} />
        {/* Timestamp */}
        <div className="h-3 bg-gray-200 rounded-full w-10 flex-shrink-0" />
      </div>
      {/* Message preview */}
      <div className={`h-3 bg-gray-200 rounded-full ${previewWidth}`} />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const ChatListSkeleton = () => (
  <div aria-hidden="true" className="animate-pulse">
    {/* Vary widths slightly so it looks natural, not robotic */}
    <SkeletonRow nameWidth="w-28" previewWidth="w-44" />
    <SkeletonRow nameWidth="w-36" previewWidth="w-32" />
    <SkeletonRow nameWidth="w-24" previewWidth="w-40" />
  </div>
);

export default ChatListSkeleton;
