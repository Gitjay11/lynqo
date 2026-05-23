/**
 * LikeButton.jsx — Reaction Button (Dark Theme)
 *
 * Active state:   text-violet-400 bg-violet-600/10 (or rose for dislike)
 * Inactive state: text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300
 */

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";

// ─────────────────────────────────────────────────────────────────────────────
const LikeButton = ({
  postId,
  icon:     Icon,
  initialCount,
  initialActive,
  endpoint,        // e.g. `/posts/${postId}/like`
  activeColor,     // Tailwind text class when active, e.g. "text-violet-400"
  activeBg,        // Tailwind bg class when active, e.g. "bg-violet-600/10"
  ringColor,       // focus ring color, e.g. "focus:ring-violet-500"
  ariaLabelActive,
  ariaLabelInactive,
}) => {
  const [count,    setCount]    = useState(initialCount  ?? 0);
  const [isActive, setIsActive] = useState(initialActive ?? false);
  const [inFlight, setInFlight] = useState(false);

  const handleClick = useCallback(async () => {
    if (inFlight) return;

    // Snapshot for rollback
    const prevActive = isActive;
    const prevCount  = count;

    // Optimistic update
    setIsActive(!isActive);
    setCount((n) => (isActive ? Math.max(0, n - 1) : n + 1));

    setInFlight(true);
    try {
      const { data } = await api.put(endpoint);
      // Sync with server truth
      setCount(data.count ?? data.likes ?? data.dislikes ?? 0);
      setIsActive(data.active ?? data.liked ?? data.disliked ?? false);
    } catch (err) {
      // Roll back
      setIsActive(prevActive);
      setCount(prevCount);
      toast.error(err.response?.data?.message ?? "Action failed");
    } finally {
      setInFlight(false);
    }
  }, [isActive, count, inFlight, endpoint]);

  return (
    <button
      onClick={handleClick}
      disabled={inFlight}
      aria-label={isActive ? ariaLabelActive : ariaLabelInactive}
      aria-pressed={isActive}
      className={`
        flex items-center gap-1.5
        min-h-[44px] px-3 rounded-xl
        text-sm font-medium
        transition-all duration-150 active:scale-95
        focus:outline-none focus:ring-2 ${ringColor} focus:ring-offset-1 focus:ring-offset-zinc-900
        disabled:cursor-not-allowed disabled:opacity-60
        ${isActive
          ? `${activeColor} ${activeBg}`
          : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
        }
      `}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          transition: "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
      </span>
      {count > 0 && (
        <span className="tabular-nums leading-none">{count}</span>
      )}
    </button>
  );
};

export default LikeButton;
