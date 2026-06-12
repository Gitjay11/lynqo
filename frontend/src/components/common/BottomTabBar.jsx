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
    text-[9px] font-semibold tracking-wider font-sans
    transition-all duration-100 select-none
    active:scale-90
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
        backgroundColor:      "var(--bg-elevated)",
        borderTop:            "0.5px solid var(--border)",
        backdropFilter:       "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        paddingBottom:        "env(safe-area-inset-bottom, 0px)",
      }}
      className="
        fixed bottom-0 left-0 right-0 z-40
        lg:hidden
        flex items-stretch
        h-14 w-full
        bg-opacity-90
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
