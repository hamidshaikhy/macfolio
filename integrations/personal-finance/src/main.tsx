import { EmbeddedBridge, embedded } from './macfolio-bridge';
import React from "react";
class Boundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="fatal">
        <h1>صفحه درست باز نشد.</h1>
        <p>
          داده‌های ذخیره‌شده پاک نشده‌اند. صفحه را تازه کنید و دوباره وارد شوید.
        </p>
        <button onClick={() => location.reload()}>بارگذاری دوباره</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
import { createRoot } from "react-dom/client";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/600.css";
import "@fontsource/vazirmatn/700.css";
import "./styles.css";
import App from "./App";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Boundary>
      <EmbeddedBridge><App /></EmbeddedBridge>
    </Boundary>
  </React.StrictMode>,
);
if (!embedded && "serviceWorker" in navigator && import.meta.env.PROD)
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL+"sw.js", {scope:import.meta.env.BASE_URL}).catch(() => {});
  });

if (window.visualViewport) {
  const updateViewport = () => {
    const v = window.visualViewport!;
    if (v.scale !== 1) return;
    document.documentElement.style.setProperty(
      "--viewport-height",
      `${v.height}px`,
    );
    document.documentElement.style.setProperty(
      "--keyboard-inset",
      `${Math.max(0, window.innerHeight - v.height - v.offsetTop)}px`,
    );
  };
  window.visualViewport.addEventListener("resize", updateViewport);
  window.visualViewport.addEventListener("scroll", updateViewport);
  updateViewport();
}
