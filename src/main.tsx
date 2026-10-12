import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./project-preview.css";
import "./upgrade.css";
const App = lazy(() => import("./App"));
const Portfolio = lazy(() => import("./portfolio/PortfolioExperience"));
const standalone = window.location.pathname.replace(/\/$/, "") === `${import.meta.env.BASE_URL}portfolio`;
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<div style={{height:'100%',background:'#091b1d'}} aria-label="Loading portfolio" />}>
      {standalone ? <Portfolio mode="standalone" /> : <App />}
    </Suspense>
  </StrictMode>,
);
import "./refinement.css";
import "./github.css";
import "./portfolio.css";
import "./shell-refinements.css";
