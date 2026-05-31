/**
 * TagInput.jsx — Reusable tag/chip input
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
    <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-700 border border-zinc-600 rounded-xl min-h-[44px] focus-within:border-zinc-400 transition-colors">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="flex items-center gap-1 px-2 py-0.5 bg-zinc-600 text-white text-xs rounded-lg"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            aria-label={`Remove ${tag}`}
            className="text-zinc-400 hover:text-white transition-colors"
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
        className="flex-1 min-w-[120px] bg-transparent text-white text-sm outline-none placeholder:text-zinc-500"
      />
    </div>
  );
};

export default TagInput;
