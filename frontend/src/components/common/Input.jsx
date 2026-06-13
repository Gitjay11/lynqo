/**
 * Input.jsx — Unified Text Input Component
 *
 * The single input primitive used everywhere in the app.
 * Do NOT use raw <input> elements elsewhere — always use this.
 *
 * Props:
 *  label       — string  — shown above input
 *  placeholder — string
 *  value       — string
 *  onChange    — function
 *  type        — string  — default 'text'
 *  error       — string  — error message (turns border red)
 *  hint        — string  — helper text below input (only shown when no error)
 *  icon        — ReactNode — left icon (input gets pl-10)
 *  iconRight   — ReactNode — right icon (input gets pr-10)
 *  disabled    — boolean
 *  maxLength   — number
 *  showCount   — boolean — character count display (requires maxLength)
 *  required    — boolean
 *  id          — string  — for label association
 *  className   — string  — extra wrapper classes
 */

import { AlertCircle } from "lucide-react";

const Input = ({
  label,
  placeholder,
  value       = "",
  onChange,
  type        = "text",
  error,
  hint,
  icon,
  iconRight,
  disabled    = false,
  maxLength,
  showCount   = false,
  required    = false,
  id,
  className   = "",
  ...rest
}) => {
  // Character count color thresholds
  const charCount    = (value ?? "").length;
  const countColor   = !maxLength
    ? "text-[var(--text-muted)]"
    : charCount >= maxLength * 0.95
    ? "text-red-500"
    : charCount >= maxLength * 0.80
    ? "text-amber-500"
    : "text-[var(--text-muted)]";

  const hasLeft  = Boolean(icon);
  const hasRight = Boolean(iconRight);

  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") + "-input" : undefined);

  return (
    <div className={`w-full ${className}`}>

      {/* ── Label ─────────────────────────────────────────────────────────── */}
      {label && (
        <label
          htmlFor={inputId}
          className="font-sans font-bold text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}

      {/* ── Input wrapper (for icon positioning) ──────────────────────────── */}
      <div className="relative w-full">

        {/* Left icon */}
        {hasLeft && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
            aria-hidden="true"
            style={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {icon}
          </span>
        )}

        {/* Input element */}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={`
            w-full bg-[var(--bg-elevated)] border
            text-[var(--text-primary)] text-sm rounded-xl px-4 py-2.5
            placeholder:text-[var(--text-muted)]
            outline-none
            transition-colors duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
            ${hasLeft  ? "pl-10" : ""}
            ${hasRight ? "pr-10" : ""}
            ${error
              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            }
          `.trim().replace(/\s+/g, " ")}
          {...rest}
        />

        {/* Right icon */}
        {hasRight && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            style={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {iconRight}
          </span>
        )}
      </div>

      {/* ── Below-input row: error OR hint | char count ──────────────────── */}
      {(error || hint || (showCount && maxLength)) && (
        <div className="flex items-start justify-between mt-1 gap-2">

          {/* Error message */}
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

          {/* Hint text (only when no error) */}
          {!error && hint && (
            <p id={`${inputId}-hint`} className="font-sans font-normal text-xs text-[var(--text-muted)]">
              {hint}
            </p>
          )}

          {/* Spacer when no error/hint but count is showing */}
          {!error && !hint && showCount && <span />}

          {/* Character count */}
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

export default Input;
