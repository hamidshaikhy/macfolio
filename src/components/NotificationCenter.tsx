import { Mail, Layers, Github, CalendarDays } from "lucide-react";
import { useClock, tehranDate } from "../lib/hooks";

const notifications = [
  { app: "MAIL", time: "12m ago", title: "A new collaboration", message: "Hi Hamid, we'd love to discuss a React interface for our next project. Let's find a time to talk.", icon: Mail, color: "#0a84ff" },
  { app: "PROJECTS", time: "38m ago", title: "Dika Asia · ready for review", message: "The responsive pages and multilingual interface are ready for a final look.", icon: Layers, color: "#bf7a36" },
  { app: "GITHUB", time: "1h ago", title: "Flow Studio · a little progress", message: "A fresh milestone: the workflow editor, templates and project gallery are looking good.", icon: Github, color: "#6855a9" },
  { app: "CALENDAR", time: "Today", title: "Make time for good ideas", message: "Portfolio review at 4:00 PM. A few details, a fresh perspective and one more polish.", icon: CalendarDays, color: "#ff375f" },
];

export function NotificationCenter() {
  const now = useClock();
  return <aside className="notification-center" role="dialog" aria-label="Notification Center">
    <header className="notification-center-header">
      <p>{tehranDate(now, { weekday: "long", month: "long", day: "numeric" })}</p>
      <time>{tehranDate(now, { hour: "2-digit", minute: "2-digit", hour12: false })}</time>
      <span>Demo notifications</span>
    </header>
    <div className="notification-center-list">{notifications.map(({ app, time, title, message, icon: Icon, color }) =>
      <article className="notification-card" key={app}>
        <div className="notification-card-meta"><span className="notification-app-icon" style={{ background: color }}><Icon size={14} /></span><span>{app}</span><small>{time}</small></div>
        <h3>{title}</h3><p>{message}</p>
      </article>
    )}</div>
  </aside>;
}
