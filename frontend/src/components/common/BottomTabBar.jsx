/**
 * BottomTabBar.jsx — Mobile Primary Navigation (Dark Theme)
 *
 * bg-zinc-900 border-t border-zinc-800
 * Active tab:  text-white border-t-2 border-white
 * Inactive:    text-zinc-500
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
    focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-400
    ${isActive
      ? "text-white border-t-2 border-white -mt-px"
      : "text-zinc-500 hover:text-zinc-300"
    }
  `;

  return (
    <nav
      aria-label="Bottom tab bar"
      className="
        fixed bottom-0 left-0 right-0 z-40
        lg:hidden
        flex items-stretch
        h-14 w-full
        bg-zinc-900 border-t border-zinc-800
        safe-area-inset-bottom
      "
    >
      {/* ── Feed, Anon, Search, Chat ───────────────────────────────────────── */}
      {STATIC_TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/feed"}
          className={tabClass}
          aria-label={label}
        >
          {({ isActive }) => (
            <>
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? "text-white" : "text-zinc-500"}
              />
              <span>{label}</span>
            </>
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
          <>
            <User
              size={22}
              strokeWidth={isActive ? 2.5 : 2}
              className={isActive ? "text-white" : "text-zinc-500"}
            />
            <span>Profile</span>
          </>
        )}
      </NavLink>
    </nav>
  );
};

export default BottomTabBar;
