/**
 * main.jsx — React Application Entry Point
 *
 * - Wraps the entire tree in <ErrorBoundary> so any unhandled crash
 *   shows a friendly error page instead of a blank screen
 * - Wraps <App /> in <BrowserRouter> for client-side routing
 * - Wraps in <StrictMode> for development warnings
 * - Wraps in <ThemeProvider> for global dark/light mode state
 * - Mounts the root component into #root in index.html
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/*
     * ThemeProvider is the outermost React wrapper — reads localStorage before
     * first paint (the inline script in index.html handles pre-React FOUT).
     * ErrorBoundary catches any crash inside the full tree.
     */}
    <ThemeProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>
);

