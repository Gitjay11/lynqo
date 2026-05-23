/**
 * Sidebar.jsx — Desktop Left Navigation
 *
 * Visible only at lg: breakpoint and above (hidden on mobile/tablet).
 * Fixed left sidebar with icon + label nav links, 240px wide.
 *
 * Layout contract:
 *  - This sidebar is fixed at left: 0, pushing main content via ml-sidebar on desktop.
 *  - The AppLayout wrapper applies the correct margin — Sidebar itself just occupies space.
 *
 * Links:
 *  Feed | Anonymous | Chat | Profile
 *
 * Active state: filled pill background with brand-50 + brand-600 text.
 * Inactive:     gray-500 text, gray-100 hover pill.
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
      ? "bg-brand-50 text-brand-600 font-semibold"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }
  `;

  return (
    <aside
      aria-label="Sidebar navigation"
      className="
        hidden lg:flex flex-col
        fixed top-14 left-0 bottom-0
        w-sidebar
        bg-white border-r border-gray-100 shadow-sidebar-r
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
                  className={isActive ? "text-brand-600" : "text-gray-400"}
                />
                <span>{label}</span>

                {/* Active indicator dot */}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-600" />
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
                  className={isActive ? "text-brand-600" : "text-gray-400"}
                />
                <span>Profile</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-600" />
                )}
              </>
            )}
          </NavLink>
        )}
      </nav>

      {/* ── User card + logout at the bottom ───────────────────────────────── */}
      {user && (
        <div className="px-3 py-4 border-t border-gray-100">
          {/* User info chip */}
          <button
            onClick={() => navigate(`/profile/${user.id}`)}
            className="
              w-full flex items-center gap-3 p-3
              rounded-xl hover:bg-gray-50
              transition-colors duration-150
              min-h-[44px] text-left
              focus:outline-none focus:ring-2 focus:ring-brand-400
            "
          >
            <Avatar src={user.avatar} name={user.name} size="sm" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="
              mt-1 w-full flex items-center gap-3 px-3 py-2.5
              rounded-xl text-sm font-medium text-red-500
              hover:bg-red-50 transition-colors duration-150
              min-h-[44px]
              focus:outline-none focus:ring-2 focus:ring-red-300
            "
          >
            <LogOut size={18} className="text-red-400" />
            Logout
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
