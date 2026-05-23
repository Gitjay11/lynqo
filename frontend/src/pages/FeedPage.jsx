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
 * Data strategy:
 *  - GET /api/posts?page=1&limit=10 on mount
 *  - "Load more" button fetches page N+1 and appends to list
 *  - New posts from PostForm are prepended to the list (no refetch)
 *
 * Imports:
 *  - date-fns is already used in child components; no extra dep needed here
 */

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Newspaper } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import { useAuth } from "../hooks/useAuth.js";
import PostForm from "../components/feed/PostForm.jsx";
import PostCard from "../components/feed/PostCard.jsx";
import PostCardSkeleton from "../components/common/PostCardSkeleton.jsx";
import TrendingWidget from "../components/feed/TrendingWidget.jsx";

// ─────────────────────────────────────────────────────────────────────────────
const FeedPage = () => {
  const { user } = useAuth();

  const [posts,      setPosts]      = useState([]);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);   // initial load
  const [loadingMore, setLoadingMore] = useState(false); // pagination
  const [error,      setError]      = useState(null);

  // ── Fetch page of posts ────────────────────────────────────────────────────
  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      const { data } = await api.get(`/posts?page=${pageNum}&limit=10`);

      setPosts((prev) =>
        append ? [...prev, ...data.posts] : data.posts
      );
      setTotalPages(data.totalPages);
      setPage(pageNum);
      setError(null);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load posts";
      setError(msg);
      if (!append) toast.error(msg); // only toast on initial load failure
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

  // ── Load more (pagination) ─────────────────────────────────────────────────
  const handleLoadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await fetchPosts(page + 1, true);
    setLoadingMore(false);
  };

  // ── Handle new post from PostForm ──────────────────────────────────────────
  // onPost(newPost, type):
  //   type === "feed" → prepend to list
  //   type === "anon" → do nothing (anon posts appear on /anon, not here)
  const handleNewPost = useCallback((newPost, type) => {
    if (type === "feed" && newPost) {
      setPosts((prev) => [newPost, ...prev]);
    }
    // anon: no-op on this page — PostForm already showed a toast
  }, []);

  // ── Handle post deletion ───────────────────────────────────────────────────
  const handleDeletePost = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  return (
    /*
     * Outer wrapper — centers and constrains width on md+
     * On lg+ switches to a two-column grid
     */
    <div className="
      w-full min-h-screen
      /* md: single centered column */
      md:max-w-2xl md:mx-auto md:px-4 md:py-4
      /* lg: two-column grid — feed left, widget right */
      lg:max-w-none lg:px-6 lg:py-6
      lg:grid lg:grid-cols-[1fr_288px] lg:gap-6
      lg:items-start
    ">

      {/* ── Main feed column ─────────────────────────────────────────────── */}
      <div className="min-w-0 space-y-0 md:space-y-3">

        {/* ── Post composer ───────────────────────────────────────────────── */}
        <PostForm currentUser={user} onPost={handleNewPost} />

        {/* ── Feed divider (mobile only) ──────────────────────────────────── */}
        <div className="md:hidden h-2 bg-zinc-900" aria-hidden="true" />

        {/* ── Feed states ─────────────────────────────────────────────────── */}

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
            <p className="text-sm text-zinc-500 text-center">{error}</p>
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
            {/* Icon composition */}
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-1">
              <Newspaper size={28} className="text-brand-400" />
            </div>
            <p className="text-base font-semibold text-zinc-100">
              No posts yet
            </p>
            <p className="text-sm text-zinc-400 max-w-[240px] leading-relaxed">
              Be the first to post something!
            </p>
          </div>
        )}

        {/* ── Post list ────────────────────────────────────────────────────── */}
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

            {/* ── Load more ────────────────────────────────────────────────── */}
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
                        <span className="w-4 h-4 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
                        Loading…
                      </>
                    : "Load more posts"
                  }
                </button>
              ) : (
                <p className="text-xs text-zinc-500">
                  You've reached the end of the feed 🎉
                </p>
              )}
            </div>
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
