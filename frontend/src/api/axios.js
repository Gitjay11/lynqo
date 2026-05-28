/**
 * axios.js — Configured Axios Instance
 *
 * All API calls go through this instance, which:
 *  1. Sets the base URL from the VITE_API_BASE_URL env variable
 *  2. Attaches the JWT token to every outgoing request automatically
 *  3. Handles 401 Unauthorized responses globally (token expiry → redirect to /)
 */

import axios from "axios";

// Create a shared axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // e.g. http://localhost:5000/api
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // We use Bearer tokens, not cookies
});

// ── Request interceptor — attach JWT from localStorage ──────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("lynqo_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle token expiry globally ─────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url    = error.config?.url ?? "";

    if (status === 401) {
      // Do NOT redirect on the /auth/me session-check itself — AuthContext
      // handles that 401 silently by setting user = null. Redirecting here
      // would cause a loop: /me 401 → redirect to / → mount → /me 401 → ...
      const isSessionCheck = url.includes("/auth/me");

      // Also skip if already on the landing page to avoid redundant redirects
      const isAlreadyOnLanding = window.location.pathname === "/";

      if (!isSessionCheck && !isAlreadyOnLanding) {
        // Expired token on a real API call — wipe auth data and go to landing
        localStorage.removeItem("lynqo_token");
        localStorage.removeItem("lynqo_user");
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
