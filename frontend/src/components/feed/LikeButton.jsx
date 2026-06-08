/**
 * LikeButton.jsx — Reaction Button (Themed)
 *
 * Active state:   text-accent bg-accent-light (or red for dislike)
 * Inactive state: text-text-muted hover:bg-bg-elevated
 */

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";

// ─────────────────────────────────────────────────────────────────────────────
const LikeButton = ({
  icon:     Icon,
  initialCount,
  initialActive,
  endpoint,        // e.g. `/posts/${postId}/like`
  activeColor,     // CSS variable string when active, e.g. "var(--accent)"
  activeBg,        // CSS variable string when active, e.g. "var(--accent-light)"
  ariaLabelActive,
  ariaLabelInactive,
}) => {
  const [count,    setCount]    = useState(initialCount  ?? 0);
  const [isActive, setIsActive] = useState(initialActive ?? false);
  const [inFlight, setInFlight] = useState(false);

  const handleClick = useCallback(async () => {
    if (inFlight) return;

    const prevActive = isActive;
    const prevCount  = count;

    setIsActive(!isActive);
    setCount((n) => (isActive ? Math.max(0, n - 1) : n + 1));

    setInFlight(true);
    try {
      const { data } = await api.put(endpoint);
      setCount(data.count ?? data.likes ?? data.dislikes ?? 0);
      setIsActive(data.active ?? data.liked ?? data.disliked ?? false);
    } catch (err) {
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
      style={isActive
        ? { color: activeColor, backgroundColor: activeBg }
        : { color: "var(--text-muted)" }
      }
      className="
        flex items-center gap-1.5
        min-h-[44px] px-3 rounded-xl
        text-sm font-medium
        transition-colors duration-150 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-offset-1
        disabled:cursor-not-allowed disabled:opacity-60
      "
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = "var(--bg-elevated)"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      <span
        aria-hidden="true"
        style={{
          display:    "inline-flex",
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
