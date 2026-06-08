/**
 * Sidebar.jsx — Desktop Left Navigation (Themed)
 *
 * bg-bg-surface border-r border-app-border
 * Active: bg-bg-elevated text-text-primary
 * Inactive: text-text-secondary hover:bg-bg-elevated
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
  { to: "/feed",   label: "Feed",      icon: Home          },
  { to: "/anon",   label: "Anonymous", icon: Ghost         },
  { to: "/chat",   label: "Chat",      icon: MessageCircle },
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
    ${isActive ? "font-semibold" : ""}
  `;

  const activeStyle   = { backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)" };
  const inactiveStyle = { color: "var(--text-secondary)" };

  return (
    <aside
      aria-label="Sidebar navigation"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderRight:     "1px solid var(--border)",
      }}
      className="
        hidden lg:flex flex-col
        fixed top-14 left-0 bottom-0
        w-sidebar
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
            style={({ isActive }) => isActive ? activeStyle : inactiveStyle}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{label}</span>

                {/* Active indicator dot */}
                {isActive && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "var(--accent)" }}
                  />
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
            style={({ isActive }) => isActive ? activeStyle : inactiveStyle}
          >
            {({ isActive }) => (
              <>
                <User
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>Profile</span>
                {isActive && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "var(--accent)" }}
                  />
                )}
              </>
            )}
          </NavLink>
        )}
      </nav>

      {/* ── User card + logout at the bottom ───────────────────────────────── */}
      {user && (
        <div className="px-3 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          {/* User info chip */}
          <button
            onClick={() => navigate(`/profile/${user.id}`)}
            className="
              w-full flex items-center gap-3 p-3
              rounded-xl
              transition-colors duration-150
              min-h-[44px] text-left
              focus:outline-none focus:ring-2
            "
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-elevated)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <Avatar src={user.avatar} name={user.name} size="sm" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{user.name}</p>
              <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{user.email}</p>
            </div>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="
              mt-1 w-full flex items-center gap-3 px-3 py-2.5
              rounded-xl text-sm font-medium text-red-500
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
