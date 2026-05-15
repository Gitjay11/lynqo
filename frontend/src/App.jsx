/**
 * App.jsx — Root Application Component
 *
 * Sets up:
 *  - BrowserRouter for client-side routing
 *  - AuthContext provider (global auth state)
 *  - SocketContext provider (Socket.IO instance)
 *  - React Hot Toast notification system
 *  - All route definitions
 *
 * Context providers wrap the router so any component in the tree
 * can access auth state and the socket connection.
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Context providers
import { AuthProvider } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";

// Route guard
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";

// Pages — Auth
import LoginPage  from "./pages/auth/LoginPage.jsx";
import SignupPage from "./pages/auth/SignupPage.jsx";

// Pages — App
import FeedPage    from "./pages/FeedPage.jsx";
import AnonPage    from "./pages/AnonPage.jsx";
import ChatPage    from "./pages/ChatPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          {/* Toast notification container — top-center on mobile */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: "12px",
                fontSize: "14px",
                fontFamily: "Inter, sans-serif",
              },
            }}
          />

          <Routes>
            {/* ── Public routes ── */}
            <Route path="/login"  element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* ── Protected routes — require authentication ── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/"        element={<FeedPage />} />
              <Route path="/anon"    element={<AnonPage />} />
              <Route path="/chat"    element={<ChatPage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
            </Route>

            {/* ── 404 fallback ── */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
