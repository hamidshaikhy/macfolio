import { useEffect, useState, type CSSProperties } from "react";
import { Globe, Github, Layers, ChevronLeft, ArrowUpRight, Code2, Target, CheckCircle2 } from "lucide-react";
import { projects } from "../lib/content";
import { useOS } from "../state/os";
import { ProjectPreview } from "../components/ProjectPreview";

export default function Projects() {
  const requested = useOS(s => s.selectedProject);
  const [selected, setSelected] = useState(requested || "dika");
  const [detail, setDetail] = useState(!!requested);
  useEffect(() => {
    if (requested && projects.some(project => project.id === requested)) {
      setSelected(requested);
      setDetail(true);
    }
  }, [requested]);
  const project = projects.find(project => project.id === selected)!;
  const sections = [
    { title: "نقش من", body: project.role, icon: Code2, label: "MY CONTRIBUTION" },
    { title: "چالش", body: project.challenge, icon: Target, label: "THE CHALLENGE" },
    { title: "نتیجه", body: project.result, icon: CheckCircle2, label: "THE OUTCOME" },
  ];
  return <div className={`projects-app portfolio-projects ${detail ? "show-detail" : ""}`} style={{ "--project-accent": project.color } as CSSProperties}>
    <aside className="project-sidebar">
      <div className="project-sidebar-title"><Layers size={20} /><div><strong>Selected work</strong><span>{projects.length} projects · by Hamid</span></div></div>
      <span className="project-sidebar-label">THE COLLECTION</span>
      {projects.map((item, index) => <button className={selected === item.id ? "selected" : ""} aria-pressed={selected === item.id} key={item.id} onClick={() => { setSelected(item.id); setDetail(true); }}><span className="project-monogram" style={{ background: item.color }}>{item.monogram}</span><span><strong>{item.title}</strong><small>{item.category}</small></span><span className="project-number">0{index + 1}</span></button>)}
      <div className="project-sidebar-note"><Code2 size={20} /><p className="persian" dir="rtl">هر پروژه، یک مسئلهٔ تازه.<br />هر راه‌حل، یک تجربهٔ تازه.</p></div>
      <footer>Hamid Shaikhy <span>Portfolio / 2026</span></footer>
    </aside>
    <article className="project-detail">
      <button className="mobile-project-back" onClick={() => setDetail(false)}><ChevronLeft size={18} /> Projects</button>
      <header className="project-page-top"><span>PROJECT NOTES</span><span>0{projects.indexOf(project) + 1} / 0{projects.length}</span></header>
      <section className="project-hero"><span className="project-category"><i />{project.category}</span><h2>{project.title}</h2><p className="persian" dir="rtl">{project.summary}</p><div className="project-tech-tags">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div></section>
      <div className="project-showcase"><ProjectPreview project={project} /><div><span>INTERFACE STUDY</span><span>{project.category}<ArrowUpRight size={13} /></span></div></div>
      <div className="project-story persian" dir="rtl"><span className="project-story-label">دربارهٔ پروژه</span><p>{project.description}</p></div>
      <div className="project-sections">{sections.map(({ title, body, icon: Icon, label }) => <section key={label}><header><Icon size={19} /><span>{label}</span></header><div className="persian" dir="rtl"><h3>{title}</h3><p>{body}</p></div></section>)}</div>
      <footer className="project-links">
        {"website" in project && <a className="project-live" href={project.website} target="_blank" rel="noreferrer"><Globe size={16} /> Live website <ArrowUpRight size={15} /></a>}
        <a className="project-source" href={project.repo} target="_blank" rel="noreferrer"><Github size={16} />{project.id === "dika" ? "GitHub profile" : "Source code"}<ArrowUpRight size={15} /></a>
      </footer>
    </article>
  </div>;
}
