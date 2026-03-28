/**
 * index.tsx
 * ---------------------------------------------------------------------------
 * Application entry point. Mounts the React app into the DOM.
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import "./styles/global.css";

const container = document.getElementById("root");
if (!container) throw new Error('Root element "#root" not found.');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
