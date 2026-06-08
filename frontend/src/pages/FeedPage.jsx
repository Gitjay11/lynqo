/**
 * FeedPage.jsx — Community Feed Page
 *
 * Responsive layout strategy:
 *
 *  Mobile (default, < 768px):
 *    Single column, full-width. No horizontal margins.
 *    PostForm and PostCards are edge-to-edge.
 *    pb-16 already handled by AppLayout (bottom tab bar clearance).
 *
 *  md (768px – 1023px):
 *    Single column, centered at max-w-xl, horizontal padding px-4.
 *    PostForm and PostCards get card styling (rounded corners, shadow).
 *
 *  lg (1024px+):
 *    Two-column CSS grid: [1fr / 288px]
 *    Left column: max-w-xl feed (PostForm + PostCards)
 *    Right column: 288px "Trending / Active Students" widget
 *    (Left sidebar is handled by AppLayout → Sidebar)
 *
 * Data strategy (normal mode):
 *  - GET /api/posts?page=1&limit=10 on mount
 *  - "Load more" button fetches page N+1 and appends to list
 *  - New posts from PostForm are prepended to the list (no refetch)
 *
 * Search mode:
 *  - SearchBar (inline, always visible above PostForm) triggers
 *    GET /api/search?q=term&type=posts on debounced input (400ms, ≥2 chars)
 *  - Results replace the current feed view
 *  - Clearing the search (X button or empty query) restores normal feed
 *  - Load More / pagination is hidden in search mode
 *  - PostForm is hidden in search mode (search results are read-only)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Newspaper, Search }              from "lucide-react";
import toast                                          from "react-hot-toast";
import api                                            from "../api/axios.js";
import { useAuth }                                    from "../hooks/useAuth.js";
import PostForm                                       from "../components/feed/PostForm.jsx";
import PostCard                                       from "../components/feed/PostCard.jsx";
import PostCardSkeleton                               from "../components/common/PostCardSkeleton.jsx";
import TrendingWidget                                 from "../components/feed/TrendingWidget.jsx";
import SearchBar                                      from "../components/search/SearchBar.jsx";

// ─────────────────────────────────────────────────────────────────────────────
const FeedPage = () => {
  const { user } = useAuth();

  // ── Normal feed state ──────────────────────────────────────────────────────
  const [posts,       setPosts]       = useState([]);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState(null);

  // ── Search state ───────────────────────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState(""); // current active query
  const [searchResults, setSearchResults] = useState([]); // post results from API
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError,   setSearchError]   = useState(null);
  const isSearchMode = searchQuery.length >= 2;

  // ── Prevent stale search responses from overwriting newer ones ─────────────
  const searchAbortRef = useRef(null);

  // ── Fetch normal feed ──────────────────────────────────────────────────────
  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      const { data } = await api.get(`/posts?page=${pageNum}&limit=10`);
      setPosts((prev) => append ? [...prev, ...data.posts] : data.posts);
      setTotalPages(data.totalPages);
      setPage(pageNum);
      setError(null);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load posts";
      setError(msg);
      if (!append) toast.error(msg);
    }
  }, []);

  // ── Initial load on mount ──────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      await fetchPosts(1, false);
      if (mounted) setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [fetchPosts]);

  // ── Load more (pagination — only in normal mode) ───────────────────────────
  const handleLoadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await fetchPosts(page + 1, true);
    setLoadingMore(false);
  };

  // ── Handle new post from PostForm ──────────────────────────────────────────
  const handleNewPost = useCallback((newPost, type) => {
    if (type === "feed" && newPost) {
      setPosts((prev) => [newPost, ...prev]);
    }
  }, []);

  // ── Handle post deletion ───────────────────────────────────────────────────
  const handleDeletePost = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    // Also remove from search results if in search mode
    setSearchResults((prev) => prev.filter((p) => p._id !== postId));
  }, []);

  // ── Search handler (called by SearchBar with debounced query) ──────────────
  const handleSearch = useCallback(async (query) => {
    // Clear search mode
    if (!query || query.trim().length < 2) {
      setSearchQuery("");
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const trimmed = query.trim();
    setSearchQuery(trimmed);
    setSearchLoading(true);
    setSearchError(null);

    // Cancel any in-flight search
    if (searchAbortRef.current) searchAbortRef.current.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    try {
      const { data } = await api.get(
        `/search?q=${encodeURIComponent(trimmed)}&type=posts`,
        { signal: controller.signal }
      );
      setSearchResults(data.results?.posts ?? []);
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
      setSearchError("Search failed. Try again.");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // ── Highlight matched text in post content ─────────────────────────────────
  const HighlightedText = ({ text = "", query = "" }) => {
    if (!query || query.length < 2) return <>{text}</>;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="
      w-full min-h-screen
      md:max-w-2xl md:mx-auto md:px-4 md:py-4
      lg:max-w-none lg:px-6 lg:py-6
      lg:grid lg:grid-cols-[1fr_288px] lg:gap-6
      lg:items-start
    ">

      {/* ── Main feed column ─────────────────────────────────────────────── */}
      <div className="min-w-0 space-y-0 md:space-y-3">

        {/* ── Inline post search bar — always visible at top ──────────────── */}
        <div className="px-4 pt-4 pb-2 md:px-0 md:pt-0 md:pb-0">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search posts…"
            loading={searchLoading}
          />
        </div>

        {/* ── Mobile separator ────────────────────────────────────────────── */}
        <div className="md:hidden h-px" style={{ backgroundColor: "var(--border)" }} aria-hidden="true" />

        {/* ══════════════════════════════════════════════════════════════════
            SEARCH MODE — show results instead of normal feed
        ══════════════════════════════════════════════════════════════════ */}
        {isSearchMode && (
          <div className="space-y-0 md:space-y-3">

            {/* Search loading */}
            {searchLoading && (
              <div className="space-y-0 md:space-y-3">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            )}

            {/* Search error */}
            {!searchLoading && searchError && (
              <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{searchError}</p>
              </div>
            )}

            {/* Search empty state */}
            {!searchLoading && !searchError && searchResults.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-16 px-4 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--bg-elevated)" }}>
                  <Search size={22} style={{ color: "var(--text-muted)" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    No posts found for &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    Try a different keyword
                  </p>
                </div>
              </div>
            )}

            {/* Search results */}
            {!searchLoading && searchResults.length > 0 && (
              <>
                {/* Result count banner */}
                <div className="px-4 py-2 md:px-0">
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &ldquo;
                    <span style={{ color: "var(--text-primary)" }}>{searchQuery}</span>&rdquo;
                  </p>
                </div>

                <ul className="space-y-0 md:space-y-3" aria-label="Search results">
                  {searchResults.map((post) => (
                    <li key={post._id}>
                      {/*
                       * Reuse the full PostCard for consistent UX.
                       * PostCard already handles likes, comments, delete, etc.
                       * The `highlight` prop passes the query for content highlighting.
                       */}
                      <PostCard
                        post={post}
                        currentUser={user}
                        onDelete={handleDeletePost}
                        searchQuery={searchQuery}
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            NORMAL MODE — full feed (hidden when search is active)
        ══════════════════════════════════════════════════════════════════ */}
        {!isSearchMode && (
          <>
            {/* ── Post composer ─────────────────────────────────────────── */}
            <PostForm currentUser={user} onPost={handleNewPost} />

            {/* ── Feed divider (mobile only) ────────────────────────────── */}
            <div className="md:hidden h-2" style={{ backgroundColor: "var(--bg-elevated)" }} aria-hidden="true" />

            {/* ── Loading skeleton ──────────────────────────────────────── */}
            {loading && (
              <div className="space-y-0 md:space-y-3">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            )}

            {/* Error with retry */}
            {!loading && error && (
              <div className="flex flex-col items-center gap-3 py-12 px-4">
                <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>{error}</p>
                <button
                  onClick={() => fetchPosts(1, false)}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <RefreshCw size={15} />
                  Try again
                </button>
              </div>
            )}

            {/* ── Empty state ───────────────────────────────────────────── */}
            {!loading && !error && posts.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-16 px-4 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-1" style={{ backgroundColor: "var(--bg-elevated)" }}>
                  <Newspaper size={28} style={{ color: "var(--text-secondary)" }} />
                </div>
                <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>No posts yet</p>
                <p className="text-sm max-w-[240px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Be the first to post something!
                </p>
              </div>
            )}

            {/* ── Post list ─────────────────────────────────────────────── */}
            {!loading && posts.length > 0 && (
              <>
                <ul className="space-y-0 md:space-y-3" aria-label="Community feed">
                  {posts.map((post) => (
                    <li key={post._id}>
                      <PostCard
                        post={post}
                        currentUser={user}
                        onDelete={handleDeletePost}
                      />
                    </li>
                  ))}
                </ul>

                {/* ── Load more ─────────────────────────────────────────── */}
                <div className="flex justify-center py-6 px-4">
                  {page < totalPages ? (
                    <button
                      id="load-more-btn"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="btn-secondary flex items-center gap-2 text-sm w-full md:w-auto"
                    >
                      {loadingMore
                        ? <>
                            <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
                            Loading…
                          </>
                        : "Load more posts"
                      }
                    </button>
                  ) : (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      You&apos;ve reached the end of the feed 🎉
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Right sidebar widget (lg+ only) ──────────────────────────────── */}
      <aside className="hidden lg:block sticky top-20 space-y-4">
        <TrendingWidget />
      </aside>

    </div>
  );
};

export default FeedPage;
