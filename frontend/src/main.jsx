/**
 * main.jsx — React Application Entry Point
 *
 * - Wraps the entire tree in <ErrorBoundary> so any unhandled crash
 *   shows a friendly error page instead of a blank screen
 * - Wraps <App /> in <BrowserRouter> for client-side routing
 * - Wraps in <StrictMode> for development warnings
 * - Mounts the root component into #root in index.html
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/*
     * ErrorBoundary is the outermost wrapper so it catches crashes
     * anywhere in the tree — including inside BrowserRouter and AuthProvider.
     */}
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
