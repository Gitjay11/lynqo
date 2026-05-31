/**
 * NotificationBell.jsx — Navbar Notification Bell Icon
 *
 * Renders a bell button in the Navbar that:
 *  - Shows an unread count badge (white circle, max "9+")
 *  - Toggles the NotificationPanel dropdown on click
 *  - Closes the panel on outside click or Escape key
 *
 * Panel open/closed state is managed in NotificationContext (not local) so
 * the context can check isPanelOpen when deciding whether to fire a toast.
 *
 * Touch target: min-h-[44px] min-w-[44px] per mobile-first spec.
 */

import { useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications.js";
import NotificationPanel from "./NotificationPanel.jsx";

// ───────────────────────────────────────────────────────────────────────────────
const NotificationBell = () => {
  const {
    unreadCount,
    isPanelOpen,
    openPanel,
    closePanel,
  } = useNotifications();
  const containerRef = useRef(null);

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

      {/* ── Bell trigger button ──────────────────────────────────────────── */}
      <button
        id="notification-bell-btn"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={isPanelOpen}
        onClick={() => isPanelOpen ? closePanel() : openPanel()}
        className="
          relative flex items-center justify-center
          min-h-[44px] min-w-[44px]
          rounded-xl hover:bg-zinc-800
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-zinc-400
          focus:ring-offset-1 focus:ring-offset-zinc-950
        "
      >
        {/* Bell icon — slightly brighter when panel is open */}
        <Bell
          size={20}
          className={`transition-colors duration-150 ${
            isPanelOpen ? "text-white" : "text-zinc-400 hover:text-zinc-200"
          }`}
          strokeWidth={isPanelOpen ? 2.5 : 2}
        />

        {/* ── Unread count badge ────────────────────────────────────────────── */}
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="
              absolute top-1.5 right-1.5
              min-w-[16px] h-4 px-1
              bg-white rounded-full
              flex items-center justify-center
              text-[9px] font-black text-black leading-none
              ring-2 ring-zinc-950
              pointer-events-none
            "
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {/* ── Notification panel dropdown ───────────────────────────────────────── */}
      {isPanelOpen && (
        <NotificationPanel onClose={closePanel} />
      )}
    </div>
  );
};

export default NotificationBell;
