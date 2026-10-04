import { useRef, useState, type CSSProperties } from "react";
import { Github, MapPin, Mail, BookOpen, ArrowUpRight, ArrowDown, FileText, Code2, Braces, Network, GitBranch, Layers } from "lucide-react";
import { profile, projects } from "../lib/content";
import { asset } from "../lib/assets";
import { useOS } from "../state/os";
import { toolkit } from "../lib/toolkit";
import { ProjectPreview } from "../components/ProjectPreview";

export default function GitHub() {
  const os = useOS();
  const root = useRef<HTMLDivElement>(null);
  const work = useRef<HTMLElement>(null);
  const stack = useRef<HTMLElement>(null);
  const [tab, setTab] = useState("Overview");
  function navigate(target: "Overview" | "Projects" | "Toolkit") {
    setTab(target);
    const behavior = os.reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (target === "Overview") root.current?.scrollTo({ top: 0, behavior });
    else (target === "Projects" ? work : stack).current?.scrollIntoView({ behavior, block: "start" });
  }

  return (
    <div ref={root} className="github-app gh-redesign">
      <aside className="gh-sidebar">
        <div className="gh-avatar-wrap"><img src={asset("assets/avatar.png")} alt={profile.name} /><span><Code2 size={17} /></span></div>
        <h1>{profile.name}</h1>
        <p className="gh-handle">@hamidshaikhy</p>
        <p className="gh-role">{profile.title}</p>
        <div className="gh-location"><MapPin size={14} /> {profile.location}</div>
        <div className="gh-profile-actions">
          <button className="gh-contact" onClick={() => os.openApp("contacts")}><Mail size={16} /> Get in touch <ArrowUpRight size={15} /></button>
          <button className="gh-resume" onClick={() => os.openApp("resume")}><FileText size={15} /> View résumé</button>
        </div>
        <div className="gh-sidebar-divider" />
        <span className="gh-label">ON MY DESK</span>
        <div className="gh-sidebar-focus"><Code2 size={17} /><span>React & TypeScript<small>Interfaces, components, experiences</small></span></div>
        <div className="gh-sidebar-focus"><Layers size={17} /><span>From idea to interface<small>Design-minded development</small></span></div>
        <div className="gh-sidebar-bottom"><Github size={18} /><span>A little about me.<br />A lot of what I love building.</span></div>
      </aside>

      <main className="gh-main">
        <header className="gh-topbar"><span><Github size={18} /> hamidshaikhy <span className="gh-topbar-slash">/</span> README.md</span><span className="gh-profile-badge">Personal profile</span></header>
        <nav className="gh-tabs" aria-label="GitHub profile sections">
          {(["Overview", "Projects", "Toolkit"] as const).map(name => <button key={name} aria-pressed={tab === name} onClick={() => navigate(name)}>{name === "Overview" ? <BookOpen size={15} /> : name === "Projects" ? <GitBranch size={15} /> : <Braces size={15} />}{name}{name === "Projects" && <span>{projects.length}</span>}</button>)}
        </nav>

        <section className="gh-hero">
          <div className="gh-hero-copy"><div className="gh-hello"><span /> A DEVELOPER’S CORNER OF THE INTERNET</div><h2>Hey, I’m <span>Hamid.</span><span className="gh-hero-wave">✦</span></h2><p>I turn ideas into interfaces<br />you can actually enjoy using.</p><div className="gh-hero-actions"><button onClick={() => navigate("Projects")}>Explore my work <ArrowDown size={15} /></button><button aria-label="Open Code" onClick={() => os.openApp("editor")}><Code2 size={17} /></button></div></div>
          <div className="gh-code-scene" aria-hidden="true"><div className="gh-orbit gh-orbit-one" /><div className="gh-orbit gh-orbit-two" /><img className="gh-floating-react" src={asset("assets/toolkit/react.svg")} alt="" /><img className="gh-floating-ts" src={asset("assets/toolkit/typescript.svg")} alt="" /><div className="gh-code-card"><header><span /><span /><span /><small>hello.tsx</small></header><div><p><em>const</em> developer = &#123;</p><p>&nbsp; name: <strong>"Hamid"</strong>,</p><p>&nbsp; stack: [<strong>"React"</strong>, <strong>"TS"</strong>],</p><p>&nbsp; loves: <strong>"good interfaces"</strong></p><p>&#125;;</p><p className="gh-code-comment">// always building something</p></div><footer><span /> React + TypeScript</footer></div></div>
        </section>

        <section className="gh-bio"><span className="gh-label">A BIT ABOUT ME</span><p dir="rtl" className="persian">{profile.bio}</p></section>
        <section className="gh-toolkit" ref={stack}>
          <div className="gh-section-heading"><div><span className="gh-label">THE TOOLS BEHIND THE WORK</span><h3>My toolkit<span>.</span></h3></div><span>{profile.skills.length} technologies</span></div>
          <div className="gh-toolkit-grid">{profile.skills.map(skill => {
            const tech = toolkit[skill];
            return <div className="gh-tech" key={skill} style={{ "--tech-color": tech?.color || "#6ee7b7" } as CSSProperties}><div className={"gh-tech-icon " + (tech?.icon === "nextjs" || tech?.icon === "threejs" ? "gh-tech-mono" : "")}>{tech?.icon ? <img src={asset("assets/toolkit/" + tech.icon + ".svg")} alt={skill + " logo"} /> : <Network size={30} />}</div><strong>{skill}</strong><small>{tech?.category || "Technology"}</small></div>;
          })}</div>
        </section>

        <section className="gh-work" ref={work}>
          <div className="gh-section-heading"><div><span className="gh-label">SELECTED PROJECTS</span><h3>Things I’ve built<span>.</span></h3></div><button onClick={() => os.openApp("projects")}>All projects <ArrowUpRight size={15} /></button></div>
          <div className="gh-project-grid">{projects.map(p => <button className="gh-project" key={p.id} onClick={() => { os.setSelectedProject(p.id); os.openApp("projects"); }}><ProjectPreview project={p} /><div className="gh-project-body"><small>{p.category}</small><h4>{p.title}<ArrowUpRight size={17} /></h4><p dir="rtl">{p.summary}</p><footer>{p.tags.slice(0, 3).map(t => <span key={t}>{t}</span>)}</footer></div></button>)}</div>
        </section>
        <footer className="gh-footer"><span><Code2 size={14} /> Made with care, in Tehran.</span><button onClick={() => os.openApp("contacts")}>Let’s build something together <ArrowUpRight size={14} /></button></footer>
      </main>
    </div>
  );
}
