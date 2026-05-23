/**
 * Navbar.jsx — Top Application Bar (Dark Theme)
 *
 * bg-zinc-950 border-b border-zinc-800
 * Dropdown: bg-zinc-900 border-zinc-800
 */

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import Avatar from "./Avatar.jsx";

// ─────────────────────────────────────────────────────────────────────────────
const Navbar = () => {
  const { user, logout }    = useAuth();
  const navigate             = useNavigate();
  const [open, setOpen]      = useState(false);
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
    navigate(`/profile/${user?.id ?? user?._id}`);
  };

  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-40
        h-14 bg-zinc-950 border-b border-zinc-800
        flex items-center px-4
      "
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <Link
        to="/feed"
        className="
          flex items-center gap-2 min-h-[44px]
          text-violet-400 font-bold text-xl tracking-tight
          select-none flex-shrink-0
        "
        aria-label="Lynqo Home"
      >
        {/* Gradient logo mark */}
        <span
          className="
            w-8 h-8 rounded-xl
            bg-gradient-to-br from-violet-600 to-violet-400
            flex items-center justify-center
            text-white text-sm font-black
          "
        >
          L
        </span>
        <span className="hidden sm:block">Lynqo</span>
      </Link>

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
              rounded-xl hover:bg-zinc-800
              transition-colors duration-150 focus:outline-none
              focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 focus:ring-offset-zinc-950
            "
          >
            <Avatar src={user.profilePicture} name={user.name} size="sm" />

            {/* Name + chevron — desktop only */}
            <span className="hidden lg:flex items-center gap-1">
              <span className="text-sm font-medium text-zinc-200 max-w-[120px] truncate">
                {user.name}
              </span>
              <ChevronDown
                size={14}
                strokeWidth={2.5}
                className={`text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
                w-48 bg-zinc-900 rounded-2xl
                border border-zinc-800 shadow-xl shadow-black/40
                py-1.5 z-50
                animate-in fade-in slide-in-from-top-2 duration-150
              "
            >
              {/* User info header */}
              <div className="px-4 py-2.5 border-b border-zinc-800">
                <p className="text-xs font-semibold text-zinc-100 truncate">{user.name}</p>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              </div>

              {/* My Profile */}
              <button
                role="menuitem"
                onClick={handleProfile}
                className="
                  w-full flex items-center gap-3 px-4 py-2.5
                  text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100
                  transition-colors duration-100
                  min-h-[44px]
                "
              >
                <User size={16} className="text-zinc-500" />
                My Profile
              </button>

              {/* Logout */}
              <button
                role="menuitem"
                onClick={handleLogout}
                className="
                  w-full flex items-center gap-3 px-4 py-2.5
                  text-sm text-red-400 hover:bg-red-500/10
                  transition-colors duration-100
                  min-h-[44px]
                "
              >
                <LogOut size={16} className="text-red-500" />
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
