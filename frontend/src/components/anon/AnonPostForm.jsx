/**
 * AnonPostForm.jsx — Anonymous Post Composer
 *
 * Stripped-down composer for the Anon board:
 *  - No anonymous toggle — everything posted here is anonymous by definition
 *  - Posts to POST /api/anon as multipart/form-data (image is optional)
 *  - 500-char textarea with live descending counter
 *  - Optional image attachment (2 MB limit, image/* only, client-validated)
 *  - Image preview shown below textarea with X button to remove
 *  - "Post" button disabled while empty or loading
 *  - On success → calls onPost(newPost) so AnonPage can prepend to feed
 *
 * Responsive:
 *  - Mobile: full-width, no card chrome (px-4 internal only)
 *  - md+: dark card, rounded-2xl shadow-sm border
 *
 * Props:
 *  currentUser {Object}   — Auth user from AuthContext (avatar + name only)
 *  onPost      {function} — (newAnonPost) => void — parent prepends to list
 */

import { useState, useRef } from "react";
import { EyeOff, Image, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import Avatar from "../common/Avatar.jsx";

const MAX_CHARS      = 500;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB — stricter than regular posts

// ─────────────────────────────────────────────────────────────────────────────
const AnonPostForm = ({ currentUser, onPost }) => {
  const [content,      setContent]      = useState("");
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const fileInputRef = useRef(null);

  const remaining = MAX_CHARS - content.length;
  const isEmpty   = content.trim() === "";
  const canPost   = !isEmpty && !loading;

  // ── Image selection ────────────────────────────────────────────────────────
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side type guard
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      e.target.value = "";
      return;
    }

    // Client-side size guard — 2 MB cap for anon posts
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be under 2 MB.");
      e.target.value = "";
      return;
    }

    // Revoke any previous preview URL to avoid memory leaks
    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = ""; // reset so same file can be re-selected if needed
  };

  // ── Remove selected image ──────────────────────────────────────────────────
  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  // Always sends multipart/form-data so the backend uploadPostImage middleware
  // can handle the optional file. Multer skips silently when no file is sent.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canPost) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("content", content.trim());
      if (imageFile) fd.append("image", imageFile);

      const { data } = await api.post("/anon", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Posted anonymously!");
      setContent("");
      removeImage();
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
            text-[11px] font-medium text-zinc-400
            bg-zinc-800 rounded-full px-2.5 py-1
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
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Share something anonymously…"
              rows={3}
              className="
                w-full px-0 py-1
                text-sm text-zinc-100 placeholder-zinc-500
                bg-transparent border-none outline-none resize-none
                leading-relaxed
              "
            />

            {/* ── Image preview — shown after file selection ──────────────── */}
            {imagePreview && (
              <div className="relative mt-2 inline-block">
                <img
                  src={imagePreview}
                  alt="Attachment preview"
                  className="max-h-40 rounded-xl object-cover border border-zinc-700"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="Remove image"
                  className="
                    absolute -top-2 -right-2
                    w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700
                    flex items-center justify-center min-h-0
                    text-zinc-400 hover:text-zinc-100 transition-colors
                  "
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            )}

            {/* ── Character counter — always visible, 3-stage colour ──────── */}
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
                {content.length}/{MAX_CHARS}
              </span>
            </div>
          </div>
        </div>

        {/* ── Divider ──────────────────────────────────────────────────────── */}
        <hr className="border-zinc-800 mt-3" />

        {/* ── Bottom toolbar ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mt-3">

          {/* Hidden file input — triggered by the image button below */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
            aria-hidden="true"
          />

          {/* Image attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach image"
            className="
              p-2 rounded-xl min-h-0
              text-zinc-500 hover:bg-zinc-800 hover:text-white
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-zinc-400
            "
          >
            <Image size={18} />
          </button>

          <div className="flex-1" />

          <button
            type="submit"
            id="anon-post-submit-btn"
            disabled={!canPost}
            className="ml-2 btn-primary px-5 py-2 text-sm min-h-[40px]"
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
