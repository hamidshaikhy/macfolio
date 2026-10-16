import type { Project } from "../lib/content";
import { projectStudies } from "../lib/project-studies";
import { asset } from "../lib/assets";

export function ProjectPreview({ project }: { project: Project }) {
  return (
    <div className={"gh-project-preview gh-project-preview-" + project.id}>
      <img src={asset(`assets/portfolio/work/${project.id}/${projectStudies[project.id].shots[0].file.replace('.png','.webp')}`)} alt={`${project.title} — actual project screenshot`} loading="lazy" decoding="async" />
    </div>
  );
}

