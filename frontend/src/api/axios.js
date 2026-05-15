/**
 * axios.js — Configured Axios Instance
 *
 * All API calls go through this instance, which:
 *  1. Sets the base URL from the VITE_API_BASE_URL env variable
 *  2. Attaches the JWT token to every outgoing request automatically
 *  3. Handles 401 Unauthorized responses globally (token expiry → redirect to login)
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
    if (error.response?.status === 401) {
      // Clear stale auth data and redirect to login
      localStorage.removeItem("lynqo_token");
      localStorage.removeItem("lynqo_user");
      // Redirect without react-router to force a clean reload
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
