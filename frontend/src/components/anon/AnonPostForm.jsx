/**
 * AnonPostForm.jsx — Anonymous Post Composer
 *
 * A stripped-down version of PostForm purpose-built for the Anon board:
 *  - No image attachment (backend anon endpoint is text-only)
 *  - No anonymous toggle — everything posted here is anonymous by definition
 *  - Posts to POST /api/anon (JSON body, not multipart)
 *  - 500-char textarea with live descending counter
 *  - "Post" button disabled while empty or loading
 *  - On success → calls onPost(newPost) so AnonPage can prepend to feed
 *
 * Responsive:
 *  - Mobile: full-width, no card chrome (px-4 internal only)
 *  - md+: white card, rounded-2xl shadow-sm border
 *
 * Props:
 *  currentUser {Object}   — Auth user from AuthContext (avatar + name only)
 *  onPost      {function} — (newAnonPost) => void — parent prepends to list
 */

import { useState } from "react";
import { EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import Avatar from "../common/Avatar.jsx";

// ─────────────────────────────────────────────────────────────────────────────
const AnonPostForm = ({ currentUser, onPost }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const MAX       = 500;
  const remaining = MAX - content.length;
  const isEmpty   = content.trim() === "";
  const canPost   = !isEmpty && !loading;

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canPost) return;

    setLoading(true);
    try {
      const { data } = await api.post("/anon", { content: content.trim() });
      toast.success("Posted anonymously!");
      setContent("");
      onPost(data.post);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    /* Mobile: bare — md+: card wrapper */
    <div className="
      bg-zinc-900
      md:rounded-2xl md:shadow-sm md:border md:border-zinc-800
    ">
      <form onSubmit={handleSubmit} className="p-4">

        {/* ── Anon identity banner ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="
            flex items-center gap-1.5
            text-[11px] font-medium text-violet-600
            bg-violet-600/10 rounded-full px-2.5 py-1
          ">
            <EyeOff size={11} />
            Posting as Anonymous
          </span>
          <p className="text-[11px] text-zinc-500 leading-tight">
            Your identity is always hidden
          </p>
        </div>

        {/* ── Top row: avatar + textarea ──────────────────────────────────── */}
        <div className="flex items-start gap-3">
          {/*
           * We show the user's own avatar so they have a visual anchor,
           * but on the published card this is replaced with the ghost icon.
           * This is purely a local composer affordance.
           */}
          <Avatar
            src={currentUser?.profilePicture}
            name={currentUser?.name ?? ""}
            size="sm"
            className="flex-shrink-0 mt-0.5 opacity-40"
          />

          <div className="flex-1 min-w-0">
            <textarea
              id="anon-post-content-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX))}
              placeholder="Share something anonymously…"
              rows={3}
              className="
                w-full px-0 py-1
                text-sm text-zinc-100 placeholder-zinc-500
                bg-transparent border-none outline-none resize-none
                leading-relaxed
              "
            />

            {/* ── Character counter — always visible, 3-stage color ─────── */}
            <div className="flex justify-end mt-1">
              <span
                className={`
                  text-xs tabular-nums font-medium
                  ${
                    remaining <= 20
                      ? "text-red-500"      // danger — almost out
                      : remaining <= 100
                      ? "text-amber-500"    // warning — getting close
                      : "text-zinc-500"     // safe — plenty left
                  }
                `}
                aria-live="polite"
                aria-label={`${remaining} characters remaining`}
              >
                {content.length}/{MAX}
              </span>
            </div>
          </div>
        </div>

        {/* ── Divider ──────────────────────────────────────────────────────── */}
        <hr className="border-zinc-800 mt-3" />

        {/* ── Bottom toolbar ───────────────────────────────────────────────── */}
        <div className="flex items-center mt-3">
          <p className="text-xs text-zinc-500 flex-1">
            Posts on the Anon board are visible to all campus members
          </p>

          <button
            type="submit"
            id="anon-post-submit-btn"
            disabled={!canPost}
            className="ml-4 btn-primary px-5 py-2 text-sm min-h-[40px]"
          >
            {loading
              ? <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Posting…
                </span>
              : "Post"
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnonPostForm;
