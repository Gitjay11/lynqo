/**
 * TrendingWidget.jsx — Right Sidebar Widget (Desktop lg+ only)
 *
 * Shown in the right column of the lg+ two-column FeedPage grid.
 * Hidden on mobile/tablet — the parent (FeedPage) gates it with
 * `hidden lg:block` so this component renders freely without media queries.
 *
 * Sections:
 *  1. Active Students — top 5 unique post authors from the latest 20 posts
 *     (derived from GET /api/posts?page=1&limit=20, no extra endpoint needed)
 *  2. Quick Links     — internal navigation shortcuts for common actions
 *
 * Design tokens used:
 *  - .card                → bg-white rounded-2xl shadow-sm border border-gray-100 p-4
 *  - brand-* colors       → defined in tailwind.config.js
 *  - text-sm / text-xs    → consistent type scale
 *
 * Accessibility:
 *  - <nav aria-label> wraps the quick-links list
 *  - Profile links carry descriptive aria-labels
 *  - Spinner has aria-hidden (decorative)
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, EyeOff, TrendingUp, Users, Flame } from "lucide-react";
import api from "../../api/axios.js";
import Avatar from "../common/Avatar.jsx";

// ─────────────────────────────────────────────────────────────────────────────
const TrendingWidget = () => {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Derive top contributors from recent posts ─────────────────────────────
  // We reuse the existing GET /api/posts endpoint — no new backend work needed.
  // We take the 20 most recent posts and extract up to 5 unique authors, in
  // the order they first appear (most recent poster listed first).
  useEffect(() => {
    let mounted = true;

    const fetchContributors = async () => {
      try {
        const { data } = await api.get("/posts?page=1&limit=20");
        if (!mounted) return;

        // Deduplicate authors by _id, preserving first-appearance order
        const seen = new Set();
        const unique = [];

        for (const post of data.posts ?? []) {
          const author = post.author;
          if (!author?._id) continue;

          const id = author._id.toString();
          if (!seen.has(id)) {
            seen.add(id);
            unique.push({
              _id: id,
              name: author.name,
              branch: author.branch,
              profilePicture: author.profilePicture,
            });
          }

          if (unique.length >= 5) break;
        }

        setContributors(unique);
      } catch {
        // Fail silently — the widget is non-critical, don't distract the user
        setContributors([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchContributors();
    return () => { mounted = false; };
  }, []);

  // ── Quick links definition ─────────────────────────────────────────────────
  const quickLinks = [
    {
      to: "/anon",
      icon: EyeOff,
      label: "Anon Board",
      description: "Post anonymously",
      color: "text-violet-600",
      bg: "bg-violet-50 hover:bg-violet-100",
    },
    {
      to: "/chat",
      icon: MessageCircle,
      label: "Messages",
      description: "Chat with students",
      color: "text-brand-600",
      bg: "bg-brand-50 hover:bg-brand-100",
    },
  ];

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Section 1: Active Students ──────────────────────────────────────── */}
      <section
        aria-labelledby="active-students-heading"
        className="card p-0 overflow-hidden"
      >
        {/* Card header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-50">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50">
            <Flame size={14} className="text-amber-500" />
          </span>
          <h2
            id="active-students-heading"
            className="text-sm font-semibold text-gray-800"
          >
            Active Students
          </h2>
        </div>

        {/* Content */}
        <div className="px-4 py-3 space-y-3">
          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <span
                aria-hidden="true"
                className="w-5 h-5 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin"
              />
            </div>
          )}

          {/* Empty state — no posts yet */}
          {!loading && contributors.length === 0 && (
            <div className="flex flex-col items-center gap-1.5 py-4 text-center">
              <Users size={20} className="text-gray-300" />
              <p className="text-xs text-gray-400">
                No activity yet. Be the first to post!
              </p>
            </div>
          )}

          {/* Contributor rows */}
          {!loading && contributors.map((user) => (
            <Link
              key={user._id}
              to={`/profile/${user._id}`}
              aria-label={`View ${user.name}'s profile`}
              className="
                flex items-center gap-2.5
                group rounded-xl px-2 py-1.5 -mx-2
                hover:bg-gray-50 active:bg-gray-100
                transition-colors duration-150
              "
            >
              {/* Avatar */}
              <Avatar
                src={user.profilePicture}
                name={user.name ?? ""}
                size="xs"
                className="flex-shrink-0"
              />

              {/* Name + branch */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate leading-tight group-hover:text-brand-600 transition-colors duration-150">
                  {user.name}
                </p>
                {user.branch && (
                  <p className="text-[10px] text-gray-400 truncate leading-tight mt-0.5">
                    {user.branch}
                  </p>
                )}
              </div>

              {/* Subtle chevron hint */}
              <span className="text-gray-300 text-xs group-hover:text-brand-400 transition-colors duration-150 flex-shrink-0">
                →
              </span>
            </Link>
          ))}
        </div>

        {/* Footer link */}
        {!loading && contributors.length > 0 && (
          <div className="px-4 pb-3">
            <p className="text-[10px] text-gray-400 text-center">
              Based on recent community posts
            </p>
          </div>
        )}
      </section>

      {/* ── Section 2: Quick Links ──────────────────────────────────────────── */}
      <section
        aria-labelledby="quick-links-heading"
        className="card p-0 overflow-hidden"
      >
        {/* Card header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-50">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50">
            <TrendingUp size={14} className="text-brand-500" />
          </span>
          <h2
            id="quick-links-heading"
            className="text-sm font-semibold text-gray-800"
          >
            Quick Links
          </h2>
        </div>

        {/* Links */}
        <nav aria-label="Campus quick links" className="px-3 py-3 space-y-1.5">
          {quickLinks.map(({ to, icon: Icon, label, description, color, bg }) => (
            <Link
              key={to}
              to={to}
              className={`
                flex items-center gap-3
                px-3 py-2.5 rounded-xl
                ${bg}
                transition-colors duration-150
                group
              `}
            >
              <span className={`flex-shrink-0 ${color}`}>
                <Icon size={16} />
              </span>
              <div className="min-w-0">
                <p className={`text-xs font-semibold ${color} leading-tight`}>
                  {label}
                </p>
                <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                  {description}
                </p>
              </div>
            </Link>
          ))}
        </nav>
      </section>

    </div>
  );
};

export default TrendingWidget;
