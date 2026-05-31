/**
 * FollowListModal.jsx — Followers / Following List Modal
 *
 * Displays a scrollable bottom-sheet style modal listing either the followers
 * or following users for any profile. Follows the Instagram-style stat pattern.
 *
 * Props:
 *  - isOpen      {boolean}  — controls visibility
 *  - onClose     {function} — called when the user dismisses the modal
 *  - title       {string}   — "Followers" or "Following"
 *  - userId      {string}   — the profile user's MongoDB ObjectId
 *  - type        {string}   — "followers" | "following"
 *
 * Behaviour:
 *  - Fetches the list lazily only when the modal is opened (isOpen changes to true)
 *  - Clicking a user card navigates to their /profile/:id route and closes modal
 *  - Escape key and backdrop click both close the modal
 *  - Scroll is locked on <body> while the modal is open
 *
 * Design:
 *  - bg-zinc-900 border border-zinc-800 rounded-2xl — per spec
 *  - Mobile-first: fixed overlay with centered card (max-w-sm on mobile, sm:max-w-md)
 *  - Touch target for each user row: min-h-[56px]
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate }                       from "react-router-dom";
import { X, Loader2, Users }                 from "lucide-react";

import api    from "../../api/axios.js";
import Avatar from "../common/Avatar.jsx";

// ─────────────────────────────────────────────────────────────────────────────
const FollowListModal = ({ isOpen, onClose, title, userId, type }) => {
  const navigate = useNavigate();

  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // ── Fetch the list whenever the modal opens ─────────────────────────────
  // `type` is either "followers" or "following" — maps directly to the API path.
  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchList = async () => {
      setLoading(true);
      setError(null);
      setUsers([]);

      try {
        const { data } = await api.get(`/users/${userId}/${type}`);
        // Both endpoints return arrays under their respective key name
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
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // ── Keyboard: close on Escape ───────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // ── Navigate to a user's profile and close the modal ───────────────────
  const handleUserClick = useCallback((userId) => {
    onClose();
    navigate(`/profile/${userId}`);
  }, [onClose, navigate]);

  // ── Do not render anything when closed ─────────────────────────────────
  if (!isOpen) return null;

  return (
    /*
      Backdrop — fixed overlay covering the full viewport.
      Clicking outside the card (on the backdrop) closes the modal.
    */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/*
        Card — stopPropagation prevents backdrop click from firing
        when the user clicks inside the card.
      */}
      <div
        className="
          relative w-full max-w-sm sm:max-w-md
          bg-zinc-900 border border-zinc-800 rounded-2xl
          flex flex-col
          max-h-[80vh]
          animate-fade-in
        "
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="
          flex items-center justify-between
          px-5 py-4
          border-b border-zinc-800
          flex-shrink-0
        ">
          <h2 className="text-base font-semibold text-zinc-50">{title}</h2>
          <button
            id="follow-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            className="
              flex items-center justify-center
              w-8 h-8 rounded-full
              text-zinc-400 hover:text-zinc-200
              hover:bg-zinc-800
              transition-colors duration-150
            "
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Body — scrollable user list ──────────────────────────────── */}
        <div className="overflow-y-auto flex-1 overscroll-contain">

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-zinc-500" />
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 gap-3">
              <Users size={32} className="text-zinc-700" />
              <p className="text-sm text-zinc-500">
                {type === "followers" ? "No followers yet." : "Not following anyone yet."}
              </p>
            </div>
          )}

          {/* User list */}
          {!loading && !error && users.length > 0 && (
            <ul className="divide-y divide-zinc-800/60">
              {users.map((person) => (
                <li key={person._id}>
                  <button
                    onClick={() => handleUserClick(person._id)}
                    className="
                      w-full flex items-center gap-3
                      px-5 py-3.5 min-h-[56px]
                      hover:bg-zinc-800/60 active:bg-zinc-800
                      transition-colors duration-150
                      text-left
                    "
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
                      <p className="text-sm font-semibold text-zinc-100 truncate">
                        {person.name}
                      </p>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {[person.branch, person.semester && `Sem ${person.semester}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

        </div>
        {/* ── END body ──────────────────────────────────────────────────── */}

      </div>
    </div>
  );
};

export default FollowListModal;
