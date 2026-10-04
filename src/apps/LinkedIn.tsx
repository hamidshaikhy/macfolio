import { BriefcaseBusiness, ExternalLink, FileText, Github, Mail, MapPin, GraduationCap } from "lucide-react";
import { profile, projects } from "../lib/content";
import { useOS } from "../state/os";
import { asset } from "../lib/assets";
export default function LinkedIn() {
  const open = useOS(s => s.openApp);
  return <div className="linkedin-app">
    <header className="linkedin-toolbar"><span className="linkedin-wordmark">in</span><strong>Professional profile</strong><a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="secondary-button"><ExternalLink size={15} /> View on LinkedIn</a></header>
    <main className="linkedin-scroll">
      <section className="linkedin-profile"><div className="linkedin-cover"><span>Hamid Shaikhy</span><span>Front-End Development</span></div><div className="linkedin-identity"><img src={asset("assets/avatar.png")} alt={profile.name} /><h1>{profile.name}</h1><p>{profile.title}</p><span className="location"><MapPin size={14} />{profile.location}</span><div className="linkedin-actions"><a className="primary-button" href={`mailto:${profile.email}`}><Mail size={16} /> Contact</a><button className="secondary-button" onClick={() => open("resume")}><FileText size={16} /> View résumé</button><button className="secondary-button" onClick={() => open("github")}><Github size={16} /> GitHub</button></div></div></section>
      <section className="linkedin-section"><h2>About</h2><p className="persian" dir="rtl">{profile.bio}</p></section>
      <section className="linkedin-section"><h2>Experience</h2><div className="linkedin-experience"><span className="experience-mark"><BriefcaseBusiness size={25} /></span><div><h3>Front-End Developer</h3><strong>Dika Asia · Contract</strong><small className="persian" dir="rtl">تیر تا مهر ۱۴۰۵ · تهران — مطابق رزومهٔ ارائه‌شده</small><p className="persian" dir="rtl">طراحی و توسعهٔ فرانت‌اند محصولات دیجیتال با React؛ ساخت کامپوننت‌های قابل استفادهٔ مجدد، رابط‌های واکنش‌گرا و RTL و اتصال به APIهای Django. توسعهٔ وب‌سایت شرکتی و رابط پنل مدیریت مالی و عملیات.</p><button className="text-button" onClick={() => { useOS.getState().setSelectedProject("dika"); open("projects"); }}>View project <ExternalLink size={14} /></button></div></div></section>
      <section className="linkedin-section"><h2>Skills</h2><div className="skill-tags" dir="ltr">{profile.skills.map(skill => <span key={skill}>{skill}</span>)}</div></section>
      <section className="linkedin-section"><h2>Education</h2><div className="linkedin-experience"><span className="experience-mark"><GraduationCap size={25} /></span><div className="persian" dir="rtl"><h3>کارشناسی مهندسی کامپیوتر</h3><p>گرایش مهندسی نرم‌افزار · دانشگاه آزاد تبریز</p></div></div></section>
      <section className="linkedin-section"><h2>Projects</h2><div className="linkedin-projects">{projects.map(project => <button key={project.id} onClick={() => { useOS.getState().setSelectedProject(project.id); open("projects"); }}><span className="project-monogram" style={{ background: project.color }}>{project.monogram}</span><div><strong>{project.title}</strong><small className="persian" dir="rtl">{project.summary}</small></div><ExternalLink size={16} /></button>)}</div></section>
      <p className="profile-source">Curated from the supplied résumé · <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">Visit the original LinkedIn profile</a></p>
    </main>
  </div>;
}
