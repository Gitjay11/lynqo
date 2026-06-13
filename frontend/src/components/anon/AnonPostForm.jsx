/**
 * AnonPostForm.jsx — Anonymous Post Composer (Redesigned)
 *
 * Visual redesign: accent gradient top line, ghost emoji avatar, ShieldCheck
 * disclaimer, ImagePlus attach button, 3-tier character counter.
 *
 * All API calls preserved exactly:
 *   POST /api/anon   — multipart/form-data with content + optional image
 */

import { useState, useRef } from "react";
import { ImagePlus, X, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import Button from "../common/Button.jsx";

const MAX_CHARS       = 500;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

// ─────────────────────────────────────────────────────────────────────────────
const AnonPostForm = ({ onPost }) => {
  const [content,      setContent]      = useState("");
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading,      setLoading]      = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef  = useRef(null);

  const charCount = content.length;
  const canPost   = content.trim().length > 0 && !loading;

  // ── Character counter colour thresholds ────────────────────────────────────
  const counterColor =
    charCount > 480 ? "text-red-500"   :
    charCount > 400 ? "text-amber-500" :
    "";

  // ── Image selection ───────────────────────────────────────────────────────
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Only image files are allowed."); return; }
    if (file.size > MAX_IMAGE_BYTES)     { toast.error("Image must be under 2 MB.");     return; }
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

  // ── Auto-resize textarea ──────────────────────────────────────────────────
  const handleContentChange = (e) => {
    setContent(e.target.value.slice(0, MAX_CHARS));
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  };

  // ── Submit: POST /api/anon ────────────────────────────────────────────────
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

      toast.success("Posted anonymously 👻");
      onPost?.(data.post, "anon");

      // Reset form
      setContent("");
      removeImage();
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative overflow-hidden rounded-2xl transition-colors duration-200"
      style={{
        backgroundColor: "var(--bg-surface)",
        border:          "1px solid var(--border)",
      }}
    >
      {/* ── Accent gradient top line ──────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
        style={{
          background: "linear-gradient(90deg, var(--accent), #f5a623, var(--accent))",
          opacity:    0.5,
        }}
        aria-hidden="true"
      />

      <form onSubmit={handleSubmit} className="p-4 pt-5">

        {/* ── Top row: ghost avatar + textarea ─────────────────────────────── */}
        <div className="flex gap-3 items-start mb-3">

          {/* Ghost avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{
              backgroundColor: "var(--accent-light)",
              border:          "1px solid var(--accent-border)",
            }}
            aria-hidden="true"
          >
            <span className="text-lg leading-none select-none">👻</span>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            id="anon-content-textarea"
            value={content}
            onChange={handleContentChange}
            placeholder="What's on your mind? Say it anonymously..."
            rows={2}
            className="flex-1 bg-transparent resize-none outline-none text-sm font-sans font-normal leading-relaxed"
            style={{
              color:     "var(--text-primary)",
              minHeight: "52px",
              maxHeight: "160px",
            }}
          />
        </div>

        {/* ── Image preview ─────────────────────────────────────────────────── */}
        {imagePreview && (
          <div
            className="relative w-full rounded-xl overflow-hidden mt-1 mb-3"
            style={{
              aspectRatio: "16 / 9",
              border:      "1px solid var(--border)",
            }}
          >
            <img
              src={imagePreview}
              alt="Image preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              aria-label="Remove image"
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white
                         flex items-center justify-center hover:bg-black/70
                         transition-colors min-h-0 cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* ── Disclaimer banner ─────────────────────────────────────────────── */}
        <div
          className="flex items-start gap-2 rounded-xl px-3 py-2.5 mt-2"
          style={{
            backgroundColor: "var(--accent-light)",
            border:          "1px solid var(--accent-border)",
          }}
        >
          <ShieldCheck
            size={14}
            className="flex-shrink-0 mt-0.5"
            style={{ color: "var(--accent)" }}
          />
          <p
            className="text-xs font-normal leading-relaxed"
            style={{ color: "var(--accent)" }}
          >
            Your identity is completely hidden. No one can see who posted this — ever.
          </p>
        </div>

        {/* ── Bottom action row ─────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-2 mt-3 pt-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
            aria-hidden="true"
          />

          {/* Attach image button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach image"
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       transition-colors cursor-pointer min-h-0"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border:          "1px solid var(--border)",
              color:           "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color       = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color       = "var(--text-secondary)";
            }}
          >
            <ImagePlus size={15} />
          </button>

          {/* Character counter */}
          <span
            className={`text-[10px] ml-auto tabular-nums font-medium ${counterColor}`}
            style={!counterColor ? { color: "var(--text-muted)" } : {}}
          >
            {charCount}/500
          </span>

          {/* Post Anonymously button */}
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!canPost}
            loading={loading}
          >
            Post Anonymously
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AnonPostForm;
