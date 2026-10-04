import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./project-preview.css";
import "./upgrade.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
import "./refinement.css";
import "./github.css";
import "./portfolio.css";
import "./shell-refinements.css";
