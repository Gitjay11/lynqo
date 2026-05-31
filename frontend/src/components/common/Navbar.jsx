/**
 * Navbar.jsx — Top Application Bar (Dark Theme)
 *
 * bg-zinc-950 border-b border-zinc-800
 * Dropdown: bg-zinc-900 border-zinc-800
 *
 * Contains:
 *  - Logo
 *  - UserSearch — autocomplete for finding students by name/branch
 *      Mobile  (<md): search icon → expands inline (no separate page)
 *      Desktop (md+): icon → expands to 240px pill, shows dropdown results
 *  - NotificationBell
 *  - Avatar + user dropdown menu
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate }                         from "react-router-dom";
import { Search, X, User, LogOut, ChevronDown }      from "lucide-react";
import { useAuth }                                   from "../../hooks/useAuth.js";
import Avatar                                        from "./Avatar.jsx";
import NotificationBell                              from "../notifications/NotificationBell.jsx";
import api                                           from "../../api/axios.js";

// ── Debounce hook ─────────────────────────────────────────────────────────────
const useDebounce = (value, delay) => {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
};

// ── Escape regex for safe use in user-facing labels ───────────────────────────
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ── Highlight matching substring in a string ──────────────────────────────────
const Highlight = ({ text = "", query = "" }) => {
  if (!query || query.length < 2) return <>{text}</>;
  const escaped = escapeRegex(query);
  const parts   = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1
          ? <mark key={i} className="bg-white/20 text-white rounded px-0.5" style={{ fontStyle: "normal" }}>{p}</mark>
          : p
      )}
    </>
  );
};

// ── User result row in the dropdown ──────────────────────────────────────────
const UserRow = ({ user, query, onClick }) => (
  <button
    onClick={onClick}
    className="
      w-full flex items-center gap-3 px-3 py-2
      hover:bg-zinc-800 transition-colors duration-100
      min-h-[44px] text-left focus:outline-none focus:bg-zinc-800
    "
  >
    <Avatar src={user.profilePicture} name={user.name} size="sm" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-white truncate leading-tight">
        <Highlight text={user.name} query={query} />
      </p>
      {(user.branch || user.semester) && (
        <p className="text-xs text-zinc-500 truncate leading-tight">
          {[user.branch, user.semester ? `Sem ${user.semester}` : null]
            .filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// UserSearch — self-contained navbar student search with autocomplete dropdown
// ─────────────────────────────────────────────────────────────────────────────
const UserSearch = () => {
  const navigate      = useNavigate();
  const containerRef  = useRef(null);
  const inputRef      = useRef(null);

  const [expanded,  setExpanded]  = useState(false);
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);

  const debounced = useDebounce(query, 400);

  // ── Fetch user results ──────────────────────────────────────────────────
  useEffect(() => {
    const trimmed = debounced.trim();
    if (trimmed.length < 2) { setResults([]); return; }

    let cancelled = false;
    (async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(trimmed)}&type=users`);
        if (!cancelled) setResults(data.results?.users ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debounced]);

  // ── Collapse on outside click ────────────────────────────────────────────
  useEffect(() => {
    if (!expanded) return;
    const onOut = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        collapse();
      }
    };
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, [expanded]);

  const collapse = useCallback(() => {
    setExpanded(false);
    setQuery("");
    setResults([]);
  }, []);

  const expand = () => {
    setExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleIconClick = () => {
    if (expanded) {
      // If something typed, keep open; otherwise collapse
      if (!query) collapse();
    } else {
      expand();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") collapse();
  };

  const handleUserClick = (userId) => {
    collapse();
    navigate(`/profile/${userId}`);
  };

  const showDropdown = expanded && (results.length > 0 || (query.trim().length >= 2 && !searching));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="flex items-center">

      {/* ── MOBILE — icon only ───────────────────────────────────────────── */}
      {/* On mobile the input also expands inline (no separate page now) */}
      <button
        aria-label="Search students"
        onClick={handleIconClick}
        className="
          md:hidden
          w-10 h-10 flex items-center justify-center flex-shrink-0
          text-zinc-400 hover:text-white
          rounded-xl hover:bg-zinc-800
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-zinc-500
        "
      >
        <Search size={20} />
      </button>

      {/* ── DESKTOP — expandable pill with dropdown ──────────────────────── */}
      <div
        className="hidden md:flex items-center relative overflow-visible transition-all duration-200 ease-in-out"
        style={{ width: expanded ? "240px" : "36px" }}
      >
        {/* Toggle icon */}
        <button
          onClick={handleIconClick}
          aria-label={expanded ? "Close search" : "Search students"}
          className={`
            absolute left-0 top-1/2 -translate-y-1/2 z-10
            w-9 h-9 flex items-center justify-center flex-shrink-0
            rounded-full text-zinc-400
            transition-colors duration-150 focus:outline-none
            ${!expanded ? "hover:text-white hover:bg-zinc-800" : "hover:text-white"}
          `}
        >
          <Search size={17} />
        </button>

        {/* Expanded input + dropdown */}
        {expanded && (
          <>
            <input
              ref={inputRef}
              type="text"
              role="searchbox"
              aria-label="Search students by name or branch"
              autoComplete="off"
              spellCheck={false}
              placeholder="Find a student…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="
                w-full h-9
                pl-9 pr-8
                bg-zinc-800 border border-zinc-700
                rounded-full
                text-sm text-white placeholder:text-zinc-500
                focus:outline-none focus:border-zinc-500
                transition-colors duration-150
              "
            />

            {/* Clear button */}
            {query && (
              <button
                onMouseDown={(e) => { e.stopPropagation(); setQuery(""); setResults([]); inputRef.current?.focus(); }}
                aria-label="Clear search"
                className="
                  absolute right-2.5 top-1/2 -translate-y-1/2
                  w-5 h-5 flex items-center justify-center
                  text-zinc-500 hover:text-zinc-300
                  rounded-full hover:bg-zinc-700
                  transition-colors duration-100 focus:outline-none
                "
              >
                <X size={12} />
              </button>
            )}

            {/* ── Results dropdown ─────────────────────────────────────────── */}
            {showDropdown && (
              <div
                className="
                  absolute top-[calc(100%+8px)] left-0
                  w-72 bg-zinc-900 rounded-2xl
                  border border-zinc-800 shadow-xl shadow-black/40
                  overflow-hidden z-50
                  animate-in fade-in slide-in-from-top-2 duration-150
                "
              >
                {searching && (
                  <p className="text-xs text-zinc-500 px-4 py-3">Searching…</p>
                )}
                {!searching && results.length === 0 && query.trim().length >= 2 && (
                  <p className="text-xs text-zinc-500 px-4 py-3">
                    No students found for "{query.trim()}"
                  </p>
                )}
                {!searching && results.map((u) => (
                  <UserRow
                    key={u._id}
                    user={u}
                    query={query.trim()}
                    onClick={() => handleUserClick(u._id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const Navbar = () => {
  const { user, logout }   = useAuth();
  const navigate            = useNavigate();
  const [open, setOpen]     = useState(false);
  const dropdownRef         = useRef(null);

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
          text-white font-bold text-xl tracking-tight
          select-none flex-shrink-0
        "
        aria-label="Lynqo Home"
      >
        {/* Logo mark — solid white square */}
        <span
          className="
            w-8 h-8 rounded-xl
            bg-white
            flex items-center justify-center
            text-black text-sm font-black
          "
        >
          L
        </span>
        <span className="hidden sm:block">Lynqo</span>
      </Link>

      {/* ── Spacer — pushes right-side controls to the end ────────────────── */}
      <div className="flex-1" />

      {/* ── Notification bell (authenticated users only) ───────────────── */}
      {user && <NotificationBell />}

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
              focus:ring-2 focus:ring-zinc-400 focus:ring-offset-1 focus:ring-offset-zinc-950
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
