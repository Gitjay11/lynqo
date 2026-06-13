/**
 * NotificationBell.jsx — Navbar Notification Bell Icon (Upgraded)
 *
 * Renders a bell button in the Navbar that:
 *  - Shows an unread count badge (accent bg, border-bg-primary ring)
 *  - Toggles the NotificationPanel dropdown on click
 *  - Closes the panel on outside click or Escape key
 *
 * Touch target: w-9 h-9 (36px) — min 44px via combined padding in navbar.
 */

import { useRef, useEffect, useState } from "react";
import { Bell }                        from "lucide-react";
import { useNotifications }            from "../../hooks/useNotifications.js";
import NotificationPanel               from "./NotificationPanel.jsx";

// ─────────────────────────────────────────────────────────────────────────────
const NotificationBell = () => {
  const {
    unreadCount,
    isPanelOpen,
    openPanel,
    closePanel,
  } = useNotifications();
  const containerRef = useRef(null);

  // ── Badge pop-in animation whenever unread count increases ───────────────
  const [badgeAnimating, setBadgeAnimating] = useState(false);
  const prevCountRef = useRef(unreadCount);

  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setBadgeAnimating(true);
      const t = setTimeout(() => setBadgeAnimating(false), 250);
      return () => clearTimeout(t);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  // ── Close on outside click or Escape key ─────────────────────────────────
  useEffect(() => {
    if (!isPanelOpen) return;

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closePanel();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") closePanel();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown",   handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown",   handleEscape);
    };
  }, [isPanelOpen, closePanel]);

  // Badge: show exact count up to 9, then "9+"
  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div className="relative" ref={containerRef}>

      {/* ── Bell trigger button ─────────────────────────────────────────── */}
      <button
        id="notification-bell-btn"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={isPanelOpen}
        onClick={() => isPanelOpen ? closePanel() : openPanel()}
        className={`
          relative w-9 h-9 rounded-xl
          flex items-center justify-center
          text-[var(--text-secondary)]
          hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]
          active:scale-90
          transition-all duration-150 cursor-pointer
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
          ${isPanelOpen ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]" : ""}
        `.trim().replace(/\s+/g, " ")}
      >
        {/* Bell icon */}
        <Bell
          size={18}
          strokeWidth={isPanelOpen ? 2.5 : 2}
          aria-hidden="true"
        />

        {/* ── Unread count badge ──────────────────────────────────────────── */}
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className={`
              absolute -top-0.5 -right-0.5
              min-w-[16px] h-4 px-1
              bg-[var(--accent)] text-white
              font-sans font-bold text-[8px] tabular-nums
              rounded-full
              flex items-center justify-center
              border-2 border-[var(--bg-primary)]
              pointer-events-none
              ${badgeAnimating ? "animate-badge-pop" : ""}
            `.trim().replace(/\s+/g, " ")}
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {/* ── Notification panel dropdown ─────────────────────────────────────── */}
      {isPanelOpen && (
        <NotificationPanel onClose={closePanel} />
      )}
    </div>
  );
};

export default NotificationBell;
