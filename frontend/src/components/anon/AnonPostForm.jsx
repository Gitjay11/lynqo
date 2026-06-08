/**
 * AnonPostForm.jsx — Anonymous Post Composer (Themed)
 *
 * bg-bg-surface card, transparent textarea.
 * PRIVACY: does not show any author attribution.
 */

import { useState, useRef } from "react";
import { Ghost, Image, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";

const MAX_CHARS       = 500;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// ─────────────────────────────────────────────────────────────────────────────
const AnonPostForm = ({ onPost }) => {
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
    if (!file.type.startsWith("image/")) { toast.error("Only image files are allowed."); return; }
    if (file.size > MAX_IMAGE_BYTES)     { toast.error("Image must be under 5 MB.");     return; }
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

      const { data } = await api.post("/anon", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Posted anonymously!");
      onPost?.(data.post, "anon");
      setContent("");
      removeImage();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        border:          "1px solid var(--border)",
      }}
      className="md:rounded-2xl md:shadow-sm"
    >
      <form onSubmit={handleSubmit} className="p-4">

        {/* ── Top row: ghost + textarea ─────────────────────────────────────── */}
        <div className="flex items-start gap-3">
          {/* Ghost icon */}
          <div
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full mt-0.5"
            style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-muted)" }}
          >
            <Ghost size={16} />
          </div>

          {/* Textarea + preview */}
          <div className="flex-1 min-w-0">
            <textarea
              id="anon-content-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
              placeholder="What's on your mind? Your identity stays hidden."
              rows={3}
              style={{ color: "var(--text-primary)" }}
              className="
                w-full px-0 py-1
                bg-transparent border-none outline-none resize-none leading-relaxed
                text-sm
              "
            />

            {/* Image preview */}
            {imagePreview && (
              <div className="relative mt-2 inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-40 rounded-xl object-cover"
                  style={{ border: "1px solid var(--border)" }}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="Remove image"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border:          "1px solid var(--border)",
                    color:           "var(--text-secondary)",
                  }}
                  className="
                    absolute -top-2 -right-2
                    w-6 h-6 rounded-full
                    flex items-center justify-center
                    transition-colors min-h-0
                  "
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            )}

            {/* Char counter */}
            <div className="flex justify-end mt-1">
              <span
                className={`text-xs tabular-nums font-medium ${
                  remaining <= 20 ? "text-red-500" : remaining <= 100 ? "text-amber-500" : ""
                }`}
                style={remaining > 100 ? { color: "var(--text-muted)" } : {}}
              >
                {content.length}/{MAX_CHARS}
              </span>
            </div>
          </div>
        </div>

        <hr className="mt-3" style={{ borderColor: "var(--border)" }} />

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
            style={{ color: "var(--text-secondary)" }}
            className="p-2 rounded-xl min-h-0 hover:bg-bg-elevated transition-colors duration-150 focus:outline-none focus:ring-2"
          >
            <Image size={18} />
          </button>

          {/* Ghost note */}
          <p className="text-xs ml-1 select-none" style={{ color: "var(--text-muted)" }}>
            👻 Your identity stays hidden
          </p>

          <div className="flex-1" />

          <button
            type="submit"
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

export default AnonPostForm;
