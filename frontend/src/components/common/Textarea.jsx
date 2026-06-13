/**
 * Textarea.jsx — Unified Multi-line Text Input Component
 *
 * Borderless by default — lives inside a card container that provides the border.
 * Do NOT add a border directly to this component.
 *
 * Props:
 *  label       — string  — shown above textarea
 *  placeholder — string
 *  value       — string
 *  onChange    — function
 *  error       — string  — error message
 *  hint        — string  — helper text
 *  maxLength   — number
 *  showCount   — boolean — character count (requires maxLength)
 *  autoGrow    — boolean — dynamically adjusts height as user types
 *  minRows     — number  — minimum rows (default 2)
 *  maxRows     — number  — maximum rows before scrolling (default 6)
 *  disabled    — boolean
 *  id          — string
 *  className   — string  — extra classes on the textarea element
 */

import { useRef } from "react";
import { AlertCircle } from "lucide-react";

// Row height in pixels (matches leading-relaxed ≈ 24px per line)
const ROW_HEIGHT = 24;

const Textarea = ({
  label,
  placeholder,
  value       = "",
  onChange,
  error,
  hint,
  maxLength,
  showCount   = false,
  autoGrow    = false,
  minRows     = 2,
  maxRows     = 6,
  disabled    = false,
  id,
  className   = "",
  ...rest
}) => {
  const ref = useRef(null);

  // Character count color thresholds
  const charCount  = (value ?? "").length;
  const countColor = !maxLength
    ? "text-[var(--text-muted)]"
    : charCount >= maxLength * 0.95
    ? "text-red-500"
    : charCount >= maxLength * 0.80
    ? "text-amber-500"
    : "text-[var(--text-muted)]";

  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") + "-textarea" : undefined);

  // Auto-grow handler: shrink to 0, then expand to scrollHeight clamped to maxRows
  const handleInput = (e) => {
    if (!autoGrow) return;
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, maxRows * ROW_HEIGHT) + "px";
  };

  const minHeight = minRows * ROW_HEIGHT;

  return (
    <div className="w-full">

      {/* ── Label ─────────────────────────────────────────────────────────── */}
      {label && (
        <label
          htmlFor={inputId}
          className="font-sans font-bold text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block"
        >
          {label}
        </label>
      )}

      {/* ── Textarea element ───────────────────────────────────────────────── */}
      <textarea
        ref={ref}
        id={inputId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        rows={autoGrow ? minRows : minRows}
        onInput={handleInput}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        style={{ minHeight: `${minHeight}px` }}
        className={`
          w-full bg-transparent border-none
          text-[var(--text-primary)] text-sm
          placeholder:text-[var(--text-muted)]
          outline-none resize-none
          leading-relaxed
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-150
          ${className}
        `.trim().replace(/\s+/g, " ")}
        {...rest}
      />

      {/* ── Below-textarea row: error OR hint | char count ───────────────── */}
      {(error || hint || (showCount && maxLength)) && (
        <div className="flex items-start justify-between mt-1 gap-2">

          {error && (
            <p
              id={`${inputId}-error`}
              className="font-sans font-medium text-xs text-red-500 flex items-center gap-1"
              role="alert"
            >
              <AlertCircle size={12} aria-hidden="true" />
              {error}
            </p>
          )}

          {!error && hint && (
            <p id={`${inputId}-hint`} className="font-sans font-normal text-xs text-[var(--text-muted)]">
              {hint}
            </p>
          )}

          {!error && !hint && showCount && <span />}

          {showCount && maxLength && (
            <p className={`font-sans font-normal text-[10px] tabular-nums ml-auto flex-shrink-0 ${countColor}`}>
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Textarea;
