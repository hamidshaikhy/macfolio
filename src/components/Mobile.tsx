import { integratedApp } from "../lib/integrated-apps";
import {
  LockKeyhole,
  ChevronLeft,
  Search,
  CalendarDays,
  Layers,
  FileText,
  SlidersHorizontal,
} from "lucide-react";
import { useClock, tehranDate } from "../lib/hooks";
import { useOS } from "../state/os";
import { apps, appById, type AppId } from "../lib/apps";
import { AppIcon } from "./Icon";
import { AppView } from "../apps/AppView";
import { LockScreen } from "./LockScreen";
import { asset } from "../lib/assets";
const mobileDock: AppId[] = ["finder", "safari", "calculator", "contacts"];
// About, Projects and Preview retain their existing widget/quick-link entry points.
const homeApps: ReturnType<typeof appById>[] = (["terminal", "editor", "calendar", "github", "barg", "hamnava", "personal-finance", "todo", "koja-berim", "chess", "settings", "trash"] as AppId[]).map(appById);
export function Mobile() {
  const os = useOS();
  const now = useClock();
  return (
    <div
      className={`ios-shell ${os.mobileApp && !os.locked ? "app-open" : ""}`}
    >
      <header className="ios-status" aria-label="macfolio controls">
        <button aria-label="Lock screen" onClick={() => os.setLocked(true)}>
          <LockKeyhole size={18} />
        </button>
        <strong>macfolio</strong>
        <button
          aria-label="Open Control Center"
          className="ios-status-right"
          onClick={() => os.setPanel(os.panel === "control" ? null : "control")}
        >
          <SlidersHorizontal size={20} />
        </button>
      </header>
      {os.locked ? (
        <LockScreen mobile />
      ) : os.mobileApp ? (
        <section className={`ios-app app-${os.mobileApp}`}>
          <header className="ios-app-header">
            <button aria-label="Back to home" onClick={os.home}>
              <ChevronLeft size={21} /> Home
            </button>
            <strong>{appById(os.mobileApp).name}</strong>
            <div className="ios-app-actions">
            {os.mobileApp==='about'?<a className="window-portfolio-link" aria-label="OPEN FULL PORTFOLIO" href={asset('portfolio')} target="_blank" rel="noopener noreferrer">FULL PORTFOLIO</a>:integratedApp(os.mobileApp)?<a className="window-portfolio-link" href={integratedApp(os.mobileApp)!.path} target="_blank" rel="noopener noreferrer">OPEN FULL</a>:null}
            <button
              aria-label="Open Control Center"
              onClick={() => os.setPanel("control")}
            >
              <SlidersHorizontal size={19} />
            </button>
            </div>
          </header>
          <div className="ios-app-content">
            {!integratedApp(os.mobileApp) && <AppView key={os.mobileApp} id={os.mobileApp} />}
          </div>
        </section>
      ) : (
        <main className="ios-home">
          <div className="ios-home-scroll">
          <div className="ios-widgets">
            <button
              className="ios-profile-widget"
              aria-label="About Hamid"
              onClick={() => os.openApp("about")}
            >
              <img src={asset("assets/avatar.webp")} alt="Hamid Shaikhy" />
              <strong>Hamid Shaikhy</strong>
              <span>Front-End Developer</span>
            </button>
            <button
              className="ios-clock-widget"
              aria-label="Open Calendar"
              onClick={() => os.openApp("calendar")}
            >
              <span>TEHRAN</span>
              <strong>
                {tehranDate(now, {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </strong>
              <small>
                {tehranDate(now, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </small>
              <CalendarDays size={15} />
            </button>
          </div>
          <div className="ios-quick-links">
            <button aria-label="Selected work" onClick={() => os.openApp("projects")}><Layers size={14} /> Selected work</button>
            <button aria-label="My résumé" onClick={() => os.openApp("resume")}><FileText size={14} /> My résumé</button>
          </div>
          <div className="ios-app-grid" aria-label="Home apps">
            {homeApps
              .map((a) => (
                <button key={a.id} aria-label={a.name} onClick={() => os.openApp(a.id)}>
                  <AppIcon id={a.id} size={64} />
                  <span>{a.name === "About Hamid" ? "About" : a.name}</span>
                </button>
              ))}
          </div>
          <button
            className="ios-search"
            onClick={() => os.setPanel("spotlight")}
          >
            <Search size={13} /> Search
          </button>
          </div>
          <div className="ios-dock">
            {mobileDock.map((a) => (
              <button
                key={a}
                aria-label={appById(a).name}
                onClick={() =>
                  os.openApp(a)
                }
              >
                <AppIcon id={a} size={65} />
              </button>
            ))}
          </div>
        </main>
      )}
      {os.windows.filter(win=>integratedApp(win.app)).sort((a,b)=>apps.findIndex(app=>app.id===a.app)-apps.findIndex(app=>app.id===b.app)).map(win=><div key={win.app} className="ios-embedded-runtime" hidden={os.mobileApp!==win.app || os.locked}><AppView id={win.app}/></div>)}
    </div>
  );
}
