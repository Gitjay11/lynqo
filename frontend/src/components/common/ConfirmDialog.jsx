/**
 * ConfirmDialog.jsx — Confirmation Modal for Destructive Actions
 *
 * Used before: delete post, delete comment, report post, unfollow user.
 *
 * Props:
 *  isOpen         — boolean
 *  onClose        — function — called when backdrop or Cancel is clicked
 *  onConfirm      — function — called when Confirm button is clicked
 *  title          — string  — bold heading
 *  message        — string  — supporting description
 *  confirmLabel   — string  — confirm button text (default "Confirm")
 *  confirmVariant — string  — Button variant for confirm (default "destructive")
 *  loading        — boolean — shows spinner on confirm button
 */

import Button from "./Button.jsx";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title          = "Are you sure?",
  message,
  confirmLabel   = "Confirm",
  confirmVariant = "destructive",
  loading        = false,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* ── Backdrop ────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-fade-in-fast"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Dialog box ──────────────────────────────────────────────────── */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={message ? "confirm-dialog-message" : undefined}
        className="
          fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-[calc(100%-32px)] max-w-sm
          bg-[var(--bg-surface)] border border-[var(--border)]
          rounded-2xl p-5 shadow-xl
          animate-scale-in
        "
      >
        {/* Title */}
        <p
          id="confirm-dialog-title"
          className="font-display font-bold text-base text-[var(--text-primary)] mb-2 leading-snug"
        >
          {title}
        </p>

        {/* Message */}
        {message && (
          <p
            id="confirm-dialog-message"
            className="font-sans font-normal text-sm text-[var(--text-secondary)] leading-relaxed mb-5"
          >
            {message}
          </p>
        )}

        {/* Button row */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            variant={confirmVariant}
            size="md"
            fullWidth
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </>
  );
};

export default ConfirmDialog;
