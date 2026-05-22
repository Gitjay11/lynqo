/**
 * OnlineDot.jsx — Real-Time Online Presence Indicator
 *
 * Renders a small green dot with a CSS pulse animation when the given
 * userId is currently connected (appears in the onlineUsers Set from
 * SocketContext). Renders nothing if the user is offline.
 *
 * Props:
 *  userId   {string}  — the MongoDB ObjectId string of the user to check
 *  size     {string}  — 'sm' (8px) | 'md' (11px, default) | 'lg' (14px)
 *  className {string} — optional extra classes for positioning
 *
 * Usage:
 *   <OnlineDot userId={otherUser._id} className="absolute bottom-0 right-0" />
 */

import { useSocket } from "../../hooks/useSocket.js";

// ── Size map: Tailwind classes for width/height ───────────────────────────────
const SIZE_MAP = {
  sm: "w-2 h-2",       // 8px  — tight spaces (conversation list)
  md: "w-2.5 h-2.5",  // 10px — default
  lg: "w-3.5 h-3.5",  // 14px — larger contexts (chat window header)
};

// ─────────────────────────────────────────────────────────────────────────────
const OnlineDot = ({ userId, size = "md", className = "" }) => {
  const { onlineUsers } = useSocket();

  // Don't render anything if this user is offline or no userId supplied
  if (!userId || !onlineUsers.has(userId)) return null;

  const sizeClass = SIZE_MAP[size] ?? SIZE_MAP.md;

  return (
    <span
      aria-label="Online"
      title="Online"
      className={`
        inline-block ${sizeClass} rounded-full
        bg-emerald-400
        ring-2 ring-white
        animate-pulse
        ${className}
      `}
    />
  );
};

export default OnlineDot;
