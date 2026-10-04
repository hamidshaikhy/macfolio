import { Braces, GitBranch, Layers } from "lucide-react";
import type { Project } from "../lib/content";

export function ProjectPreview({ project }: { project: Project }) {
  return (
    <div className={"gh-project-preview gh-project-preview-" + project.id} aria-hidden="true">
      <div className="gh-preview-chrome"><i /><i /><i /><span>{project.title}</span></div>
      {project.id === "dika" ? (
        <div className="gh-preview-site"><div><span>DIKA ASIA</span><strong>Built to<br />make an impact.</strong><i /></div><div className="gh-preview-building"><i /><i /><i /><i /><i /></div></div>
      ) : project.id === "finance" ? (
        <div className="gh-preview-finance"><aside><i /><i /><i /><i /></aside><main><div className="gh-preview-metrics"><i /><i /><i /></div><div className="gh-preview-chart">{[35, 55, 42, 68, 52, 78, 65, 94].map((h, i) => <i key={i} style={{ height: h + "%" }} />)}</div></main></div>
      ) : (
        <div className="gh-preview-flow"><span><Braces size={16} /> Trigger</span><i /><span><GitBranch size={16} /> Transform</span><i /><span><Layers size={16} /> Output</span></div>
      )}
    </div>
  );
}

