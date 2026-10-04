import { Mail, Phone, Github, Linkedin, MapPin, Copy, Check, MessageCircle } from "lucide-react";
import { useState } from "react";
import { profile } from "../lib/content";
import { asset } from "../lib/assets";
import { useOS } from "../state/os";

export default function Contacts() {
  const [copied, setCopied] = useState("");
  const os = useOS();
  const details = [
    { label: "mobile", value: profile.phoneDisplay, copyValue: profile.phone, icon: Phone, href: "tel:" + profile.phone },
    { label: "email", value: profile.email, icon: Mail, href: "mailto:" + profile.email },
    { label: "github", value: "github.com/hamidshaikhy", icon: Github, app: "github" as const },
    { label: "linkedin", value: "linkedin.com/in/hamid-shaikhy", icon: Linkedin, app: "linkedin" as const },
    { label: "location", value: profile.location, icon: MapPin },
  ];

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
    } catch {
      os.notify("Could not copy. Select and copy the contact text.");
    }
  }

  return (
    <div className="contacts-app">
      <div className="contact-hero">
        <img src={asset("assets/avatar.png")} alt={profile.name} />
        <span className="eyebrow">LET’S BUILD SOMETHING GREAT</span>
        <h1>{profile.name}</h1>
        <p>{profile.title} / {profile.location}</p>
        <div className="contact-actions">
          <a href={"tel:" + profile.phone} aria-label="Call Hamid"><Phone /></a>
          <a href={"mailto:" + profile.email} aria-label="Email Hamid"><Mail /></a>
          <button aria-label="Open GitHub profile" onClick={() => os.openApp("github")}><Github /></button>
          <button aria-label="Open LinkedIn profile" onClick={() => os.openApp("linkedin")}><Linkedin /></button>
        </div>
      </div>
      <div className="contact-details">
        {details.map(({ label, value, copyValue, icon: Icon, href, app }) => (
          <div className="contact-row" key={label}>
            <Icon size={21} />
            <div>
              <small>{label}</small>
              {href ? <a dir="ltr" href={href}>{value}</a> : app ? <button onClick={() => os.openApp(app)}>{value}</button> : <span>{value}</span>}
            </div>
            <button className="contact-copy" aria-label={"Copy " + label} onClick={() => void copy(copyValue || value)}>
              {copied === (copyValue || value) ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        ))}
      </div>
      <div className="contact-note"><MessageCircle size={18} /><span>Have an idea or a project in mind? Let’s talk.</span></div>
    </div>
  );
}
