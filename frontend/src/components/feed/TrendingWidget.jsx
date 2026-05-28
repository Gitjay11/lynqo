/**
 * TrendingWidget.jsx — Right Sidebar Trending Widget (Dark Theme)
 *
 * bg-zinc-900 card, zinc-800 borders, violet accents
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Users, Loader2, RefreshCw } from "lucide-react";
import api from "../../api/axios.js";
import Avatar from "../common/Avatar.jsx";
import OnlineDot from "./../../components/chat/OnlineDot.jsx";

// ─────────────────────────────────────────────────────────────────────────────
const TrendingWidget = () => {
  const navigate = useNavigate();
  const [data,    setData]    = useState({ trending: [], activeUsers: [] });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get("/posts/trending");
      setData({
        trending:    res.trending    ?? [],
        activeUsers: res.activeUsers ?? [],
      });
    } catch {
      setError("Couldn't load trending data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="card p-5 flex items-center justify-center min-h-[120px]">
      <Loader2 size={20} className="animate-spin text-zinc-400" />
    </div>
  );

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) return (
    <div className="card p-5 flex flex-col items-center gap-3">
      <p className="text-sm text-zinc-500 text-center">{error}</p>
      <button
        onClick={fetchData}
        className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 min-h-0"
      >
        <RefreshCw size={12} /> Retry
      </button>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Trending Tags ──────────────────────────────────────────────────── */}
      {data.trending.length > 0 && (
        <div className="card p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-zinc-800">
            <TrendingUp size={15} className="text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Trending</h2>
          </div>

          {/* Tag rows */}
          <ul>
            {data.trending.slice(0, 5).map((tag, i) => (
              <li key={tag.name ?? i}>
                <button
                  onClick={() => navigate(`/feed?tag=${encodeURIComponent(tag.name)}`)}
                  className="
                    w-full flex items-center justify-between
                    px-4 py-2.5 min-h-0
                    hover:bg-zinc-800 transition-colors duration-100 text-left
                    border-b border-zinc-800/50 last:border-b-0
                  "
                >
                  <span className="text-sm font-medium text-zinc-300">
                    #{tag.name}
                  </span>
                  <span className="text-xs text-zinc-600">{tag.count} posts</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Active Students ────────────────────────────────────────────────── */}
      {data.activeUsers.length > 0 && (
        <div className="card p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-zinc-800">
            <Users size={15} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Active Students</h2>
          </div>

          {/* User rows */}
          <ul>
            {data.activeUsers.slice(0, 5).map((u) => (
              <li key={u._id}>
                <button
                  onClick={() => navigate(`/profile/${u._id}`)}
                  className="
                    w-full flex items-center gap-3 px-4 py-2.5 min-h-0
                    hover:bg-zinc-800 transition-colors duration-100 text-left
                    border-b border-zinc-800/50 last:border-b-0
                  "
                >
                  <div className="relative flex-shrink-0">
                    <Avatar src={u.profilePicture} name={u.name} size="sm" />
                    <OnlineDot
                      userId={u._id}
                      size="sm"
                      className="absolute -bottom-0.5 -right-0.5"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">{u.name}</p>
                    {u.branch && (
                      <p className="text-xs text-zinc-600 truncate">{u.branch}</p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
};

export default TrendingWidget;
