/**
 * Navbar.jsx — Top Application Bar
 *
 * Responsive behaviour:
 *  Mobile (default, < lg):
 *    Left  → App logo / name "Lynqo"
 *    Right → User avatar only (tapping opens a dropdown menu)
 *    Nav links are NOT shown here — mobile nav lives in BottomTabBar.
 *
 *  Desktop (lg: and above):
 *    Left   → Logo / name
 *    Center → Nav links: Feed | Anon | Chat
 *    Right  → Avatar + user name chip with dropdown (My Profile, Logout)
 *
 * The dropdown is a controlled state (open/closed) and closes when the user
 * clicks outside — implemented via a useEffect with a document click listener.
 *
 * z-index: z-40 — sits above page content but below modals (z-50).
 * Height:  56px fixed — consistent with BottomTabBar.
 */

import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Ghost,
  MessageCircle,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import Avatar from "./Avatar.jsx";

// ── Nav link definitions (center links on desktop) ────────────────────────────
const NAV_LINKS = [
  { to: "/",     label: "Feed",  icon: Home          },
  { to: "/anon", label: "Anon",  icon: Ghost         },
  { to: "/chat", label: "Chat",  icon: MessageCircle },
];

// ─────────────────────────────────────────────────────────────────────────────
const Navbar = () => {
  const { user, logout }    = useAuth();
  const navigate             = useNavigate();
  const [open, setOpen]      = useState(false); // dropdown open state
  const dropdownRef          = useRef(null);

  // ── Close dropdown when user clicks anywhere outside it ──────────────────
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  const handleProfile = () => {
    setOpen(false);
    navigate(`/profile/${user?._id}`);
  };

  // ── Active link style helper for desktop center nav ───────────────────────
  const desktopNavClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
     transition-all duration-150
     ${isActive
       ? "bg-brand-50 text-brand-600"
       : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
     }`;

  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-40
        h-14 bg-white border-b border-gray-100 shadow-sm
        flex items-center px-4
      "
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <Link
        to="/"
        className="
          flex items-center gap-2 min-h-[44px]
          text-brand-600 font-bold text-xl tracking-tight
          select-none flex-shrink-0
        "
        aria-label="Lynqo Home"
      >
        {/* Gradient logo mark */}
        <span
          className="
            w-8 h-8 rounded-xl
            bg-gradient-to-br from-brand-500 to-accent-500
            flex items-center justify-center
            text-white text-sm font-black
          "
        >
          L
        </span>
        <span className="hidden sm:block">Lynqo</span>
      </Link>

      {/* ── Desktop center nav links (lg+ only) ───────────────────────────── */}
      <nav className="hidden lg:flex items-center gap-1 ml-10" aria-label="Main navigation">
        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === "/"} className={desktopNavClass}>
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ── Spacer ────────────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Avatar / User dropdown ────────────────────────────────────────── */}
      {user && (
        <div className="relative" ref={dropdownRef}>
          {/* Trigger button */}
          <button
            id="navbar-avatar-btn"
            aria-haspopup="true"
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            className="
              flex items-center gap-2 min-h-[44px] px-1
              rounded-xl hover:bg-gray-50
              transition-colors duration-150 focus:outline-none
              focus:ring-2 focus:ring-brand-400 focus:ring-offset-1
            "
          >
            <Avatar src={user.avatar} name={user.name} size="sm" />

            {/* Name + chevron — desktop only */}
            <span className="hidden lg:flex items-center gap-1">
              <span className="text-sm font-medium text-gray-800 max-w-[120px] truncate">
                {user.name}
              </span>
              <ChevronDown
                size={14}
                strokeWidth={2.5}
                className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </span>
          </button>

          {/* ── Dropdown menu ──────────────────────────────────────────────── */}
          {open && (
            <div
              role="menu"
              aria-label="User menu"
              className="
                absolute right-0 top-[calc(100%+8px)]
                w-48 bg-white rounded-2xl
                border border-gray-100 shadow-lg
                py-1.5 z-50
                animate-in fade-in slide-in-from-top-2 duration-150
              "
            >
              {/* User info header */}
              <div className="px-4 py-2.5 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>

              {/* My Profile */}
              <button
                role="menuitem"
                onClick={handleProfile}
                className="
                  w-full flex items-center gap-3 px-4 py-2.5
                  text-sm text-gray-700 hover:bg-gray-50
                  transition-colors duration-100
                  min-h-[44px]
                "
              >
                <User size={16} className="text-gray-400" />
                My Profile
              </button>

              {/* Logout */}
              <button
                role="menuitem"
                onClick={handleLogout}
                className="
                  w-full flex items-center gap-3 px-4 py-2.5
                  text-sm text-red-500 hover:bg-red-50
                  transition-colors duration-100
                  min-h-[44px]
                "
              >
                <LogOut size={16} className="text-red-400" />
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
