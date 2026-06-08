/**
 * AnonPage.jsx — Anonymous Community Board
 *
 * Mirrors FeedPage's layout and data-fetching strategy exactly,
 * but uses the /api/anon endpoint and anon-specific components.
 *
 * Key differences from FeedPage:
 *  - Uses GET /api/anon?page=1&limit=10 instead of /api/posts
 *  - Composer: AnonPostForm (no image, no anon toggle — all posts are anon)
 *  - Card:     AnonPostCard (shows ghost icon, never any author identity)
 *  - No TrendingWidget in the right sidebar (not relevant for anon board)
 *  - Right sidebar shows an "About the Anon Board" info widget instead
 *
 * Search mode:
 *  - SearchBar (inline, always visible above the composer) triggers
 *    GET /api/search?q=term&type=anon on debounced input (400ms, ≥2 chars)
 *  - Results replace the current board view
 *  - Clearing the search restores the full anon board
 *  - Composer is hidden in search mode
 *
 * Security note:
 *  This component NEVER receives or stores any real author data.
 *  The backend enforces this at the query level (realAuthor: select:false).
 *  This component enforces it at the UI level by using AnonPostCard which
 *  has no concept of author identity.
 *
 * Responsive layout (identical to FeedPage):
 *  Mobile  (default): single column, full width, pb-16 bottom clearance
 *  md (768px+):       max-w-xl centered container
 *  lg (1024px+):      two-column CSS grid [1fr / 288px] — right sidebar visible
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Ghost, ShieldCheck, EyeOff, Search } from "lucide-react";
import toast                                               from "react-hot-toast";
import api                                                 from "../api/axios.js";
import { useAuth }                                         from "../hooks/useAuth.js";
import AnonPostForm                                        from "../components/anon/AnonPostForm.jsx";
import AnonPostCard                                        from "../components/anon/AnonPostCard.jsx";
import PostCardSkeleton                                    from "../components/common/PostCardSkeleton.jsx";
import SearchBar                                           from "../components/search/SearchBar.jsx";

// ── Right sidebar info widget (lg+ only) ─────────────────────────────────────
const AnonInfoWidget = () => (
  <aside className="hidden lg:block sticky top-20 space-y-4" aria-label="About the Anon Board">
    <div className="card p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-muted)" }}>
          <Ghost size={14} />
        </span>
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>About Anon Board</h2>
      </div>

      {/* Rules */}
      <ul className="px-4 py-4 space-y-3">
        {[
          {
            icon: EyeOff,
            title: "Your identity is hidden",
            desc:  "Nobody, not even admins, can see who posted what on this board.",
            teal: false,
          },
          {
            icon: ShieldCheck,
            title: "Auto-moderation",
            desc:  "Posts reported by 5+ users are automatically hidden to keep things safe.",
            teal: true,
          },
          {
            icon: RefreshCw,
            title: "Newest first",
            desc:  "The feed shows the most recent posts at the top.",
            teal: false,
          },
        ].map(({ icon: Icon, title, desc, teal }) => (
          <li key={title} className="flex items-start gap-3">
            <span
              className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg mt-0.5"
              style={teal
                ? { backgroundColor: "var(--accent-light)", color: "var(--accent)" }
                : { backgroundColor: "var(--bg-elevated)",  color: "var(--text-muted)" }
              }
            >
              <Icon size={13} />
            </span>
            <div>
              <p className="text-xs font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>{title}</p>
              <p className="text-[11px] leading-snug mt-0.5" style={{ color: "var(--text-secondary)" }}>{desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </aside>
);

// ─────────────────────────────────────────────────────────────────────────────
const AnonPage = () => {
  const { user } = useAuth();

  // ── Normal board state ─────────────────────────────────────────────────────
  const [posts,       setPosts]       = useState([]);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState(null);

  // ── Search state ───────────────────────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError,   setSearchError]   = useState(null);
  const isSearchMode = searchQuery.length >= 2;

  // ── Prevent stale search responses ────────────────────────────────────────
  const searchAbortRef = useRef(null);

  // ── Fetch a page of anon posts ─────────────────────────────────────────────
  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      const { data } = await api.get(`/anon?page=${pageNum}&limit=10`);
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

  // ── Initial load ───────────────────────────────────────────────────────────
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

  // ── Pagination ─────────────────────────────────────────────────────────────
  const handleLoadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await fetchPosts(page + 1, true);
    setLoadingMore(false);
  };

  // ── Prepend newly created anon post ───────────────────────────────────────
  const handleNewPost = useCallback((newPost) => {
    if (newPost) setPosts((prev) => [newPost, ...prev]);
  }, []);

  // ── Remove hidden / deleted posts from the list ───────────────────────────
  const handlePostHidden = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    setSearchResults((prev) => prev.filter((p) => p._id !== postId));
  }, []);

  const handlePostDeleted = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    setSearchResults((prev) => prev.filter((p) => p._id !== postId));
  }, []);

  // ── Search handler (called by SearchBar with debounced query) ──────────────
  const handleSearch = useCallback(async (query) => {
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

    if (searchAbortRef.current) searchAbortRef.current.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    try {
      const { data } = await api.get(
        `/search?q=${encodeURIComponent(trimmed)}&type=anon`,
        { signal: controller.signal }
      );
      setSearchResults(data.results?.anonPosts ?? []);
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
      setSearchError("Search failed. Try again.");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="
      w-full min-h-screen
      md:max-w-2xl md:mx-auto md:px-4 md:py-4
      lg:max-w-none lg:px-6 lg:py-6
      lg:grid lg:grid-cols-[1fr_288px] lg:gap-6
      lg:items-start
    ">

      {/* ── Main anon feed column ──────────────────────────────────────────── */}
      <div className="min-w-0 space-y-0 md:space-y-3">

        {/* ── Page header (mobile only) ──────────────────────────────────── */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 lg:hidden">
          <Ghost size={16} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />
          <div>
            <h1 className="text-base font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
              Anon Board
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Post freely — your identity is always hidden
            </p>
          </div>
        </div>

        {/* ── Inline confession search bar — always visible at top ──────── */}
        <div className="px-4 pb-2 md:px-0 md:pb-0">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search confessions…"
            loading={searchLoading}
          />
        </div>

        {/* ── Mobile separator ──────────────────────────────────────────── */}
        <div className="md:hidden h-px" style={{ backgroundColor: "var(--border)" }} aria-hidden="true" />

        {/* ════════════════════════════════════════════════════════════════
            SEARCH MODE — show results instead of normal board
        ════════════════════════════════════════════════════════════════ */}
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
                    No confessions found for &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    Try a different keyword
                  </p>
                </div>
              </div>
            )}

            {/* Search results — rendered as AnonPostCards (no author, ever) */}
            {!searchLoading && searchResults.length > 0 && (
              <>
                {/* Result count */}
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
                       * SECURITY: AnonPostCard never exposes author identity.
                       * realAuthor is excluded at the DB level (select:false)
                       * AND by .select('-realAuthor') in searchController.
                       */}
                      <AnonPostCard
                        post={post}
                        currentUser={user}
                        onHidden={handlePostHidden}
                        onDelete={post.isOwner ? handlePostDeleted : undefined}
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            NORMAL MODE — full board (hidden when search is active)
        ════════════════════════════════════════════════════════════════ */}
        {!isSearchMode && (
          <>
            {/* ── Composer ──────────────────────────────────────────────── */}
            <AnonPostForm currentUser={user} onPost={handleNewPost} />

            {/* ── Visual separator (mobile only) ────────────────────────── */}
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
                  <Ghost size={28} style={{ color: "var(--text-secondary)" }} />
                </div>
                <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>No confessions yet</p>
                <p className="text-sm max-w-[240px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  You go first.
                </p>
              </div>
            )}

            {/* ── Post list ─────────────────────────────────────────────── */}
            {!loading && posts.length > 0 && (
              <>
                <ul className="space-y-0 md:space-y-3" aria-label="Anonymous community board">
                  {posts.map((post) => (
                    <li key={post._id}>
                      <AnonPostCard
                        post={post}
                        currentUser={user}
                        onHidden={handlePostHidden}
                        onDelete={post.isOwner ? handlePostDeleted : undefined}
                      />
                    </li>
                  ))}
                </ul>

                {/* ── Load more ─────────────────────────────────────────── */}
                <div className="flex justify-center py-6 px-4">
                  {page < totalPages ? (
                    <button
                      id="anon-load-more-btn"
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
                      You&apos;ve reached the end of the Anon board 👻
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Right sidebar — lg+ only ────────────────────────────────────── */}
      <AnonInfoWidget />

    </div>
  );
};

export default AnonPage;
