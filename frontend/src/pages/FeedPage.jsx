/**
 * FeedPage.jsx — Community Feed Page (Redesigned)
 *
 * Layout (top → bottom):
 *   <Navbar />              (in AppLayout)
 *   <main>
 *     <SearchBar />
 *     <FilterChips />
 *     <PostForm />           (hidden in search mode)
 *     "Recent posts" label
 *     <PostCard /> × n
 *     <LoadMoreButton />
 *   </main>
 *   <BottomTabBar />         (in AppLayout)
 *
 * Responsive strategy:
 *   Mobile  (<lg):  single column, full width, pb-20 for bottom tab bar
 *   lg+:            two-column CSS grid [1fr / 288px] with sticky sidebar
 *
 * Data strategy (unchanged):
 *   GET /api/posts?page=1&limit=10  on mount
 *   Load More → page N+1 appended
 *   New posts from PostForm → prepended
 *   Search → GET /api/search?q=term&type=posts  (via SearchBar callback)
 *
 * Filter chips — client-side only, filters by post.tag === selectedTag
 * No API changes, no socket logic changes, no auth changes.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Newspaper, Search, Loader2 } from "lucide-react";
import toast                                       from "react-hot-toast";
import api                                         from "../api/axios.js";
import { useAuth }                                 from "../hooks/useAuth.js";
import PostForm                                    from "../components/feed/PostForm.jsx";
import PostCard                                    from "../components/feed/PostCard.jsx";
import PostCardSkeleton                            from "../components/common/PostCardSkeleton.jsx";
import TrendingWidget                              from "../components/feed/TrendingWidget.jsx";
import SearchBar                                   from "../components/search/SearchBar.jsx";

// ── Filter chip definitions ───────────────────────────────────────────────────
const FILTER_CHIPS = [
  { label: "All",           value: null              },
  { label: "📢 Announcements", value: "Announcements" },
  { label: "😂 Memes",         value: "Memes"         },
  { label: "📚 Academics",     value: "Academics"     },
  { label: "💼 Placements",    value: "Placements"    },
  { label: "❓ Questions",     value: "Questions"     },
];

// ── FilterChips — horizontally scrollable row ─────────────────────────────────
const FilterChips = ({ selected, onSelect }) => (
  <div
    className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4"
    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
  >
    {FILTER_CHIPS.map((chip) => {
      const isActive = selected === chip.value;
      return (
        <button
          key={chip.label}
          type="button"
          onClick={() => onSelect(isActive && chip.value !== null ? null : chip.value)}
          className="
            flex items-center gap-1.5 flex-shrink-0
            px-4 py-1.5 rounded-full
            text-xs font-bold
            transition-all duration-150
            active:scale-95
            focus:outline-none
            cursor-pointer
          "
          style={isActive ? {
            backgroundColor: "var(--accent)",
            border:          "1px solid var(--accent)",
            color:           "#ffffff",
          } : {
            backgroundColor: "var(--bg-surface)",
            border:          "1px solid var(--border)",
            color:           "var(--text-secondary)",
          }}
          onMouseEnter={e => {
            if (!isActive) {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color       = "var(--text-primary)";
            }
          }}
          onMouseLeave={e => {
            if (!isActive) {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color       = "var(--text-secondary)";
            }
          }}
        >
          {chip.label}
        </button>
      );
    })}
  </div>
);

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
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError,   setSearchError]   = useState(null);
  const isSearchMode = searchQuery.length >= 2;

  // ── Client-side filter chip state ──────────────────────────────────────────
  const [selectedTag, setSelectedTag] = useState(null); // string | null

  // ── Abort controller for search ───────────────────────────────────────────
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
    setSearchResults((prev) => prev.filter((p) => p._id !== postId));
  }, []);

  // ── Search handler ─────────────────────────────────────────────────────────
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

  // ── Client-side filtered posts (normal mode only) ──────────────────────────
  const displayedPosts = selectedTag
    ? posts.filter((p) => p.tag === selectedTag)
    : posts;

  // ── Filtered search results ────────────────────────────────────────────────
  const displayedSearchResults = selectedTag
    ? searchResults.filter((p) => p.tag === selectedTag)
    : searchResults;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="
      w-full min-h-screen
      lg:grid lg:grid-cols-[1fr_288px] lg:gap-6
      lg:max-w-5xl lg:mx-auto lg:px-6 lg:py-6
      lg:items-start
    ">

      {/* ── Main feed column ───────────────────────────────────────────────── */}
      <div className="min-w-0 animate-fade-in">

        {/* ── Content wrapper — max-w-xl centered on sm+, full width on mobile ─ */}
        <div className="
          max-w-xl mx-auto
          px-4 py-4
          pb-20
          flex flex-col gap-4
          lg:max-w-none lg:px-0 lg:py-0
        ">

          {/* ── Search bar ─────────────────────────────────────────────── */}
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search posts..."
            loading={searchLoading}
          />

          {/* ── Filter chips ───────────────────────────────────────────── */}
          <FilterChips selected={selectedTag} onSelect={setSelectedTag} />

          {/* ── Post composer — hidden in search mode ───────────────────── */}
          {!isSearchMode && (
            <PostForm currentUser={user} onPost={handleNewPost} />
          )}

          {/* ════════════════════════════════════════════════════════════
              SEARCH MODE
          ════════════════════════════════════════════════════════════ */}
          {isSearchMode && (
            <div className="flex flex-col gap-3">

              {/* Search loading */}
              {searchLoading && (
                <>
                  <PostCardSkeleton />
                  <PostCardSkeleton />
                  <PostCardSkeleton />
                </>
              )}

              {/* Search error */}
              {!searchLoading && searchError && (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{searchError}</p>
                </div>
              )}

              {/* Search empty state */}
              {!searchLoading && !searchError && displayedSearchResults.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--bg-elevated)" }}
                  >
                    <Search size={22} style={{ color: "var(--text-muted)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold font-display" style={{ color: "var(--text-primary)" }}>
                      No posts found for &ldquo;{searchQuery}&rdquo;
                    </p>
                    <p className="text-xs font-normal mt-1" style={{ color: "var(--text-secondary)" }}>
                      Try a different keyword
                    </p>
                  </div>
                </div>
              )}

              {/* Search results */}
              {!searchLoading && displayedSearchResults.length > 0 && (
                <>
                  {/* Result count */}
                  <p className="text-xs font-normal pl-1" style={{ color: "var(--text-secondary)" }}>
                    {displayedSearchResults.length} result{displayedSearchResults.length !== 1 ? "s" : ""} for &ldquo;
                    <span style={{ color: "var(--text-primary)" }}>{searchQuery}</span>&rdquo;
                  </p>

                  <ul className="flex flex-col gap-3" aria-label="Search results">
                    {displayedSearchResults.map((post) => (
                      <li key={post._id}>
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

          {/* ════════════════════════════════════════════════════════════
              NORMAL MODE
          ════════════════════════════════════════════════════════════ */}
          {!isSearchMode && (
            <>
              {/* Loading skeleton */}
              {loading && (
                <div className="flex flex-col gap-3">
                  <PostCardSkeleton />
                  <PostCardSkeleton />
                  <PostCardSkeleton />
                </div>
              )}

              {/* Error with retry */}
              {!loading && error && (
                <div className="flex flex-col items-center gap-3 py-12">
                  <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>{error}</p>
                  <button
                    onClick={() => fetchPosts(1, false)}
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-colors duration-150"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      border:          "1px solid var(--border)",
                      color:           "var(--text-secondary)",
                    }}
                  >
                    <RefreshCw size={14} />
                    Try again
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && displayedPosts.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-1"
                    style={{ backgroundColor: "var(--bg-elevated)" }}
                  >
                    <Newspaper size={28} style={{ color: "var(--text-secondary)" }} />
                  </div>
                  <p className="text-base font-bold font-display" style={{ color: "var(--text-primary)" }}>
                    {selectedTag ? `No ${selectedTag} posts yet` : "No posts yet"}
                  </p>
                  <p className="text-sm font-normal max-w-[240px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {selectedTag ? "Try a different filter or be the first to post!" : "Be the first to post something!"}
                  </p>
                </div>
              )}

              {/* Post list */}
              {!loading && displayedPosts.length > 0 && (
                <>
                  {/* ── "Recent posts" section label ─────────────────── */}
                  <p
                    className="text-xs font-bold uppercase tracking-widest pl-1 -mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Recent posts
                  </p>

                  <ul className="flex flex-col gap-3" aria-label="Community feed">
                    {displayedPosts.map((post) => (
                      <li key={post._id}>
                        <PostCard
                          post={post}
                          currentUser={user}
                          onDelete={handleDeletePost}
                        />
                      </li>
                    ))}
                  </ul>

                  {/* ── Load More / End of feed ───────────────────────── */}
                  {page < totalPages ? (
                    <button
                      id="load-more-btn"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="
                        w-full py-3 rounded-2xl
                        text-sm font-bold
                        transition-all duration-150
                        active:scale-95
                        disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100
                        focus:outline-none
                        mt-2
                      "
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        border:          "1px solid var(--border)",
                        color:           "var(--text-secondary)",
                      }}
                      onMouseEnter={e => {
                        if (!loadingMore) {
                          e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                          e.currentTarget.style.color           = "var(--text-primary)";
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = "var(--bg-surface)";
                        e.currentTarget.style.color           = "var(--text-secondary)";
                      }}
                    >
                      {loadingMore ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 size={15} className="animate-spin" />
                          Loading…
                        </span>
                      ) : (
                        "Load more posts"
                      )}
                    </button>
                  ) : (
                    <p
                      className="text-xs text-center py-4"
                      style={{ color: "var(--text-muted)" }}
                    >
                      You have seen all posts
                    </p>
                  )}
                </>
              )}
            </>
          )}

        </div>
      </div>

      {/* ── Right sidebar — lg+ only ──────────────────────────────────────── */}
      <aside className="hidden lg:block sticky top-[72px] self-start space-y-4">
        <TrendingWidget />
      </aside>

    </div>
  );
};

export default FeedPage;
