/**
 * SearchBar.jsx — Inline Post Search Input (Reusable)
 *
 * Used on FeedPage (searches feed posts) and AnonPage (searches confessions).
 * This component is purely presentational + debounced — it emits callbacks
 * and never fetches data itself. The parent page owns the results state.
 *
 * Props:
 *   onSearch(query: string) — called with debounced query (≥2 chars) or ""
 *   placeholder?: string    — input placeholder text
 *   loading?: boolean       — shows spinner in the search icon when true
 *
 * Behaviour:
 *   - Debounces input 400ms before calling onSearch
 *   - Minimum 2 characters before triggering onSearch (shorter clears results)
 *   - Clear (X) button: clears input AND calls onSearch("") to restore feed
 *   - Enter key: fires onSearch immediately (no debounce wait)
 *   - Always visible — not expandable/collapsible (unlike the Navbar user search)
 *
 * Mobile-first:
 *   - Full width, min-h-[44px] touch target
 *   - No horizontal scroll
 */

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";

// ── Internal debounce hook ────────────────────────────────────────────────────
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// ─────────────────────────────────────────────────────────────────────────────
const SearchBar = ({ onSearch, placeholder = "Search posts…", loading = false }) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(query, 400);

  // ── Fire onSearch when debounced value settles ────────────────────────────
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length >= 2) {
      onSearch(trimmed);
    } else if (trimmed.length === 0) {
      // Only clear when truly empty — avoids clearing mid-type (1 char)
      onSearch("");
    }
  }, [debouncedQuery, onSearch]);

  // ── Enter key: fire immediately without waiting for debounce ─────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed.length >= 2) onSearch(trimmed);
    }
    // Escape: clear
    if (e.key === "Escape" && query) handleClear();
  };

  // ── Clear: reset input and restore full feed ──────────────────────────────
  const handleClear = () => {
    setQuery("");
    onSearch("");
    inputRef.current?.focus();
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full">

      {/* ── Leading icon — spinner when loading, search icon otherwise ─────── */}
      <div
        className="
          absolute left-3.5 top-1/2 -translate-y-1/2
          pointer-events-none
        "
        style={{ color: "var(--text-muted)" }}
        aria-hidden="true"
      >
        {loading
          ? <Loader2 size={16} className="animate-spin" />
          : <Search size={16} />
        }
      </div>

      {/* ── Text input ──────────────────────────────────────────────────────── */}
      <input
        ref={inputRef}
        id="inline-post-search"
        type="text"
        role="searchbox"
        aria-label={placeholder}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          backgroundColor: "var(--bg-elevated)",
          border:          "1px solid var(--border)",
          color:           "var(--text-primary)",
        }}
        className="
          w-full min-h-[44px]
          pl-10 pr-10
          rounded-xl
          text-sm
          transition-colors duration-150
          focus:outline-none focus:ring-2
        "
      />

      {/* ── Clear (X) button — only visible when there is text ──────────────── */}
      {query && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          style={{ color: "var(--text-muted)" }}
          className="
            absolute right-3 top-1/2 -translate-y-1/2
            w-6 h-6 flex items-center justify-center
            rounded-full
            transition-colors duration-100
            focus:outline-none min-h-0
          "
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
