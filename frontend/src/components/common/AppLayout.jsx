/**
 * AppLayout.jsx — Shell Layout for All Protected Pages
 *
 * Composes the three navigation components into a single shell:
 *
 *   ┌──────────────────────────────────────┐  ← Navbar (fixed top, h-14, all breakpoints)
 *   │  Logo          Nav Links    Avatar   │
 *   ├────────────┬─────────────────────────┤
 *   │            │                         │
 *   │  Sidebar   │   <page content>        │
 *   │ (lg+ only) │                         │
 *   │            │                         │
 *   ├────────────┴─────────────────────────┤
 *   │   Feed  |  Anon  |  Chat  | Profile  │  ← BottomTabBar (fixed bottom, mobile only)
 *   └──────────────────────────────────────┘
 *
 * Spacing contract (why each class exists):
 *  pt-14       — clears the 56px fixed Navbar on ALL screen sizes
 *  pb-16       — clears the 56px fixed BottomTabBar on mobile (lg:pb-0 removes it on desktop)
 *  lg:ml-sidebar — shifts content right on desktop to avoid the 240px sidebar
 *
 * Usage: Wrap ProtectedRoute's <Outlet /> with this layout in App.jsx,
 * or use it directly inside each protected page's root element.
 *
 * It renders <Outlet /> so it can replace the bare <ProtectedRoute> element
 * in the route tree without any changes to App.jsx route definitions.
 */

import { Outlet } from "react-router-dom";
import Navbar       from "./Navbar.jsx";
import Sidebar      from "./Sidebar.jsx";
import BottomTabBar from "./BottomTabBar.jsx";

// ─────────────────────────────────────────────────────────────────────────────
const AppLayout = () => {
  return (
    <div className="min-h-screen bg-surface-50">

      {/* Fixed top bar — always visible */}
      <Navbar />

      {/* Fixed left sidebar — desktop only (hidden on < lg) */}
      <Sidebar />

      {/* ── Main scrollable content area ───────────────────────────────────
          pt-14   → clear Navbar height (56px)
          pb-16   → clear BottomTabBar on mobile (removed on lg:)
          lg:ml-sidebar → offset left for the fixed sidebar
      ─────────────────────────────────────────────────────────────────── */}
      <main
        className="
          pt-14 pb-16
          lg:ml-sidebar lg:pb-0
          min-h-screen
        "
      >
        {/* Render the matched child route */}
        <Outlet />
      </main>

      {/* Fixed bottom tab bar — mobile/tablet only (hidden on lg:) */}
      <BottomTabBar />

    </div>
  );
};

export default AppLayout;
