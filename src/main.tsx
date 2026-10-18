import { lazy, StrictMode, Suspense, useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./project-preview.css";
import "./upgrade.css";
import { trackMobileViewport } from "./lib/mobile-viewport";
function MobileViewport() {
  useLayoutEffect(() => trackMobileViewport(document.getElementById('root')!), []);
  return null;
}
const App = lazy(() => import("./App"));
const Portfolio = lazy(() => import("./portfolio/PortfolioExperience"));
const standalone = window.location.pathname.replace(/\/$/, "") === `${import.meta.env.BASE_URL}portfolio`;
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MobileViewport />
    <Suspense fallback={<div style={{height:'100%',background:'#091b1d'}} aria-label="Loading portfolio" />}>
      {standalone ? <Portfolio mode="standalone" /> : <App />}
    </Suspense>
  </StrictMode>,
);
import "./refinement.css";
import "./github.css";
import "./portfolio.css";
import "./shell-refinements.css";
import "./mobile-viewport.css";
