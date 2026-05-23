/**
 * Sidebar.jsx — Desktop Left Navigation (Dark Theme)
 *
 * bg-zinc-900 border-r border-zinc-800
 * Active: bg-violet-600/10 text-violet-400
 * Inactive: text-zinc-400 hover:bg-zinc-800
 */

import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Ghost,
  MessageCircle,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import Avatar from "./Avatar.jsx";

// ── Nav link definitions ──────────────────────────────────────────────────────
const NAV_LINKS = [
  { to: "/feed", label: "Feed",      icon: Home          },
  { to: "/anon", label: "Anonymous", icon: Ghost         },
  { to: "/chat", label: "Chat",      icon: MessageCircle },
];

// ─────────────────────────────────────────────────────────────────────────────
const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();

  // Active / inactive pill class for NavLink
  const linkClass = ({ isActive }) => `
    flex items-center gap-3 px-3 py-2.5
    rounded-xl text-sm font-medium
    min-h-[44px]
    transition-all duration-150
    ${isActive
      ? "bg-violet-600/10 text-violet-400 font-semibold"
      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
    }
  `;

  return (
    <aside
      aria-label="Sidebar navigation"
      className="
        hidden lg:flex flex-col
        fixed top-14 left-0 bottom-0
        w-sidebar
        bg-zinc-900 border-r border-zinc-800 shadow-sidebar-r
        z-30 overflow-y-auto
      "
    >
      {/* ── Nav links ──────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/feed"}
            className={linkClass}
            aria-label={label}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? "text-violet-400" : "text-zinc-500"}
                />
                <span>{label}</span>

                {/* Active indicator dot */}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500" />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Profile link — dynamic path */}
        {user && (
          <NavLink
            to={`/profile/${user.id}`}
            className={linkClass}
            aria-label="My Profile"
          >
            {({ isActive }) => (
              <>
                <User
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? "text-violet-400" : "text-zinc-500"}
                />
                <span>Profile</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500" />
                )}
              </>
            )}
          </NavLink>
        )}
      </nav>

      {/* ── User card + logout at the bottom ───────────────────────────────── */}
      {user && (
        <div className="px-3 py-4 border-t border-zinc-800">
          {/* User info chip */}
          <button
            onClick={() => navigate(`/profile/${user.id}`)}
            className="
              w-full flex items-center gap-3 p-3
              rounded-xl hover:bg-zinc-800
              transition-colors duration-150
              min-h-[44px] text-left
              focus:outline-none focus:ring-2 focus:ring-violet-500
            "
          >
            <Avatar src={user.avatar} name={user.name} size="sm" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-zinc-100 truncate">{user.name}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="
              mt-1 w-full flex items-center gap-3 px-3 py-2.5
              rounded-xl text-sm font-medium text-red-400
              hover:bg-red-500/10 transition-colors duration-150
              min-h-[44px]
              focus:outline-none focus:ring-2 focus:ring-red-500/50
            "
          >
            <LogOut size={18} className="text-red-500" />
            Logout
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
