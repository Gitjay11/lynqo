/**
 * NotificationBell.jsx — Navbar Notification Bell Icon (Themed)
 *
 * Renders a bell button in the Navbar that:
 *  - Shows an unread count badge (accent bg)
 *  - Toggles the NotificationPanel dropdown on click
 *  - Closes the panel on outside click or Escape key
 *
 * Touch target: min-h-[44px] min-w-[44px] per mobile-first spec.
 */

import { useRef, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications.js";
import NotificationPanel from "./NotificationPanel.jsx";

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

  // ── Close on outside click or Escape key ──────────────────────────────────
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

      {/* ── Bell trigger button ──────────────────────────────────────────── */}
      <button
        id="notification-bell-btn"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={isPanelOpen}
        onClick={() => isPanelOpen ? closePanel() : openPanel()}
        style={isPanelOpen
          ? { color: "var(--text-primary)", backgroundColor: "var(--bg-elevated)" }
          : { color: "var(--text-secondary)" }
        }
      className="
          relative flex items-center justify-center
          min-h-[44px] min-w-[44px]
          rounded-xl
          transition-all duration-150
          active:scale-90
          focus:outline-none focus:ring-2 focus:ring-offset-1
        "
        onMouseEnter={e => { if (!isPanelOpen) e.currentTarget.style.backgroundColor = "var(--bg-elevated)"; }}
        onMouseLeave={e => { if (!isPanelOpen) e.currentTarget.style.backgroundColor = "transparent"; }}
      >
        {/* Bell icon */}
        <Bell
          size={20}
          strokeWidth={isPanelOpen ? 2.5 : 2}
        />

        {/* ── Unread count badge ─────────────────────────────────────────── */}
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className={`
              absolute top-1.5 right-1.5
              min-w-[16px] h-4 px-1
              rounded-full
              flex items-center justify-center
              text-[9px] font-black leading-none
              pointer-events-none
              ${badgeAnimating ? "animate-badge-pop" : ""}
            `}
            style={{
              backgroundColor: "var(--accent)",
              color:           "#ffffff",
            }}
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {/* ── Notification panel dropdown ────────────────────────────────────── */}
      {isPanelOpen && (
        <NotificationPanel onClose={closePanel} />
      )}
    </div>
  );
};

export default NotificationBell;
