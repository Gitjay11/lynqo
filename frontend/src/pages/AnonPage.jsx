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
 * Responsive layout (identical to FeedPage):
 *  Mobile  (default): single column, full width, pb-16 bottom clearance
 *  md (768px+):       max-w-xl centered container
 *  lg (1024px+):      two-column CSS grid [1fr / 288px] — right sidebar visible
 *
 * Security note:
 *  This component NEVER receives or stores any real author data.
 *  The backend enforces this at the query level (realAuthor: select:false).
 *  This component enforces it at the UI level by using AnonPostCard which
 *  has no concept of author identity.
 */

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Ghost, ShieldCheck, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import { useAuth } from "../hooks/useAuth.js";
import AnonPostForm from "../components/anon/AnonPostForm.jsx";
import AnonPostCard from "../components/anon/AnonPostCard.jsx";
import PostCardSkeleton from "../components/common/PostCardSkeleton.jsx";

// ── Right sidebar info widget (lg+ only) ────────────────────────────────────
const AnonInfoWidget = () => (
  <aside className="hidden lg:block sticky top-20 space-y-4" aria-label="About the Anon Board">
    <div className="card p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-50">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-50">
          <Ghost size={14} className="text-violet-500" />
        </span>
        <h2 className="text-sm font-semibold text-gray-800">About Anon Board</h2>
      </div>

      {/* Rules */}
      <ul className="px-4 py-4 space-y-3">
        {[
          {
            icon: EyeOff,
            color: "text-violet-500",
            bg: "bg-violet-50",
            title: "Your identity is hidden",
            desc: "Nobody, not even admins, can see who posted what on this board.",
          },
          {
            icon: ShieldCheck,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
            title: "Auto-moderation",
            desc: "Posts reported by 5+ users are automatically hidden to keep things safe.",
          },
          {
            icon: RefreshCw,
            color: "text-brand-500",
            bg: "bg-brand-50",
            title: "Newest first",
            desc: "The feed shows the most recent posts at the top.",
          },
        ].map(({ icon: Icon, color, bg, title, desc }) => (
          <li key={title} className="flex items-start gap-3">
            <span className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg ${bg} ${color} mt-0.5`}>
              <Icon size={13} />
            </span>
            <div>
              <p className="text-xs font-semibold text-gray-700 leading-tight">{title}</p>
              <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{desc}</p>
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

  const [posts,       setPosts]       = useState([]);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState(null);

  // ── Fetch a page of anon posts ───────────────────────────────────────────
  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      const { data } = await api.get(`/anon?page=${pageNum}&limit=10`);
      setPosts((prev) =>
        append ? [...prev, ...data.posts] : data.posts
      );
      setTotalPages(data.totalPages);
      setPage(pageNum);
      setError(null);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load posts";
      setError(msg);
      if (!append) toast.error(msg);
    }
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────────
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

  // ── Pagination ───────────────────────────────────────────────────────────
  const handleLoadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await fetchPosts(page + 1, true);
    setLoadingMore(false);
  };

  // ── Prepend newly created anon post ─────────────────────────────────────
  const handleNewPost = useCallback((newPost) => {
    if (newPost) setPosts((prev) => [newPost, ...prev]);
  }, []);

  // ── Remove a post from list when it gets hidden (auto-moderation) ────────
  const handlePostHidden = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  return (
    /*
     * Outer wrapper — same responsive grid as FeedPage.
     * Mobile: single column. md: centered. lg: two-column.
     */
    <div className="
      w-full min-h-screen
      md:max-w-2xl md:mx-auto md:px-4 md:py-4
      lg:max-w-none lg:px-6 lg:py-6
      lg:grid lg:grid-cols-[1fr_288px] lg:gap-6
      lg:items-start
    ">

      {/* ── Main anon feed column ──────────────────────────────────────────── */}
      <div className="min-w-0 space-y-0 md:space-y-3">

        {/* ── Page header (mobile only — lg: visible in sidebar widget) ─────── */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 lg:hidden">
          <Ghost size={16} className="text-violet-500 flex-shrink-0" />
          <div>
            <h1 className="text-base font-semibold text-gray-900 leading-tight">
              Anon Board
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Post freely — your identity is always hidden
            </p>
          </div>
        </div>

        {/* ── Composer ─────────────────────────────────────────────────────── */}
        <AnonPostForm currentUser={user} onPost={handleNewPost} />

        {/* ── Visual separator (mobile only) ──────────────────────────────── */}
        <div className="md:hidden h-2 bg-gray-50" aria-hidden="true" />

        {/* ── Feed states ──────────────────────────────────────────────────── */}

        {/* ── Loading skeleton — 3 shimmer cards while data fetches ────────── */}
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
            <p className="text-sm text-gray-500 text-center">{error}</p>
            <button
              onClick={() => fetchPosts(1, false)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!loading && !error && posts.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 px-4 text-center">
            {/* Ghost icon with violet tint — on-brand for the anon board */}
            <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center mb-1">
              <Ghost size={28} className="text-violet-400" />
            </div>
            <p className="text-base font-semibold text-gray-800">
              No confessions yet
            </p>
            <p className="text-sm text-gray-400 max-w-[240px] leading-relaxed">
              You go first.
            </p>
          </div>
        )}

        {/* ── Post list ────────────────────────────────────────────────────── */}
        {!loading && posts.length > 0 && (
          <>
            <ul className="space-y-0 md:space-y-3" aria-label="Anonymous community board">
              {posts.map((post) => (
                <li key={post._id}>
                  <AnonPostCard
                    post={post}
                    currentUser={user}
                    onHidden={handlePostHidden}
                  />
                </li>
              ))}
            </ul>

            {/* ── Load more ─────────────────────────────────────────────── */}
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
                        <span className="w-4 h-4 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
                        Loading…
                      </>
                    : "Load more posts"
                  }
                </button>
              ) : (
                <p className="text-xs text-gray-400">
                  You've reached the end of the Anon board 👻
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Right sidebar — lg+ only ─────────────────────────────────────── */}
      <AnonInfoWidget />

    </div>
  );
};

export default AnonPage;
