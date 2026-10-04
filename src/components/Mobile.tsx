import {
  Wifi,
  Signal,
  ChevronLeft,
  Search,
  CalendarDays,
  Layers,
  FileText,
  SlidersHorizontal,
} from "lucide-react";
import { useRef } from "react";
import { useClock, tehranDate } from "../lib/hooks";
import { useOS } from "../state/os";
import { dockApps, appById, type AppId } from "../lib/apps";
import { AppIcon } from "./Icon";
import { AppView } from "../apps/AppView";
import { LockScreen } from "./LockScreen";
import { asset } from "../lib/assets";
import { SystemIcon } from "./SystemIcon";
const mobileDock: AppId[] = ["finder", "safari", "calculator", "linkedin"];
const homeApps = [...dockApps.filter(app => !mobileDock.includes(app.id)), appById("trash")];
export function Mobile() {
  const os = useOS();
  const now = useClock();
  const touch = useRef(0);
  return (
    <div
      className={`ios-shell ${os.mobileApp && !os.locked ? "app-open" : ""}`}
    >
      <header className="ios-status">
        <button aria-label="Lock screen" onClick={() => os.setLocked(true)}>
          {tehranDate(now, {
            hour: "numeric",
            minute: "2-digit",
            hour12: false,
          })}
        </button>
        <div className="dynamic-island" />
        <button
          aria-label="Open Control Center"
          className="ios-status-right"
          onPointerDown={(e) => {
            touch.current = e.clientY;
          }}
          onPointerUp={(e) => {
            if (e.clientY - touch.current > 25) os.setPanel("control");
          }}
          onClick={() => os.setPanel(os.panel === "control" ? null : "control")}
        >
          <Signal size={17} fill="currentColor" />
          <Wifi size={18} />
          <SystemIcon name="battery" size={26} />
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
            <button
              aria-label="Open Control Center"
              onClick={() => os.setPanel("control")}
            >
              <SlidersHorizontal size={19} />
            </button>
          </header>
          <div className="ios-app-content">
            <AppView id={os.mobileApp} />
          </div>
        </section>
      ) : (
        <main className="ios-home">
          <div className="ios-widgets">
            <button
              className="ios-profile-widget"
              aria-label="About Hamid"
              onClick={() => os.openApp("about")}
            >
              <img src={asset("assets/avatar.png")} alt="Hamid Shaikhy" />
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
      <button
        className="home-indicator"
        aria-label={os.locked ? "Unlock" : "Return to home"}
        onClick={() => (os.locked ? os.setLocked(false) : os.home())}
        onPointerDown={(e) => {
          touch.current = e.clientY;
        }}
        onPointerUp={(e) => {
          if (touch.current - e.clientY > 20) {
            os.setLocked(false);
            os.home();
          }
        }}
      >
        <span />
      </button>
    </div>
  );
}
