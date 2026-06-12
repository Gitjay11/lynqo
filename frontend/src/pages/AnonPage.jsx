/**
 * AnonPage.jsx — Anonymous Community Board (Redesigned)
 *
 * Layout: centered max-w-xl on mobile/tablet, two-column grid on lg+.
 *
 * New features vs old version (all client-side, no new API calls):
 *  - "👻 Confessions" page header
 *  - Sort chips (Hot / Recent / Most Liked / Most Discussed) — client-side sort
 *  - Dynamic section label per active sort
 *  - Redesigned load-more button and empty states
 *  - Desktop sidebar: "Hot this week" widget + "Post anonymously" reminder card
 *
 * All existing API calls preserved exactly:
 *   GET /api/anon?page=&limit=
 *   POST /api/anon (via AnonPostForm)
 *   GET /api/search?q=&type=anon (via SearchBar)
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  RefreshCw, Search,
  Flame, Clock, Heart, MessageCircle,
} from "lucide-react";
import toast              from "react-hot-toast";
import api                from "../api/axios.js";
import { useAuth }        from "../hooks/useAuth.js";
import AnonPostForm       from "../components/anon/AnonPostForm.jsx";
import AnonPostCard       from "../components/anon/AnonPostCard.jsx";
import PostCardSkeleton   from "../components/common/PostCardSkeleton.jsx";
import SearchBar          from "../components/search/SearchBar.jsx";

// ── Sort config ───────────────────────────────────────────────────────────────
const SORT_CHIPS = [
  { id: "hot",       label: "🔥 Hot",           Icon: Flame         },
  { id: "recent",    label: "Recent",            Icon: Clock         },
  { id: "liked",     label: "Most Liked",        Icon: Heart         },
  { id: "discussed", label: "Most Discussed",    Icon: MessageCircle },
];

const SECTION_LABELS = {
  hot:       "🔥 Trending confessions",
  recent:    "🕐 Recent confessions",
  liked:     "❤️ Most loved",
  discussed: "💬 Most discussed",
};

// ── Client-side sort ──────────────────────────────────────────────────────────
const getSortedPosts = (posts, sortBy) => {
  const now    = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  switch (sortBy) {
    case "hot": {
      const recent = posts.filter((p) => now - new Date(p.createdAt).getTime() < DAY_MS);
      const older  = posts.filter((p) => now - new Date(p.createdAt).getTime() >= DAY_MS);
      recent.sort((a, b) => (b.likes?.length ?? 0) - (a.likes?.length ?? 0));
      return [...recent, ...older];
    }
    case "recent":
      return [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case "liked":
      return [...posts].sort((a, b) => (b.likes?.length ?? 0) - (a.likes?.length ?? 0));
    case "discussed":
      return [...posts].sort((a, b) => (b.commentCount ?? 0) - (a.commentCount ?? 0));
    default:
      return posts;
  }
};

// ── Desktop right sidebar ─────────────────────────────────────────────────────
const DesktopSidebar = ({ posts, onScrollToForm }) => {
  const WEEK_MS       = 7 * 24 * 60 * 60 * 1000;
  const now           = Date.now();
  const hotThisWeek   = useMemo(() =>
    [...posts]
      .filter((p) => now - new Date(p.createdAt).getTime() < WEEK_MS)
      .sort((a, b) => (b.likes?.length ?? 0) - (a.likes?.length ?? 0))
      .slice(0, 3),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts]
  );

  return (
    <aside className="hidden lg:flex flex-col gap-4 sticky top-20 self-start" aria-label="Sidebar">

      {/* ── Hot this week ───────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{
          backgroundColor: "var(--bg-surface)",
          border:          "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Flame size={16} style={{ color: "var(--accent)" }} />
          <h2 className="text-sm font-bold font-display" style={{ color: "var(--text-primary)" }}>
            Hot this week
          </h2>
        </div>

        {hotThisWeek.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Nothing trending yet — be the first!
          </p>
        ) : (
          <ol>
            {hotThisWeek.map((post, idx) => (
              <li
                key={post._id}
                className="flex items-start gap-2 py-3"
                style={{ borderTop: idx > 0 ? "1px solid var(--border)" : "none" }}
              >
                <span
                  className="text-base font-black w-4 flex-shrink-0"
                  style={{ color: "var(--border)" }}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p
                    className="text-xs font-normal leading-relaxed line-clamp-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {post.content}
                  </p>
                  <p className="text-[9px] mt-1 flex items-center gap-1"
                     style={{ color: "var(--text-muted)" }}>
                    <Heart size={9} />
                    {post.likes?.length ?? 0} likes
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* ── Post anonymously reminder ─────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 text-center"
        style={{
          backgroundColor: "var(--accent-light)",
          border:          "1px solid var(--accent-border)",
        }}
      >
        <div className="text-3xl mb-2 select-none">👻</div>
        <p className="text-xs font-bold font-display mb-1" style={{ color: "var(--text-primary)" }}>
          Got something to say?
        </p>
        <p className="text-xs font-normal mb-3" style={{ color: "var(--text-secondary)" }}>
          Post it anonymously. No one will know.
        </p>
        <button
          onClick={onScrollToForm}
          className="w-full text-white text-xs font-bold py-2 rounded-xl
                     active:scale-95 transition-all duration-150 min-h-0"
          style={{ backgroundColor: "var(--accent)" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--accent-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--accent)"; }}
        >
          Post Anonymously
        </button>
      </div>
    </aside>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const AnonPage = () => {
  const { user } = useAuth();

  // ── Normal board state ────────────────────────────────────────────────────
  const [posts,       setPosts]       = useState([]);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState(null);

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError,   setSearchError]   = useState(null);
  const isSearchMode = searchQuery.length >= 2;

  // ── Sort state (client-side) ──────────────────────────────────────────────
  const [sortBy, setSortBy] = useState("hot");

  const searchAbortRef = useRef(null);
  const formRef        = useRef(null); // used by sidebar CTA to scroll to form

  // ── Scroll sidebar CTA to form ────────────────────────────────────────────
  const handleScrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      document.getElementById("anon-content-textarea")?.focus();
    }, 350);
  };

  // ── Sorted posts (client-side, derived) ───────────────────────────────────
  const displayPosts = useMemo(() => getSortedPosts(posts, sortBy), [posts, sortBy]);

  // ── Fetch a page of anon posts ────────────────────────────────────────────
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

  // ── Initial load ──────────────────────────────────────────────────────────
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

  // ── Pagination ────────────────────────────────────────────────────────────
  const handleLoadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await fetchPosts(page + 1, true);
    setLoadingMore(false);
  };

  // ── Prepend newly created anon post ──────────────────────────────────────
  const handleNewPost = useCallback((newPost) => {
    if (newPost) setPosts((prev) => [newPost, ...prev]);
  }, []);

  // ── Remove hidden / deleted posts ─────────────────────────────────────────
  const handlePostHidden = useCallback((postId) => {
    setPosts((prev)         => prev.filter((p) => p._id !== postId));
    setSearchResults((prev) => prev.filter((p) => p._id !== postId));
  }, []);

  const handlePostDeleted = useCallback((postId) => {
    setPosts((prev)         => prev.filter((p) => p._id !== postId));
    setSearchResults((prev) => prev.filter((p) => p._id !== postId));
  }, []);

  // ── Search handler (called by SearchBar with debounced query) ─────────────
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

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="
        w-full min-h-screen
        lg:max-w-5xl lg:mx-auto lg:px-6 lg:py-6
        lg:grid lg:grid-cols-[1fr_288px] lg:gap-6 lg:items-start
      "
    >
      {/* ══ Main feed column ══════════════════════════════════════════════════ */}
      <div className="min-w-0 animate-fade-in">
        <div className="max-w-xl mx-auto px-4 py-4 flex flex-col gap-4 pb-24 lg:max-w-none lg:px-0 lg:pb-8">

          {/* ── Page header ──────────────────────────────────────────────── */}
          <div className="text-center py-1">
            <h1
              className="text-2xl font-black font-display tracking-snug"
              style={{ color: "var(--text-primary)" }}
            >
              👻 Confessions
            </h1>
            <p className="text-xs font-normal mt-1" style={{ color: "var(--text-secondary)" }}>
              Say it anonymously. No one will know.
            </p>
          </div>

          {/* ── Search bar (existing SearchBar component) ─────────────────── */}
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search confessions..."
            loading={searchLoading}
          />

          {/* ── Sort chips (hidden in search mode) ────────────────────────── */}
          {!isSearchMode && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
              {SORT_CHIPS.map(({ id, label, Icon }) => {
                const isActive = sortBy === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSortBy(id)}
                    className={`
                      flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold
                      flex-shrink-0 cursor-pointer active:scale-95 transition-all duration-150
                      min-h-0
                    `}
                    style={isActive ? {
                      backgroundColor: "var(--accent)",
                      border:          "1px solid var(--accent)",
                      color:           "#ffffff",
                    } : {
                      backgroundColor: "var(--bg-surface)",
                      border:          "1px solid var(--border)",
                      color:           "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = "var(--accent)";
                        e.currentTarget.style.color       = "var(--text-primary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.color       = "var(--text-secondary)";
                      }
                    }}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SEARCH MODE
          ════════════════════════════════════════════════════════════════ */}
          {isSearchMode && (
            <div className="flex flex-col gap-4">
              {searchLoading && (
                <>
                  <PostCardSkeleton />
                  <PostCardSkeleton />
                  <PostCardSkeleton />
                </>
              )}

              {!searchLoading && searchError && (
                <p className="text-sm text-center py-6" style={{ color: "var(--text-secondary)" }}>
                  {searchError}
                </p>
              )}

              {!searchLoading && !searchError && searchResults.length === 0 && (
                /* Empty search state */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: "var(--accent-light)",
                      border:          "1px solid var(--accent-border)",
                    }}
                  >
                    <span className="text-3xl select-none">👻</span>
                  </div>
                  <p className="text-base font-bold font-display mb-2" style={{ color: "var(--text-primary)" }}>
                    No results for &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-xs font-normal leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Try a different search term
                  </p>
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <>
                  <p className="text-xs pl-1" style={{ color: "var(--text-secondary)" }}>
                    {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &ldquo;
                    <span style={{ color: "var(--text-primary)" }}>{searchQuery}</span>&rdquo;
                  </p>
                  <ul className="flex flex-col gap-4" aria-label="Search results">
                    {searchResults.map((post) => (
                      <li key={post._id} className="animate-fade-in">
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
              {/* Composer */}
              <div ref={formRef}>
                <AnonPostForm currentUser={user} onPost={handleNewPost} />
              </div>

              {/* Loading skeleton */}
              {loading && (
                <div className="flex flex-col gap-4">
                  <PostCardSkeleton />
                  <PostCardSkeleton />
                  <PostCardSkeleton />
                </div>
              )}

              {/* Error with retry */}
              {!loading && error && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{error}</p>
                  <button
                    onClick={() => fetchPosts(1, false)}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <RefreshCw size={15} />
                    Try again
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && posts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: "var(--accent-light)",
                      border:          "1px solid var(--accent-border)",
                    }}
                  >
                    <span className="text-3xl select-none">👻</span>
                  </div>
                  <p className="text-base font-bold font-display mb-2" style={{ color: "var(--text-primary)" }}>
                    No confessions yet
                  </p>
                  <p className="text-xs font-normal leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    You go first. No one will know.
                  </p>
                </div>
              )}

              {/* Post list */}
              {!loading && !error && displayPosts.length > 0 && (
                <>
                  {/* Section label — dynamic based on active sort */}
                  <p
                    className="text-xs font-bold uppercase tracking-widest pl-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {SECTION_LABELS[sortBy]}
                  </p>

                  <ul className="flex flex-col gap-4" aria-label="Anonymous community board">
                    {displayPosts.map((post) => (
                      <li key={post._id} className="animate-fade-in">
                        <AnonPostCard
                          post={post}
                          currentUser={user}
                          onHidden={handlePostHidden}
                          onDelete={post.isOwner ? handlePostDeleted : undefined}
                        />
                      </li>
                    ))}
                  </ul>

                  {/* Load more / end of feed */}
                  <div className="mt-2">
                    {page < totalPages ? (
                      <button
                        id="anon-load-more-btn"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="w-full rounded-2xl py-3 text-sm font-bold tracking-wide
                                   active:scale-95 transition-all duration-150 min-h-0"
                        style={{
                          backgroundColor: "var(--bg-surface)",
                          border:          "1px solid var(--border)",
                          color:           "var(--text-secondary)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                          e.currentTarget.style.color           = "var(--text-primary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--bg-surface)";
                          e.currentTarget.style.color           = "var(--text-secondary)";
                        }}
                      >
                        {loadingMore ? (
                          <span className="flex items-center justify-center gap-2">
                            <span
                              className="w-4 h-4 border-2 rounded-full animate-spin"
                              style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
                            />
                            Loading…
                          </span>
                        ) : (
                          "Load more confessions"
                        )}
                      </button>
                    ) : (
                      <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
                        You&apos;ve seen all confessions 👻
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══ Desktop sidebar ════════════════════════════════════════════════════ */}
      <DesktopSidebar posts={posts} onScrollToForm={handleScrollToForm} />
    </div>
  );
};

export default AnonPage;
