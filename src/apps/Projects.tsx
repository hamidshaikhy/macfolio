import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Globe, Github, Layers, ChevronLeft, ChevronRight, ArrowUpRight, Code2, Target, CheckCircle2, Maximize2, X, Camera } from "lucide-react";
import { projects } from "../lib/content";
import { projectStudies } from "../lib/project-studies";
import { asset } from "../lib/assets";
import { useOS } from "../state/os";
import "./projects-gallery.css";

export default function Projects() {
  const requested = useOS(s => s.selectedProject);
  const [selected, setSelected] = useState(requested || "dika");
  const [detail, setDetail] = useState(!!requested);
  const [shotIndex, setShotIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const imageButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const project = projects.find(project => project.id === selected) || projects[0];
  const study = projectStudies[project.id];
  const shot = study.shots[shotIndex];
  const image = (file: string) => asset(`assets/projects/${project.id}/${file}`);
  const selectProject = (id: string) => { setSelected(id); setDetail(true); setShotIndex(0); setExpanded(false); };
  const closeGallery = () => { setExpanded(false); imageButton.current?.focus(); };
  useEffect(() => {
    if (requested && projects.some(project => project.id === requested)) selectProject(requested);
  }, [requested]);
  useEffect(() => {
    if (!expanded) return;
    closeButton.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeGallery(); }
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        setShotIndex(index => (index + (event.key === "ArrowRight" ? 1 : -1) + study.shots.length) % study.shots.length);
      }
      if (event.key === "Tab") {
        const controls = closeButton.current?.closest('.project-image-dialog')?.querySelectorAll<HTMLButtonElement>('button');
        if (!controls?.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [expanded, study]);
  const sections = [
    { title: "نقش من", body: study.role, icon: Code2, label: "MY CONTRIBUTION" },
    { title: "چالش طراحی", body: study.challenge, icon: Target, label: "THE CHALLENGE" },
    { title: "آنچه می‌توانید بررسی کنید", body: study.result, icon: CheckCircle2, label: "THE RESULT" },
  ];
  return <div className={`projects-app portfolio-projects project-case-studies ${detail ? "show-detail" : ""}`} style={{ "--project-accent": project.color } as CSSProperties}>
    <aside className="project-sidebar">
      <div className="project-sidebar-title"><Layers size={20} /><div><strong>Selected work</strong><span>{projects.length} projects · real interfaces</span></div></div>
      <span className="project-sidebar-label">EXPLORE THE COLLECTION</span>
      {projects.map((item, index) => <button className={selected === item.id ? "selected" : ""} aria-pressed={selected === item.id} key={item.id} onClick={() => selectProject(item.id)}><span className="project-monogram" style={{ background: item.color }}>{item.monogram}</span><span><strong>{item.title}</strong><small>{item.category}</small></span><span className="project-number">0{index + 1}</span></button>)}
      <div className="project-sidebar-note"><Camera size={20} /><p className="persian" dir="rtl">از خود محصول ببینید.<br />جزئیات هر تصویر را با یک کلیک بررسی کنید.</p></div>
      <footer>Hamid Shaikhy <span>Design & development / 2026</span></footer>
    </aside>
    <article className="project-detail" key={project.id}>
      <button className="mobile-project-back" onClick={() => setDetail(false)}><ChevronLeft size={18} /> Projects</button>
      <header className="project-page-top"><span>SELECTED WORK / CASE STUDY</span><span>0{projects.indexOf(project) + 1} / 0{projects.length}</span></header>
      <section className="project-hero">
        <span className="project-category"><i />{study.status}</span>
        <div className="project-heading-row"><h2>{project.title}</h2><h3 className="project-headline persian" dir="rtl">{study.headline}</h3></div>
        <p className="project-intro persian" dir="rtl">{study.intro}</p>
        <div className="project-hero-actions"><div className="project-tech-tags">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
        <div className="project-links">
          {"website" in project && <a className="project-live" href={project.website} target="_blank" rel="noreferrer"><Globe size={15} /> Explore live website <ArrowUpRight size={14} /></a>}
          {project.id !== "dika" && <a className="project-live" href={project.repo} target="_blank" rel="noreferrer"><Github size={15} /> Explore source & README <ArrowUpRight size={14} /></a>}
        </div></div>
      </section>
      <section className="project-real-gallery" aria-label={`${project.title} screenshots`}>
        <header className="project-gallery-heading"><span><Camera size={14} /> INSIDE THE PRODUCT</span><span>0{shotIndex + 1} / 0{study.shots.length}</span></header>
        <button ref={imageButton} className="project-main-image" aria-label={`Enlarge ${shot.title}`} onClick={() => setExpanded(true)}>
          <img src={image(shot.file)} alt={shot.title} decoding="async" />
          <span className="project-enlarge"><Maximize2 size={15} /> View full image</span>
        </button>
        <div className="project-image-caption"><div className="persian" dir="rtl"><h3>{shot.title}</h3><p>{shot.description}</p></div><div className="project-image-arrows"><button aria-label="Previous screenshot" onClick={() => setShotIndex(index => (index - 1 + study.shots.length) % study.shots.length)}><ChevronLeft size={18} /></button><button aria-label="Next screenshot" onClick={() => setShotIndex(index => (index + 1) % study.shots.length)}><ChevronRight size={18} /></button></div></div>
        <div className="project-gallery-thumbnails">{study.shots.map((item, index) => <button key={item.file} aria-label={item.title} aria-pressed={shotIndex === index} onClick={() => setShotIndex(index)}><img src={image(item.file)} alt="" loading="lazy" /><span className="persian" dir="rtl">{item.title}</span></button>)}</div>
      </section>
      <div className="project-highlights persian" dir="rtl">{study.highlights.map(highlight => <span key={highlight}><CheckCircle2 size={13} />{highlight}</span>)}</div>
      <div className="project-sections">{sections.map(({ title, body, icon: Icon, label }) => <section key={label}><header><Icon size={18} /><span>{label}</span></header><div className="persian" dir="rtl"><h3>{title}</h3><p>{body}</p></div></section>)}</div>
      <footer className="project-case-footer"><span>Built by Hamid Shaikhy</span><span>0{projects.indexOf(project) + 1} / SELECTED WORK</span></footer>
    </article>
    {expanded && <div className="project-image-backdrop" onClick={event => { if (event.target === event.currentTarget) closeGallery(); }}>
      <section className="project-image-dialog" role="dialog" aria-modal="true" aria-label="Project screenshots">
        <header><div><strong>{project.title}</strong><span className="persian" dir="rtl">{shot.title}</span></div><button ref={closeButton} aria-label="Close screenshot" onClick={closeGallery}><X size={22} /></button></header>
        <div className="project-image-full"><img src={image(shot.file)} alt={shot.title} /></div>
        <footer><button aria-label="Previous enlarged screenshot" onClick={() => setShotIndex(index => (index - 1 + study.shots.length) % study.shots.length)}><ChevronLeft size={20} /></button><span>{shotIndex + 1} / {study.shots.length}</span><button aria-label="Next enlarged screenshot" onClick={() => setShotIndex(index => (index + 1) % study.shots.length)}><ChevronRight size={20} /></button></footer>
      </section>
    </div>}
  </div>;
}
