/**
 * DropdownMenu.jsx — Reusable Dropdown Menu Component
 *
 * Used for: Navbar user menu, post "more options", chat "more options".
 *
 * Props:
 *  trigger  — ReactNode — the element that opens/closes the dropdown (button, icon, etc.)
 *  items    — array of item objects:
 *               { label, icon, onClick, destructive, dividerAbove }
 *  align    — 'right' (default) | 'left' — dropdown alignment relative to trigger
 *
 * Behavior:
 *  - Opens on trigger click
 *  - Closes on outside click (mousedown listener)
 *  - Closes on Escape key
 *  - Closes after any item click
 */

import { useState, useRef, useEffect, cloneElement, isValidElement } from "react";

const DropdownMenu = ({ trigger, items = [], align = "right" }) => {
  const [open, setOpen]   = useState(false);
  const containerRef      = useRef(null);

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Close on Escape key ────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleItemClick = (itemOnClick) => {
    setOpen(false);
    itemOnClick?.();
  };

  // Clone trigger to inject onClick toggle
  const triggerEl = isValidElement(trigger)
    ? cloneElement(trigger, {
        onClick: (e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
          trigger.props.onClick?.(e);
        },
      })
    : <span onClick={() => setOpen((p) => !p)}>{trigger}</span>;

  const alignClass = align === "left" ? "left-0" : "right-0";

  return (
    <div className="relative inline-block" ref={containerRef}>

      {/* ── Trigger ─────────────────────────────────────────────────────── */}
      {triggerEl}

      {/* ── Dropdown panel ──────────────────────────────────────────────── */}
      {open && (
        <div
          role="menu"
          aria-label="Menu"
          className={`
            absolute z-50 mt-2 min-w-[160px]
            bg-[var(--bg-surface)] border border-[var(--border)]
            rounded-2xl shadow-lg overflow-hidden
            animate-scale-in origin-top-right
            ${alignClass}
          `}
        >
          {items.map((item, idx) => (
            <div key={idx}>
              {/* Optional divider above this item */}
              {item.dividerAbove && (
                <div
                  className="border-t border-[var(--border)] my-1"
                  aria-hidden="true"
                />
              )}

              <button
                role="menuitem"
                onClick={() => handleItemClick(item.onClick)}
                disabled={item.disabled}
                className={`
                  flex items-center gap-2.5 px-4 py-2.5 w-full text-left
                  font-sans font-medium text-sm cursor-pointer
                  min-h-[44px]
                  transition-colors duration-150
                  focus:outline-none
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${item.destructive
                    ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    : "text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                  }
                `.trim().replace(/\s+/g, " ")}
              >
                {/* Icon */}
                {item.icon && (
                  <span
                    aria-hidden="true"
                    className="flex-shrink-0"
                    style={{ width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {item.icon}
                  </span>
                )}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
