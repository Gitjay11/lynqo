/**
 * OnlineDot.jsx — Real-Time Online Presence Indicator (Redesigned)
 *
 * Supports two usage patterns:
 *  1. Pass `userId` → internally checks onlineUsers Set from SocketContext
 *  2. Pass `isOnline` boolean → skips internal lookup (use when caller already knows)
 *
 * Props:
 *  userId   {string}  — MongoDB ObjectId to check against onlineUsers Set
 *  isOnline {boolean} — override: if provided, bypasses socket lookup
 *  size     {string}  — 'sm' (8px) | 'md' (10px, default)
 *  className{string}  — extra Tailwind classes for absolute positioning
 */

import { useSocket } from "../../hooks/useSocket.js";

const SIZE_MAP = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
};

// ─────────────────────────────────────────────────────────────────────────────
const OnlineDot = ({ userId, isOnline, size = "md", className = "" }) => {
  const { onlineUsers } = useSocket();

  // Prefer explicit `isOnline` prop; fall back to socket context lookup
  const online =
    isOnline !== undefined
      ? isOnline
      : Boolean(userId && onlineUsers.has(String(userId)));

  if (!online) return null;

  const sizeClass = SIZE_MAP[size] ?? SIZE_MAP.md;

  return (
    <span
      aria-label="Online"
      title="Online"
      className={`inline-block ${sizeClass} rounded-full bg-green-500 ${className}`}
      style={{
        /* Ring colour matches the card/page surface — adapts to light + dark themes */
        border: "2px solid var(--bg-primary)",
      }}
    />
  );
};

export default OnlineDot;
