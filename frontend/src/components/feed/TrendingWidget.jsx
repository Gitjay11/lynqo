/**
 * TrendingWidget.jsx — Right Sidebar Trending Widget (Themed)
 *
 * bg-bg-surface card, border-app-border, accent for active elements
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

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="card p-5 flex items-center justify-center min-h-[120px]">
      <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-secondary)" }} />
    </div>
  );

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) return (
    <div className="card p-5 flex flex-col items-center gap-3">
      <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>{error}</p>
      <button
        onClick={fetchData}
        className="text-xs flex items-center gap-1.5 min-h-0 transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--text-secondary)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
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
          <div
            className="flex items-center gap-2 px-4 pt-4 pb-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <TrendingUp size={15} style={{ color: "var(--text-secondary)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Trending</h2>
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
                    transition-colors duration-100 text-left
                  "
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-elevated)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    #{tag.name}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{tag.count} posts</span>
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
          <div
            className="flex items-center gap-2 px-4 pt-4 pb-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <Users size={15} className="text-app-success" style={{ color: "var(--success)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Active Students</h2>
          </div>

          {/* User rows */}
          <ul>
            {data.activeUsers.slice(0, 5).map((u) => (
              <li key={u._id}>
                <button
                  onClick={() => navigate(`/profile/${u._id}`)}
                  className="
                    w-full flex items-center gap-3 px-4 py-2.5 min-h-0
                    transition-colors duration-100 text-left
                  "
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-elevated)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
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
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{u.name}</p>
                    {u.branch && (
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{u.branch}</p>
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
