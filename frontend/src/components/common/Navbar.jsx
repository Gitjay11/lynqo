/**
 * Navbar.jsx — Top Application Bar (Themed)
 *
 * bg-bg-elevated border-b border-app-border with backdrop blur
 * Dropdown: bg-bg-surface border-app-border
 *
 * Contains:
 *  - Logo
 *  - UserSearch — autocomplete for finding students by name/branch
 *      Mobile  (<md): search icon → expands inline (no separate page)
 *      Desktop (md+): icon → expands to 240px pill, shows dropdown results
 *  - ThemeToggle — Sun/Moon icon button
 *  - NotificationBell
 *  - Avatar + user dropdown menu
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate }                         from "react-router-dom";
import { Search, X, User, LogOut, ChevronDown }      from "lucide-react";
import { useAuth }                                   from "../../hooks/useAuth.js";
import Avatar                                        from "./Avatar.jsx";
import NotificationBell                              from "../notifications/NotificationBell.jsx";
import ThemeToggle                                   from "./ThemeToggle.jsx";
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
          ? <mark key={i} style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", borderRadius: "2px", padding: "0 2px", fontStyle: "normal" }}>{p}</mark>
          : p
      )}
    </>
  );
};

// ── User result row in the dropdown ──────────────────────────────────────────
const UserRow = ({ user, query, onClick }) => (
  <button
    onClick={onClick}
    style={{ color: "var(--text-primary)" }}
    className="
      w-full flex items-center gap-3 px-3 py-2
      transition-colors duration-100
      min-h-[44px] text-left focus:outline-none
    "
    onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-elevated)"}
    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
  >
    <Avatar src={user.profilePicture} name={user.name} size="sm" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate leading-tight" style={{ color: "var(--text-primary)" }}>
        <Highlight text={user.name} query={query} />
      </p>
      {(user.branch || user.semester) && (
        <p className="text-xs truncate leading-tight" style={{ color: "var(--text-secondary)" }}>
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
      <button
        aria-label="Search students"
        onClick={handleIconClick}
        style={{ color: "var(--text-secondary)" }}
        className="
          md:hidden
          w-10 h-10 flex items-center justify-center flex-shrink-0
          rounded-xl
          transition-colors duration-150
          focus:outline-none focus:ring-2
        "
        onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-elevated)"}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
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
          style={{ color: "var(--text-secondary)" }}
          className={`
            absolute left-0 top-1/2 -translate-y-1/2 z-10
            w-9 h-9 flex items-center justify-center flex-shrink-0
            rounded-full
            transition-colors duration-150 focus:outline-none
          `}
          onMouseEnter={e => { if (!expanded) e.currentTarget.style.backgroundColor = "var(--bg-elevated)"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
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
              style={{
                backgroundColor: "var(--bg-elevated)",
                border:          "1px solid var(--border)",
                color:           "var(--text-primary)",
              }}
              className="
                w-full h-9
                pl-9 pr-8
                rounded-full
                text-sm
                focus:outline-none
                transition-colors duration-150
              "
            />

            {/* Clear button */}
            {query && (
              <button
                onMouseDown={(e) => { e.stopPropagation(); setQuery(""); setResults([]); inputRef.current?.focus(); }}
                aria-label="Clear search"
                style={{ color: "var(--text-secondary)" }}
                className="
                  absolute right-2.5 top-1/2 -translate-y-1/2
                  w-5 h-5 flex items-center justify-center
                  rounded-full
                  transition-colors duration-100 focus:outline-none min-h-0
                "
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                <X size={12} />
              </button>
            )}

            {/* ── Results dropdown ─────────────────────────────────────────── */}
            {showDropdown && (
              <div
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border:          "1px solid var(--border)",
                }}
                className="
                  absolute top-[calc(100%+8px)] left-0
                  w-72 rounded-2xl
                  shadow-xl shadow-black/20
                  overflow-hidden z-50
                  animate-in fade-in slide-in-from-top-2 duration-150
                "
              >
                {searching && (
                  <p className="text-xs px-4 py-3" style={{ color: "var(--text-muted)" }}>Searching…</p>
                )}
                {!searching && results.length === 0 && query.trim().length >= 2 && (
                  <p className="text-xs px-4 py-3" style={{ color: "var(--text-muted)" }}>
                    No students found for &ldquo;{query.trim()}&rdquo;
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
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderBottom:    "1px solid var(--border)",
        backdropFilter:  "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      className="
        fixed top-0 left-0 right-0 z-40
        h-14 flex items-center px-4
      "
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <Link
        to="/feed"
        className="
          flex items-center gap-2 min-h-[44px]
          font-bold text-xl tracking-tight
          select-none flex-shrink-0
        "
        style={{ color: "var(--text-primary)" }}
        aria-label="Lynqo Home"
      >
        {/* Logo mark */}
        <span
          style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
          className="
            w-8 h-8 rounded-xl
            flex items-center justify-center
            text-sm font-black
          "
        >
          L
        </span>
        <span className="hidden sm:block">
          Lynq<span style={{ color: "var(--accent)" }}>o</span>
        </span>
      </Link>

      {/* ── Spacer — pushes right-side controls to the end ────────────────── */}
      <div className="flex-1" />

      {/* ── Theme toggle ─────────────────────────────────────────────────── */}
      <ThemeToggle />

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
              rounded-xl
              transition-colors duration-150 focus:outline-none
              focus:ring-2 focus:ring-offset-1
            "
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-surface)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <Avatar src={user.profilePicture} name={user.name} size="sm" />

            {/* Name + chevron — desktop only */}
            <span className="hidden lg:flex items-center gap-1">
              <span className="text-sm font-medium max-w-[120px] truncate" style={{ color: "var(--text-primary)" }}>
                {user.name}
              </span>
              <ChevronDown
                size={14}
                strokeWidth={2.5}
                style={{ color: "var(--text-muted)" }}
                className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </span>
          </button>

          {/* ── Dropdown menu ──────────────────────────────────────────────── */}
          {open && (
            <div
              role="menu"
              aria-label="User menu"
              style={{
                backgroundColor: "var(--bg-surface)",
                border:          "1px solid var(--border)",
              }}
              className="
                absolute right-0 top-[calc(100%+8px)]
                w-48 rounded-2xl
                shadow-xl shadow-black/20
                py-1.5 z-50
                animate-in fade-in slide-in-from-top-2 duration-150
              "
            >
              {/* User info header */}
              <div className="px-4 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{user.name}</p>
                <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{user.email}</p>
              </div>

              {/* My Profile */}
              <button
                role="menuitem"
                onClick={handleProfile}
                style={{ color: "var(--text-secondary)" }}
                className="
                  w-full flex items-center gap-3 px-4 py-2.5
                  text-sm
                  transition-colors duration-100
                  min-h-[44px]
                "
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                <User size={16} style={{ color: "var(--text-muted)" }} />
                My Profile
              </button>

              {/* Logout */}
              <button
                role="menuitem"
                onClick={handleLogout}
                className="
                  w-full flex items-center gap-3 px-4 py-2.5
                  text-sm text-red-500 hover:bg-red-500/10
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
