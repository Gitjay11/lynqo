/**
 * TagInput.jsx — Reusable tag/chip input (Themed)
 *
 * Props:
 *  tags     : string[]           — current list of tags
 *  onChange : (tags: string[]) => void
 *  placeholder : string
 *  id       : string             — for accessibility
 */

import { useState } from "react";
import { X } from "lucide-react";

const TagInput = ({ tags = [], onChange, placeholder = "Type and press Enter", id }) => {
  const [inputVal, setInputVal] = useState("");

  const addTag = (raw) => {
    const val = raw.trim();
    if (!val || tags.includes(val)) return;
    onChange([...tags, val]);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputVal);
      setInputVal("");
    } else if (e.key === "Backspace" && inputVal === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (index) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div
      className="flex flex-wrap gap-1.5 p-2 rounded-xl min-h-[44px] transition-colors focus-within:outline-none"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border)",
      }}
      onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
      onBlur={e => e.currentTarget.style.borderColor = "var(--border)"}
    >
      {tags.map((tag, i) => (
        <span
          key={i}
          className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-lg"
          style={{
            backgroundColor: "var(--accent-light)",
            color: "var(--accent)",
            border: "1px solid var(--accent)",
          }}
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            aria-label={`Remove ${tag}`}
            className="transition-colors min-h-0"
            style={{ color: "var(--accent)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--error)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--accent)"}
          >
            <X size={11} strokeWidth={2.5} />
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (inputVal.trim()) { addTag(inputVal); setInputVal(""); } }}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] bg-transparent text-sm outline-none"
        style={{ color: "var(--text-primary)" }}
      />
    </div>
  );
};

export default TagInput;
