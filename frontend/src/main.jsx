/**
 * main.jsx — React Application Entry Point
 *
 * - Wraps <App /> in <BrowserRouter> for client-side routing
 * - Wraps in <StrictMode> for development warnings
 * - Mounts the root component into #root in index.html
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
