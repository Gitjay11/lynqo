/**
 * PostForm.jsx — Post Composer (Dark Theme)
 *
 * bg-zinc-900 card, bg-zinc-800 textarea area
 */

import { useState, useRef } from "react";
import { Image, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import Avatar from "../common/Avatar.jsx";

const MAX_CHARS = 500;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

// ─────────────────────────────────────────────────────────────────────────────
const PostForm = ({ currentUser, onPost }) => {
  const [content,      setContent]      = useState("");
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const fileInputRef = useRef(null);

  const remaining = MAX_CHARS - content.length;
  const canPost   = content.trim().length > 0 && !loading;

  // ── Image selection ───────────────────────────────────────────────────────
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canPost) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("content", content.trim());
      if (imageFile) fd.append("image", imageFile);

      const { data } = await api.post("/posts", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Posted!");
      onPost?.(data.post, "feed");

      setContent("");
      removeImage();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="
      bg-zinc-900
      md:rounded-2xl md:shadow-sm md:border md:border-zinc-800
    ">
      <form onSubmit={handleSubmit} className="p-4">

        {/* ── Top row: avatar + textarea ──────────────────────────────────── */}
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
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
              placeholder="What's on your mind?"
              rows={3}
              className="
                w-full px-0 py-1
                text-sm text-zinc-100 placeholder-zinc-600
                bg-transparent border-none outline-none resize-none leading-relaxed
              "
            />

            {/* Image preview */}
            {imagePreview && (
              <div className="relative mt-2 inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-40 rounded-xl object-cover border border-zinc-700"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="Remove image"
                  className="
                    absolute -top-2 -right-2
                    w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700
                    flex items-center justify-center
                    text-zinc-400 hover:text-zinc-100 transition-colors min-h-0
                  "
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            )}

            {/* Character counter */}
            <div className="flex justify-end mt-1">
              <span className={`text-xs tabular-nums font-medium ${
                remaining <= 20 ? "text-red-400"
                : remaining <= 100 ? "text-amber-400"
                : "text-zinc-600"
              }`}>
                {content.length}/{MAX_CHARS}
              </span>
            </div>
          </div>
        </div>

        {/* ── Divider ──────────────────────────────────────────────────────── */}
        <hr className="border-zinc-800 mt-3" />

        {/* ── Bottom toolbar ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mt-3">

          {/* Image attach */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
            aria-hidden="true"
          />
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

          {/* Spacer */}
          <div className="flex-1" />

          {/* Submit */}
          <button
            type="submit"
            id="post-submit-btn"
            disabled={!canPost}
            className="btn-primary px-5 py-2 text-sm min-h-[40px]"
          >
            {loading
              ? <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
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
