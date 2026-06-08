/**
 * SearchBar.jsx — Inline Post Search Input (Redesigned)
 *
 * Used on FeedPage (searches feed posts) and AnonPage (searches confessions).
 * Purely presentational + debounced — emits callbacks, never fetches data.
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
 *   - Always visible — not expandable/collapsible (unlike Navbar user search)
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
const SearchBar = ({ onSearch, placeholder = "Search posts...", loading = false }) => {
  const [query, setQuery]   = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef             = useRef(null);
  const debouncedQuery       = useDebounce(query, 400);

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

  const isActive = query.trim().length >= 2;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* ── Search card container ─────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-2xl transition-colors duration-150"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: focused
            ? "1px solid var(--accent)"
            : "1px solid var(--border)",
        }}
      >
        {/* Leading icon — spinner when loading, search icon otherwise */}
        <div
          className="flex-shrink-0 pointer-events-none"
          style={{ color: "var(--text-muted)" }}
          aria-hidden="true"
        >
          {loading
            ? <Loader2 size={18} className="animate-spin" />
            : <Search size={18} />
          }
        </div>

        {/* ── Text input ────────────────────────────────────────────────── */}
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
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ color: "var(--text-primary)" }}
          className="
            flex-1 bg-transparent
            text-sm
            placeholder:text-[color:var(--text-muted)]
            outline-none
          "
        />

        {/* ── Clear (X) button — only visible when there is text ────────── */}
        {query && (
          <button
            onClick={handleClear}
            aria-label="Clear search"
            className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full transition-colors duration-100 focus:outline-none min-h-0"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── "Showing results for" hint — visible when search is active ──── */}
      {isActive && !loading && (
        <p className="text-xs mt-1.5 pl-1" style={{ color: "var(--text-muted)" }}>
          Showing results for &ldquo;{query.trim()}&rdquo; —{" "}
          <button
            onClick={handleClear}
            className="font-semibold transition-colors duration-100 min-h-0"
            style={{ color: "var(--accent)" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            clear
          </button>
        </p>
      )}
    </div>
  );
};

export default SearchBar;
