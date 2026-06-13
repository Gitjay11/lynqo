/**
 * SearchBar.jsx — Inline Post Search Input (Upgraded)
 *
 * Used on FeedPage (searches feed posts) and AnonPage (searches confessions).
 * Purely presentational + debounced — emits callbacks, never fetches data.
 *
 * Props:
 *  onSearch    — (query: string) => void  — called with debounced query (≥2 chars) or ""
 *  placeholder — string                   — input placeholder text
 *  loading     — boolean                  — replaces left search icon with spinner
 *
 * Behaviour:
 *  - Debounces input 400ms before calling onSearch
 *  - Minimum 2 characters before triggering onSearch (shorter clears results)
 *  - Clear (X) button: clears input AND calls onSearch("") to restore feed
 *  - Enter key: fires onSearch immediately (no debounce wait)
 *  - Escape key: clears the input
 *  - Always visible — not expandable/collapsible
 */

import { useState, useEffect, useRef } from "react";
import { Search, X }                   from "lucide-react";

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
  const [query, setQuery]     = useState("");
  const inputRef               = useRef(null);
  const debouncedQuery         = useDebounce(query, 400);

  // ── Fire onSearch when debounced value settles ────────────────────────────
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length >= 2) {
      onSearch(trimmed);
    } else if (trimmed.length === 0) {
      onSearch("");
    }
  }, [debouncedQuery, onSearch]);

  // ── Enter key: fire immediately — Escape: clear ───────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed.length >= 2) onSearch(trimmed);
    }
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
      {/* ── Search card container ──────────────────────────────────────────── */}
      <div
        className="
          flex items-center gap-3 w-full
          bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl
          px-4 py-2.5
          hover:border-[var(--accent)]
          focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)]
          transition-all duration-150
        "
      >
        {/* Left icon — spinner while loading, search icon otherwise */}
        <div
          className="flex-shrink-0 pointer-events-none"
          aria-hidden="true"
        >
          {loading ? (
            <span
              className="w-4 h-4 rounded-full border-2 border-t-[var(--accent)] animate-spin block"
              style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
            />
          ) : (
            <Search size={16} className="text-[var(--text-muted)]" />
          )}
        </div>

        {/* ── Text input ──────────────────────────────────────────────────── */}
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
          className="
            flex-1 bg-transparent outline-none
            text-sm text-[var(--text-primary)]
            placeholder:text-[var(--text-muted)]
          "
        />

        {/* ── Clear (X) button — only visible when there is text ───────── */}
        {query && (
          <button
            onClick={handleClear}
            aria-label="Clear search"
            className="
              flex-shrink-0
              w-5 h-5 rounded-full
              bg-[var(--bg-elevated)]
              flex items-center justify-center
              cursor-pointer
              hover:bg-[var(--border)]
              transition-colors duration-150
              focus:outline-none
            "
          >
            <X size={12} className="text-[var(--text-muted)]" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* ── "Showing results for" hint — visible when search is active ──── */}
      {isActive && !loading && (
        <p className="font-sans text-xs mt-1.5 pl-1 text-[var(--text-muted)]">
          Showing results for &ldquo;{query.trim()}&rdquo; —{" "}
          <button
            onClick={handleClear}
            className="font-semibold text-[var(--accent)] hover:opacity-80 transition-opacity duration-100 focus:outline-none"
          >
            clear
          </button>
        </p>
      )}
    </div>
  );
};

export default SearchBar;
