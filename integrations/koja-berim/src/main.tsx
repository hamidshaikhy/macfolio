import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/vazirmatn/arabic-400.css";
import "@fontsource/vazirmatn/arabic-500.css";
import "@fontsource/vazirmatn/arabic-600.css";
import "@fontsource/vazirmatn/arabic-700.css";
import App from "./App";
import { EmbeddedBridge } from "./macfolio-bridge";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <EmbeddedBridge><App /></EmbeddedBridge>
  </React.StrictMode>,
);
if (
  "serviceWorker" in navigator &&
  import.meta.env.PROD &&
  window.top === window.self
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + "sw.js", {
        scope: import.meta.env.BASE_URL,
      })
      .catch(() => {});
  });
}
