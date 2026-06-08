/**
 * PostForm.jsx — Post Composer (Redesigned)
 *
 * Card container with focus-within accent border.
 * Features:
 *  - Auto-growing textarea (2–6 rows)
 *  - Full-width aspect-video image preview with remove button
 *  - Tag picker dropdown with pill display
 *  - Anonymous toggle (wires to POST /api/anon with isAnonymous: true)
 *  - Character counter (muted → amber → red)
 *  - Disabled post button when empty or submitting
 *  - Spinner on submit
 *
 * API:
 *  - Normal post  → POST /api/posts       (multipart/form-data)
 *  - Anon post    → POST /api/anon        (multipart/form-data + isAnonymous: true)
 *  - No other API calls or socket logic changed.
 */

import { useState, useRef, useEffect } from "react";
import { Image, X, Loader2, Tag, SendHorizonal } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import Avatar from "../common/Avatar.jsx";

const MAX_CHARS       = 500;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

// ── Tag options ───────────────────────────────────────────────────────────────
const TAG_OPTIONS = [
  { value: "Announcements", label: "📢 Announcements" },
  { value: "Memes",         label: "😂 Memes"         },
  { value: "Academics",     label: "📚 Academics"     },
  { value: "Placements",    label: "💼 Placements"    },
  { value: "Questions",     label: "❓ Questions"     },
];

// ─────────────────────────────────────────────────────────────────────────────
const PostForm = ({ currentUser, onPost }) => {
  const [content,      setContent]      = useState("");
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [selectedTag,  setSelectedTag]  = useState(null);   // string | null
  const [isAnonymous,  setIsAnonymous]  = useState(false);
  const [tagOpen,      setTagOpen]      = useState(false);  // tag dropdown

  const fileInputRef   = useRef(null);
  const textareaRef    = useRef(null);
  const tagDropdownRef = useRef(null);

  const remaining = MAX_CHARS - content.length;
  const canPost   = content.trim().length > 0 && !loading;

  // ── Auto-grow textarea ────────────────────────────────────────────────────
  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    // clamp between 2 rows (~48px) and 6 rows (~144px)
    const lineH = 24; // ~24px per line at text-sm leading-relaxed
    const min   = lineH * 2;
    const max   = lineH * 6;
    el.style.height = `${Math.min(Math.max(el.scrollHeight, min), max)}px`;
  };

  useEffect(() => { adjustHeight(); }, [content]);

  // ── Close tag dropdown on outside click ───────────────────────────────────
  useEffect(() => {
    if (!tagOpen) return;
    const handler = (e) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) {
        setTagOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [tagOpen]);

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
      if (imageFile)   fd.append("image", imageFile);
      if (selectedTag) fd.append("tag", selectedTag);
      if (isAnonymous) fd.append("isAnonymous", "true");

      // Route to /api/anon when posting anonymously
      const endpoint = isAnonymous ? "/anon" : "/posts";
      const { data } = await api.post(endpoint, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Posted!");
      onPost?.(data.post, "feed");

      // Reset form
      setContent("");
      setSelectedTag(null);
      setIsAnonymous(false);
      removeImage();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  // ── Character counter color ────────────────────────────────────────────────
  const charCountStyle = () => {
    if (content.length > 480) return { color: "#ef4444" };       // red-500
    if (content.length > 400) return { color: "#f59e0b" };       // amber-500
    return { color: "var(--text-muted)" };
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="rounded-2xl transition-colors duration-200"
      style={{
        backgroundColor: "var(--bg-surface)",
        border:          "1px solid var(--border)",
      }}
    >
      <form onSubmit={handleSubmit} className="p-4">

        {/* ── Top row: avatar + textarea ──────────────────────────────────── */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Avatar
              src={isAnonymous ? null : currentUser?.profilePicture}
              name={isAnonymous ? "?" : (currentUser?.name ?? "")}
              size="sm"
            />
          </div>

          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              id="post-content-textarea"
              value={content}
              onChange={(e) => {
                setContent(e.target.value.slice(0, MAX_CHARS));
                adjustHeight();
              }}
              placeholder="What's happening on campus?"
              rows={2}
              style={{ color: "var(--text-primary)" }}
              className="
                w-full px-0 py-1
                bg-transparent border-none outline-none resize-none
                text-sm leading-relaxed
                placeholder:text-[color:var(--text-muted)]
              "
            />

            {/* ── Image preview — full width aspect-video ──────────────── */}
            {imagePreview && (
              <div
                className="relative w-full overflow-hidden mt-3 rounded-xl"
                style={{
                  aspectRatio: "16/9",
                  border: "1px solid var(--border)",
                }}
              >
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="Remove image"
                  className="
                    absolute top-2 right-2
                    w-7 h-7 rounded-full
                    flex items-center justify-center
                    text-white cursor-pointer
                    transition-colors duration-150 min-h-0
                  "
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.7)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.5)"}
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom action row ──────────────────────────────────────────── */}
        <div
          className="flex items-center gap-2 mt-3 pt-3 flex-wrap"
          style={{ borderTop: "1px solid var(--border)" }}
        >

          {/* ── Left side: Image + Tag ──────────────────────────────────── */}
          {/* Hidden file input */}
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
              w-8 h-8 rounded-lg flex items-center justify-center
              transition-colors duration-150 cursor-pointer min-h-0
              focus:outline-none focus:ring-2
            "
            style={{
              backgroundColor: "var(--bg-elevated)",
              border:          "1px solid var(--border)",
              color:           "var(--text-secondary)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color       = "var(--accent)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color       = "var(--text-secondary)";
            }}
          >
            <Image size={16} />
          </button>

          {/* Tag picker button + dropdown */}
          <div className="relative" ref={tagDropdownRef}>
            <button
              type="button"
              onClick={() => setTagOpen((v) => !v)}
              aria-label="Add tag"
              className="
                w-8 h-8 rounded-lg flex items-center justify-center
                transition-colors duration-150 cursor-pointer min-h-0
                focus:outline-none focus:ring-2
              "
              style={{
                backgroundColor: tagOpen ? "var(--accent-light)" : "var(--bg-elevated)",
                border:          tagOpen ? "1px solid var(--accent-border)" : "1px solid var(--border)",
                color:           tagOpen ? "var(--accent)" : "var(--text-secondary)",
              }}
              onMouseEnter={e => {
                if (!tagOpen) {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.color       = "var(--accent)";
                }
              }}
              onMouseLeave={e => {
                if (!tagOpen) {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color       = "var(--text-secondary)";
                }
              }}
            >
              <Tag size={16} />
            </button>

            {/* Tag dropdown */}
            {tagOpen && (
              <div
                className="absolute left-0 top-[calc(100%+6px)] z-50 rounded-xl overflow-hidden shadow-xl shadow-black/20 min-w-[160px]"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border:          "1px solid var(--border)",
                }}
              >
                {TAG_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedTag(selectedTag === opt.value ? null : opt.value);
                      setTagOpen(false);
                    }}
                    className="
                      w-full flex items-center gap-2 px-3 py-2.5 text-xs
                      transition-colors duration-100 text-left min-h-0
                    "
                    style={{
                      color:           selectedTag === opt.value ? "var(--accent)" : "var(--text-primary)",
                      backgroundColor: selectedTag === opt.value ? "var(--accent-light)" : "transparent",
                    }}
                    onMouseEnter={e => {
                      if (selectedTag !== opt.value) e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                    }}
                    onMouseLeave={e => {
                      if (selectedTag !== opt.value) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected tag pill */}
          {selectedTag && (
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "var(--accent-light)",
                border:          "1px solid var(--accent-border)",
                color:           "#9a3412",
              }}
            >
              {TAG_OPTIONS.find((t) => t.value === selectedTag)?.label ?? selectedTag}
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                aria-label="Remove tag"
                className="min-h-0 flex items-center"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </span>
          )}

          {/* ── Spacer ─────────────────────────────────────────────────── */}
          <div className="flex-1" />

          {/* ── Right side: Anon toggle + char counter + post button ───── */}
          <div className="flex items-center gap-3">

            {/* Anonymous toggle */}
            <label
              className="flex items-center gap-1.5 cursor-pointer select-none"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Post anonymously"
            >
              <span className="text-xs font-medium">Anon</span>
              {/* Toggle pill */}
              <button
                type="button"
                role="switch"
                aria-checked={isAnonymous}
                onClick={() => setIsAnonymous((v) => !v)}
                className="
                  relative w-8 h-4 rounded-full
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 min-h-0
                "
                style={{
                  backgroundColor: isAnonymous ? "var(--accent)" : "var(--border)",
                }}
              >
                <span
                  className="
                    absolute top-0.5 w-3 h-3 bg-white rounded-full
                    transition-all duration-200 shadow-sm
                  "
                  style={{ left: isAnonymous ? "calc(100% - 14px)" : "2px" }}
                />
              </button>
            </label>

            {/* Character counter */}
            <span
              className="text-xs tabular-nums font-medium"
              style={charCountStyle()}
            >
              {content.length}/{MAX_CHARS}
            </span>

            {/* Post button */}
            <button
              type="submit"
              id="post-submit-btn"
              disabled={!canPost}
              className="
                text-white text-xs font-bold px-4 py-2 rounded-lg
                transition-all duration-150
                active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
                focus:outline-none focus:ring-2
              "
              style={{ backgroundColor: "var(--accent)" }}
              onMouseEnter={e => { if (canPost) e.currentTarget.style.backgroundColor = "#d4572f"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "var(--accent)"; }}
            >
              {loading
                ? <span className="flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin" />
                    Posting…
                  </span>
                : "Post"
              }
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PostForm;
