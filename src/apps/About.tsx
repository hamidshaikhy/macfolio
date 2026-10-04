import { ArrowUpRight, ArrowRight, FileText, Github, Mail, MapPin, Code2 } from "lucide-react";
import { profile, projects } from "../lib/content";
import { toolkit } from "../lib/toolkit";
import { useOS } from "../state/os";
import { asset } from "../lib/assets";
import { ProjectPreview } from "../components/ProjectPreview";

export default function About() {
  const openApp = useOS(s => s.openApp);
  return <div className="about-app welcome-app">
    <header className="welcome-header"><span><Code2 size={17} /><strong>HAMID</strong><i /> PERSONAL SPACE</span><button onClick={() => openApp("contacts")}><Mail size={15} /> Let’s talk <ArrowUpRight size={14} /></button></header>
    <section className="welcome-hero">
      <div className="welcome-visual">
        <div className="welcome-orbit welcome-orbit-one" /><div className="welcome-orbit welcome-orbit-two" />
        <div className="welcome-portrait"><img src={asset("assets/avatar.png")} alt={profile.name} /><div><strong>{profile.name}</strong><span><MapPin size={12} />{profile.location}</span></div></div>
        <span className="welcome-float welcome-float-react"><img src={asset("assets/toolkit/react.svg")} alt="React" /></span>
        <span className="welcome-float welcome-float-code"><Code2 size={21} /></span>
        <span className="welcome-visual-note"><span /> DESIGN MEETS DEVELOPMENT</span>
      </div>
      <div className="welcome-intro persian" dir="rtl"><span className="welcome-kicker">اینجا، دنیای کوچک من است.</span><h2>ایده‌های خوب،<br /><span>تجربه‌های بهتر.</span></h2><p>من حمید شیخی‌ام؛ توسعه‌دهندهٔ فرانت‌اند. با React ایده‌ها را به رابط‌هایی تبدیل می‌کنم که هم دیدنشان لذت‌بخش باشد، هم کار کردن با آن‌ها.</p><div className="welcome-actions"><button className="welcome-primary" onClick={() => { useOS.getState().setSelectedProject(null); openApp("projects"); }}>کارهایی که ساخته‌ام <ArrowUpRight size={17} /></button><button onClick={() => openApp("resume")}><FileText size={17} /> رزومهٔ من</button></div></div>
    </section>
    <section className="welcome-work"><div className="welcome-section-heading"><span>SELECTED WORK / 01</span><h3 className="persian" dir="rtl">از ایده تا چیزی که کار می‌کند</h3></div><div className="welcome-projects">{projects.map(project => <button key={project.id} onClick={() => { useOS.getState().setSelectedProject(project.id); openApp("projects"); }}><ProjectPreview project={project} /><div><strong>{project.title}</strong><ArrowUpRight size={16} /><small>{project.category}</small></div></button>)}</div></section>
    <section className="welcome-toolkit"><div><span>BUILT WITH</span><p className="persian" dir="rtl">ابزارها عوض می‌شوند؛ دقت به جزئیات می‌ماند.</p></div><div className="welcome-toolkit-icons">{profile.skills.filter(skill => toolkit[skill]?.icon).map(skill => <span key={skill} title={skill}><img className={["Next.js", "Three.js"].includes(skill) ? "toolkit-monochrome" : ""} src={asset("assets/toolkit/" + toolkit[skill].icon + ".svg")} alt={skill} /></span>)}</div></section>
    <footer className="welcome-footer"><span>Made with curiosity. Built with care.</span><button onClick={() => openApp("github")}><Github size={15} /> GitHub <ArrowRight size={13} /></button></footer>
  </div>;
}
