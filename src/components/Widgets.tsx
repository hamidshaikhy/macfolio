import { MapPin, Github, FileText } from "lucide-react";
import { useClock, tehranDate } from "../lib/hooks";
import { useOS } from "../state/os";
import { asset } from "../lib/assets";
import { projects } from "../lib/content";
export function Widgets() {
  const now = useClock();
  const openApp = useOS(s => s.openApp);
  const day = Number(tehranDate(now, { day: "numeric" }));
  const local = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Tehran" }),
  );
  const first = new Date(local.getFullYear(), local.getMonth(), 1).getDay();
  const days = new Date(local.getFullYear(), local.getMonth() + 1, 0).getDate();
  return (
    <aside className="widgets" aria-label="Desktop widgets">
      <div className="widget clock-widget">
        <div className="widget-label">
          <MapPin size={13} /> Tehran, Iran
        </div>
        <div className="widget-time">
          {tehranDate(now, {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </div>
        <div className="widget-meta">
          {tehranDate(now, { weekday: "long", month: "long", day: "numeric" })}
        </div>
        <span className="tz-label">IRST · UTC +3:30</span>
      </div>
      <button className="widget calendar-widget" aria-label="Open Calendar" onClick={() => openApp("calendar")}>
        <div className="calendar-title">
          {tehranDate(now, { month: "long", year: "numeric" })}
        </div>
        <div className="calendar-grid">
          {"SMTWTFS".split("").map((d, i) => (
            <span className="calendar-day" key={`d${i}`}>
              {d}
            </span>
          ))}
          {Array.from({ length: first }, (_, i) => (
            <span key={`e${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => (
            <span className={day === i + 1 ? "today" : ""} key={i}>
              {i + 1}
            </span>
          ))}
        </div>
      </button>
      <button
        className="widget profile-widget"
        onClick={() => openApp("about")}
      >
        <img src={asset("assets/avatar.png")} alt="Hamid Shaikhy avatar" />
        <div>
          <strong>Hamid Shaikhy</strong>
          <span>Front-End Developer</span>
        </div>
      </button>
      <div className="widget quick-widget">
        <button onClick={() => openApp("projects")}>
          <Github size={19} />
          <span>
            <strong>Selected work</strong>
            <small>{projects.length} projects</small>
          </span>
        </button>
        <button onClick={() => openApp("resume")}>
          <FileText size={19} />
          <span>
            <strong>My résumé</strong>
            <small>Open in Preview</small>
          </span>
        </button>
      </div>
    </aside>
  );
}
