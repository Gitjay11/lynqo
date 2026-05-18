/**
 * LikeButton.jsx — Reusable Reaction Button with Optimistic UI
 *
 * Architecture note — two-layer optimistic pattern:
 *  • PostCard (parent) owns the authoritative likes/dislikes arrays and
 *    performs the rollback on API failure. It passes `active` and `count`
 *    as computed props so the source of truth is always PostCard.
 *  • LikeButton owns ONLY a local `bumped` boolean that fires a scale
 *    micro-animation on every tap, independent of the API round-trip.
 *    This makes the UI feel instant without duplicating state.
 *
 * On every click:
 *  1. `bumped` flips → CSS scale pulse plays (16 ms, then back to normal).
 *  2. Parent's `onClick` is called → parent updates its arrays optimistically
 *     and fires the API request.
 *  3. If the API fails, parent rolls back its arrays (active + count revert)
 *     and shows a toast — LikeButton just reflects whatever the parent says.
 *
 * Props:
 *  icon        {Component} — Lucide icon component
 *  count       {number}    — Current reaction count (controlled by parent)
 *  active      {boolean}   — Whether the logged-in user has already reacted
 *  activeColor {string}    — Tailwind text-color class when active
 *  activeBg    {string}    — Tailwind bg class when active
 *  onClick     {function}  — Called when tapped; parent handles API + rollback
 *  disabled    {boolean}   — Disables during in-flight requests
 *  label       {string}    — Accessible aria-label
 */

import { useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
const LikeButton = ({
  icon: Icon,
  count       = 0,
  active      = false,
  activeColor = "text-brand-600",
  activeBg    = "bg-brand-50",
  onClick,
  disabled    = false,
  label,
}) => {
  // Local micro-animation state — does NOT affect count/active truth
  const [bumped, setBumped] = useState(false);

  const handleClick = useCallback(() => {
    if (disabled) return;

    // 1. Trigger the scale-bounce animation
    setBumped(true);
    setTimeout(() => setBumped(false), 200);

    // 2. Delegate actual state change + API call to the parent
    onClick?.();
  }, [disabled, onClick]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={`
        flex items-center gap-1.5
        min-h-[44px] px-3 rounded-xl
        text-sm font-medium
        transition-all duration-150 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1
        disabled:cursor-not-allowed disabled:opacity-60
        select-none
        ${active
          ? `${activeColor} ${activeBg}`
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        }
      `}
    >
      {/*
       * Icon wrapper — the scale-bounce runs here, not on the whole button,
       * so the count number stays visually stable during the animation.
       */}
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          transition: "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          transform: bumped ? "scale(1.35)" : "scale(1)",
        }}
      >
        <Icon
          size={18}
          strokeWidth={active ? 2.5 : 2}
          className="flex-shrink-0"
        />
      </span>

      {/* Count — hidden at zero to keep the action row clean */}
      {count > 0 && (
        <span className="tabular-nums leading-none">{count}</span>
      )}
    </button>
  );
};

export default LikeButton;
