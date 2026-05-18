/**
 * PostForm.jsx — Post Creation Form
 *
 * Allows the logged-in user to compose and submit a new community post.
 *
 * Features:
 *  - Textarea (max 500 chars) with live descending character counter
 *  - Image attachment with local preview (before upload); cleared on post success
 *  - Anonymous toggle — when ON, posts to POST /api/anon (JSON, no image)
 *    instead of POST /api/posts (multipart/form-data)
 *  - "Post" button disabled while content is empty or submission is in-flight
 *  - On success → calls onPost(newPost) to prepend to the feed (no full reload)
 *
 * Responsive:
 *  - Mobile: full-width, flush against screen edges (px-4 internal padding only)
 *  - md+: rendered inside a white card (rounded-2xl shadow-sm border)
 *
 * Props:
 *  currentUser {Object}   — Auth user from AuthContext
 *  onPost      {function} — (newPostObj) => void — parent prepends to feed list
 */

import { useState, useRef } from "react";
import { ImagePlus, X, EyeOff, Eye } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import Avatar from "../common/Avatar.jsx";

// ─────────────────────────────────────────────────────────────────────────────
const PostForm = ({ currentUser, onPost }) => {
  const [content,   setContent]   = useState("");
  const [imageFile, setImageFile] = useState(null);   // File object
  const [imagePreview, setPreview] = useState(null);  // base64 data URL
  const [isAnon,    setIsAnon]    = useState(false);
  const [loading,   setLoading]   = useState(false);

  const fileInputRef = useRef(null);
  const MAX = 500;
  const remaining = MAX - content.length;
  const isEmpty = content.trim() === "";
  const canPost = !isEmpty && !loading;

  // ── Image selection ─────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Guard: only images
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Guard: 5 MB limit client-side for fast feedback
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Anon toggle ─────────────────────────────────────────────────────────
  const toggleAnon = () => {
    setIsAnon((v) => {
      const next = !v;
      // Anon posts have no image support — clear any attached image when enabling
      if (next) clearImage();
      return next;
    });
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canPost) return;

    setLoading(true);
    try {
      let data;

      if (isAnon) {
        // Anonymous post — JSON body, no image
        const res = await api.post("/anon", { content: content.trim() });
        data = res.data;
        toast.success("Posted anonymously to the Anon board!");
        // Anon posts don't appear in the community feed — notify parent
        // with null so FeedPage knows not to prepend it
        onPost(null, "anon");
      } else {
        // Community post — multipart/form-data (required for image upload)
        const formData = new FormData();
        formData.append("content", content.trim());
        if (imageFile) formData.append("image", imageFile);

        const res = await api.post("/posts", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        data = res.data;
        toast.success("Post shared with the community!");
        onPost(data.post, "feed");
      }

      // Reset form
      setContent("");
      clearImage();
      setIsAnon(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    /* Mobile: bare (no card chrome) — md+: card wrapper */
    <div className="
      bg-white
      md:rounded-2xl md:shadow-sm md:border md:border-gray-100
    ">
      <form onSubmit={handleSubmit} className="p-4">

        {/* ── Top row: avatar + textarea ─────────────────────────────────── */}
        <div className="flex items-start gap-3">
          <Avatar
            src={currentUser?.profilePicture}
            name={currentUser?.name ?? ""}
            size="sm"
            className="flex-shrink-0 mt-0.5"
          />

          <div className="flex-1 min-w-0">
            <textarea
              id="post-content-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX))}
              placeholder={
                isAnon
                  ? "Share something anonymously on the Anon board…"
                  : "What's on your mind?"
              }
              rows={3}
              className="
                w-full px-0 py-1
                text-sm text-gray-900 placeholder-gray-400
                bg-transparent border-none outline-none resize-none
                leading-relaxed
              "
            />

            {/* Character counter — shows at ≤ 100 remaining */}
            {remaining <= 100 && (
              <div className="flex justify-end mt-1">
                <span
                  className={`
                    text-xs tabular-nums font-medium
                    ${remaining <= 20 ? "text-red-500" : "text-gray-400"}
                  `}
                >
                  {remaining} / {MAX}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Image preview ─────────────────────────────────────────────── */}
        {imagePreview && (
          <div className="relative mt-3 ml-11">
            <img
              src={imagePreview}
              alt="Attachment preview"
              className="w-full max-h-60 object-cover rounded-xl bg-gray-100"
            />
            <button
              type="button"
              onClick={clearImage}
              aria-label="Remove image"
              className="
                absolute top-2 right-2
                flex items-center justify-center
                w-7 h-7 min-h-0 rounded-full
                bg-black/50 hover:bg-black/70
                text-white
                transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-white
              "
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <hr className="border-gray-100 mt-3" />

        {/* ── Bottom toolbar: attach + anon toggle + post button ─────────
            flex-wrap so on very small screens (<350px) it wraps cleanly   */}
        <div className="flex items-center gap-2 flex-wrap mt-3">

          {/* Image attach — hidden when anonymous (backend doesn't support it) */}
          {!isAnon && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                id={`post-image-input-${currentUser?._id}`}
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach image"
                className="
                  flex items-center gap-1.5
                  min-h-[44px] px-3 rounded-xl
                  text-sm font-medium text-gray-500
                  hover:bg-gray-100 hover:text-brand-600
                  transition-colors duration-150 active:scale-95
                  focus:outline-none focus:ring-2 focus:ring-brand-400
                "
              >
                <ImagePlus size={18} />
                <span className="hidden sm:inline">Photo</span>
              </button>
            </>
          )}

          {/* Anonymous toggle */}
          <button
            type="button"
            onClick={toggleAnon}
            aria-pressed={isAnon}
            aria-label={isAnon ? "Disable anonymous mode" : "Enable anonymous mode"}
            className={`
              flex items-center gap-1.5
              min-h-[44px] px-3 rounded-xl
              text-sm font-medium
              transition-all duration-150 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-brand-400
              ${isAnon
                ? "bg-violet-50 text-violet-700 hover:bg-violet-100"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }
            `}
          >
            {isAnon ? <EyeOff size={18} /> : <Eye size={18} />}
            <span className="hidden sm:inline">{isAnon ? "Anonymous" : "Public"}</span>

            {/* Pill indicator when active */}
            {isAnon && (
              <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full bg-violet-200 text-violet-700 text-[10px] font-semibold tracking-wide">
                ON
              </span>
            )}
          </button>

          {/* Anonymous mode info note */}
          {isAnon && (
            <p className="w-full text-[11px] text-violet-500 mt-1 pl-1">
              This post will appear on the <strong>Anon board</strong>, not the community feed.
            </p>
          )}

          {/* Post button — pushed to right */}
          <button
            type="submit"
            id="post-submit-btn"
            disabled={!canPost}
            className="
              ml-auto
              btn-primary
              px-5 py-2 text-sm
              min-h-[40px]
            "
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

export default PostForm;
