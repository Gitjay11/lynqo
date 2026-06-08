/**
 * FollowListModal.jsx — Followers / Following List Modal (Redesigned)
 *
 * Mobile:  full-height bottom sheet — fixed inset-x-0 bottom-0, rounded-t-2xl
 * Desktop: centered dialog — fixed inset-0 flex items-center justify-center
 *
 * Features:
 *  - Client-side search filter (no extra API call)
 *  - Redesigned user rows with bg-elevated card style
 *  - Ghost empty state
 *  - Backdrop click + Escape key to close
 *  - Body scroll lock while open
 *
 * Props (unchanged):
 *  - isOpen      {boolean}
 *  - onClose     {function}
 *  - title       {string}   — "Followers" | "Following"
 *  - userId      {string}
 *  - type        {string}   — "followers" | "following"
 *
 * API calls unchanged: GET /api/users/:userId/followers  |  /following
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate }                       from "react-router-dom";
import { X, Loader2, Users }                 from "lucide-react";
import api    from "../../api/axios.js";
import Avatar from "../common/Avatar.jsx";

// ─────────────────────────────────────────────────────────────────────────────
const FollowListModal = ({ isOpen, onClose, title, userId, type }) => {
  const navigate = useNavigate();

  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Fetch list whenever the modal opens ─────────────────────────────────
  useEffect(() => {
    if (!isOpen || !userId) return;
    setSearchQuery("");

    const fetchList = async () => {
      setLoading(true);
      setError(null);
      setUsers([]);
      try {
        const { data } = await api.get(`/users/${userId}/${type}`);
        setUsers(data[type] ?? []);
      } catch (err) {
        setError(err.response?.data?.message ?? "Failed to load list.");
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [isOpen, userId, type]);

  // ── Lock body scroll while open ─────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // ── Keyboard: close on Escape ───────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // ── Navigate to profile ─────────────────────────────────────────────────
  const handleUserClick = useCallback((uid) => {
    onClose();
    navigate(`/profile/${uid}`);
  }, [onClose, navigate]);

  if (!isOpen) return null;

  // ── Client-side filtered list ───────────────────────────────────────────
  const filtered = searchQuery.trim().length > 0
    ? users.filter((u) =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.branch?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Backdrop ───────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Modal — bottom sheet on mobile, centered on md+ ───────────── */}
      <div
        className="
          fixed inset-x-0 bottom-0 z-50
          md:inset-0 md:flex md:items-center md:justify-center md:p-4
        "
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="
            relative w-full
            md:max-w-md md:rounded-2xl
            rounded-t-2xl
            flex flex-col
            max-h-[85vh]
            animate-fade-in
          "
          style={{
            backgroundColor: "var(--bg-surface)",
            border:          "1px solid var(--border)",
          }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              {title}
            </h2>
            <button
              id="follow-modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
              className="
                flex items-center justify-center
                w-8 h-8 rounded-lg min-h-0
                transition-colors duration-150
                focus:outline-none
              "
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                e.currentTarget.style.color           = "var(--text-primary)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color           = "var(--text-secondary)";
              }}
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* ── Search ──────────────────────────────────────────────────── */}
          <div className="px-4 pt-3 pb-2 flex-shrink-0">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full px-4 py-2 rounded-xl text-sm
                outline-none transition-colors duration-150
              "
              style={{
                backgroundColor: "var(--bg-elevated)",
                border:          "1px solid var(--border)",
                color:           "var(--text-primary)",
              }}
              onFocus={e  => e.currentTarget.style.borderColor = "var(--accent)"}
              onBlur={e   => e.currentTarget.style.borderColor = "var(--border)"}
            />
          </div>

          {/* ── Body — scrollable ────────────────────────────────────────── */}
          <div className="overflow-y-auto flex-1 overscroll-contain px-4 pb-4 space-y-2">

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {/* Empty state — no users or search yields nothing */}
            {!loading && !error && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Users size={32} style={{ color: "var(--text-muted)" }} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {searchQuery.trim()
                    ? "No results found"
                    : type === "followers"
                      ? "No followers yet"
                      : "Not following anyone yet"
                  }
                </p>
              </div>
            )}

            {/* User list */}
            {!loading && !error && filtered.length > 0 && filtered.map((person) => (
              <button
                key={person._id}
                onClick={() => handleUserClick(person._id)}
                className="
                  w-full flex items-center gap-3 p-3
                  rounded-xl min-h-[56px]
                  transition-all duration-150
                  text-left focus:outline-none
                "
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  border:          "1px solid transparent",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar
                    src={person.profilePicture || null}
                    name={person.name}
                    size="sm"
                  />
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                    {person.name}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {[person.branch, person.semester && `Sem ${person.semester}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </button>
            ))}

          </div>
        </div>
      </div>
    </>
  );
};

export default FollowListModal;
