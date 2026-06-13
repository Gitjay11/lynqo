/**
 * EmptyState.jsx — Unified Empty State Component
 *
 * Used across all pages when a list or section has no content:
 *  - Feed no posts
 *  - Anon no confessions
 *  - Chat no conversations
 *  - Notifications empty
 *  - Search no results
 *  - Profile no posts
 *  - FollowListModal no followers/following
 *
 * Props:
 *  icon        — ReactNode — lucide-react icon (use this OR emoji, not both)
 *  emoji       — string   — emoji character (e.g. "🔔")
 *  title       — string   — bold heading
 *  subtitle    — string   — softer supporting text
 *  action      — function — optional callback for action button
 *  actionLabel — string   — label for the action button
 */

import Button from "./Button.jsx";

const EmptyState = ({
  icon,
  emoji,
  title,
  subtitle,
  action,
  actionLabel,
}) => {
  const hasIcon = emoji || icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">

      {/* Icon / emoji container */}
      {hasIcon && (
        <div
          className="
            w-16 h-16
            bg-[var(--accent-light)] border border-[var(--accent-border)]
            rounded-2xl
            flex items-center justify-center
            mb-4
          "
          aria-hidden="true"
        >
          {emoji && (
            <span className="text-3xl leading-none select-none">{emoji}</span>
          )}
          {!emoji && icon && (
            <span
              className="text-[var(--accent)]"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28 }}
            >
              {icon}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      {title && (
        <p className="font-display font-bold text-base text-[var(--text-primary)] mb-2 leading-snug">
          {title}
        </p>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p className="font-sans font-normal text-xs text-[var(--text-secondary)] leading-relaxed mb-6 max-w-[260px]">
          {subtitle}
        </p>
      )}

      {/* Optional action button */}
      {action && actionLabel && (
        <Button variant="primary" size="sm" onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
