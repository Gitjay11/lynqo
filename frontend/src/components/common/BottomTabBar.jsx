/**
 * BottomTabBar.jsx — Mobile Primary Navigation (Themed)
 *
 * bg-bg-elevated border-t border-app-border
 * Active tab:  text-app-accent border-t-2 border-app-accent
 * Inactive:    text-text-muted
 */

import { NavLink } from "react-router-dom";
import { Home, Ghost, MessageCircle, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";

// ── Tab definitions ───────────────────────────────────────────────────────────
const STATIC_TABS = [
  { to: "/feed",   label: "Feed",  icon: Home          },
  { to: "/anon",   label: "Anon",  icon: Ghost         },
  { to: "/chat",   label: "Chat",  icon: MessageCircle },
];

// ─────────────────────────────────────────────────────────────────────────────
const BottomTabBar = () => {
  const { user } = useAuth();

  // Active / inactive class factory for NavLink
  const tabClass = ({ isActive }) => `
    flex flex-col items-center justify-center gap-0.5
    flex-1 h-full
    text-[10px] font-semibold tracking-wide
    transition-colors duration-150 select-none
    focus:outline-none
    ${isActive
      ? "-mt-px"   /* border-top offset handled via inline style */
      : ""
    }
  `;

  const activeStyle  = { color: "var(--accent)", borderTop: "2px solid var(--accent)" };
  const inactiveStyle = { color: "var(--text-muted)" };

  return (
    <nav
      aria-label="Bottom tab bar"
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderTop:       "1px solid var(--border)",
      }}
      className="
        fixed bottom-0 left-0 right-0 z-40
        lg:hidden
        flex items-stretch
        h-14 w-full
        safe-area-inset-bottom
      "
    >
      {/* ── Feed, Anon, Chat ──────────────────────────────────────────────── */}
      {STATIC_TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/feed"}
          className={tabClass}
          aria-label={label}
        >
          {({ isActive }) => (
            <span
              style={isActive ? activeStyle : inactiveStyle}
              className="flex flex-col items-center justify-center gap-0.5 w-full h-full"
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span>{label}</span>
            </span>
          )}
        </NavLink>
      ))}

      {/* ── Profile tab (dynamic link) ────────────────────────────────────── */}
      <NavLink
        to={user ? `/profile/${user.id ?? user._id}` : "/login"}
        className={tabClass}
        aria-label="Profile"
      >
        {({ isActive }) => (
          <span
            style={isActive ? activeStyle : inactiveStyle}
            className="flex flex-col items-center justify-center gap-0.5 w-full h-full"
          >
            <User
              size={22}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span>Profile</span>
          </span>
        )}
      </NavLink>
    </nav>
  );
};

export default BottomTabBar;
