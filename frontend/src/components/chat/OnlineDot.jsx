/**
 * OnlineDot.jsx — Real-Time Online Presence Indicator (Dark Theme)
 *
 * ring-2 ring-zinc-900 so the ring matches the dark card surface.
 * Stays bg-emerald-500 (green dot is universally understood = online).
 *
 * Props:
 *  userId    {string}  — MongoDB ObjectId to check against onlineUsers Set
 *  size      {string}  — 'sm' (8px) | 'md' (10px, default) | 'lg' (14px)
 *  className {string}  — extra Tailwind classes for positioning
 */

import { useSocket } from "../../hooks/useSocket.js";

const SIZE_MAP = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3.5 h-3.5",
};

// ─────────────────────────────────────────────────────────────────────────────
const OnlineDot = ({ userId, size = "md", className = "" }) => {
  const { onlineUsers } = useSocket();

  if (!userId || !onlineUsers.has(userId)) return null;

  const sizeClass = SIZE_MAP[size] ?? SIZE_MAP.md;

  return (
    <span
      aria-label="Online"
      title="Online"
      className={`
        inline-block ${sizeClass} rounded-full
        bg-emerald-500
        ring-2 ring-zinc-900
        animate-pulse
        ${className}
      `}
    />
  );
};

export default OnlineDot;
