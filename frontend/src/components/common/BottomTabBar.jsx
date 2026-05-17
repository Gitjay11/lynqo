/**
 * BottomTabBar.jsx — Mobile Primary Navigation
 *
 * Visible only on mobile / tablet (hidden at lg: breakpoint and above).
 * Fixed at the bottom of the viewport — mimics the Instagram / WhatsApp pattern.
 *
 * Spec:
 *  Height:     56px (min-h-tabbar)
 *  Full width, white background, top shadow
 *  Four tabs:  Feed | Anon | Chat | Profile
 *  Active tab: icon + label highlighted with brand-600 (primary indigo)
 *  Inactive:   gray-400 icon + label
 *
 * IMPORTANT — Page container padding:
 *  Every protected page must add pb-14 (56px) to its root container
 *  so content is never hidden beneath this bar. This is enforced via the
 *  AppLayout wrapper which automatically adds that padding on mobile.
 *
 * Touch targets: each tab button is full height (56px) → ≥ 44px requirement met.
 */

import { NavLink, useNavigate } from "react-router-dom";
import { Home, Ghost, MessageCircle, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";

// ── Tab definitions ───────────────────────────────────────────────────────────
// Profile tab is special — its `to` is dynamic (depends on logged-in user's _id)
const STATIC_TABS = [
  { to: "/",     label: "Feed",  icon: Home          },
  { to: "/anon", label: "Anon",  icon: Ghost         },
  { to: "/chat", label: "Chat",  icon: MessageCircle },
];

// ─────────────────────────────────────────────────────────────────────────────
const BottomTabBar = () => {
  const { user } = useAuth();

  // Active / inactive class factory for NavLink
  const tabClass = ({ isActive }) => `
    flex flex-col items-center justify-center gap-0.5
    flex-1 h-full
    text-[10px] font-semibold tracking-wide
    transition-colors duration-150 select-none
    focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-400
    ${isActive
      ? "text-brand-600"           // active: primary indigo
      : "text-gray-400 hover:text-gray-600" // inactive
    }
  `;

  return (
    <nav
      aria-label="Bottom tab bar"
      className="
        fixed bottom-0 left-0 right-0 z-40
        lg:hidden
        flex items-stretch
        h-14 w-full
        bg-white shadow-tab-top
        safe-area-inset-bottom
      "
    >
      {/* ── Feed, Anon, Chat ───────────────────────────────────────────────── */}
      {STATIC_TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}   // exact match for Feed ("/") so /anon doesn't also highlight Feed
          className={tabClass}
          aria-label={label}
        >
          {({ isActive }) => (
            <>
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? "text-brand-600" : "text-gray-400"}
              />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}

      {/* ── Profile tab (dynamic link) ────────────────────────────────────── */}
      <NavLink
        to={user ? `/profile/${user._id}` : "/login"}
        className={tabClass}
        aria-label="Profile"
      >
        {({ isActive }) => (
          <>
            <User
              size={22}
              strokeWidth={isActive ? 2.5 : 2}
              className={isActive ? "text-brand-600" : "text-gray-400"}
            />
            <span>Profile</span>
          </>
        )}
      </NavLink>
    </nav>
  );
};

export default BottomTabBar;
