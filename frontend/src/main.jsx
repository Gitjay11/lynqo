/**
 * main.jsx — React Application Entry Point
 * Wraps the app in React.StrictMode for development warnings.
 * Mounts the root <App /> component into #root in index.html.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
