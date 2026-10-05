import type { Project } from "../lib/content";
import { projectStudies } from "../lib/project-studies";
import { asset } from "../lib/assets";

export function ProjectPreview({ project }: { project: Project }) {
  return (
    <div className={"gh-project-preview gh-project-preview-" + project.id}>
      <img src={asset(`assets/projects/${project.id}/${projectStudies[project.id].shots[0].file}`)} alt={`${project.title} — actual project screenshot`} decoding="async" />
    </div>
  );
}

