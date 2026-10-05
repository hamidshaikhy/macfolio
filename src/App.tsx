import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  Search,
  Lock,
  Info,
  Monitor,
  Sun,
  Moon,
  Plus,
  FileText,
} from "lucide-react";
import { useOS } from "./state/os";
import { useFiles } from "./state/files";
import { useMobile, useReducedMotion } from "./lib/hooks";
import { asset } from "./lib/assets";
import { apps, type AppId } from "./lib/apps";
import { useMusic, setAudioVolume } from "./state/music";
import { MenuBar } from "./components/MenuBar";
import { Window } from "./components/Window";
import { Dock } from "./components/Dock";
import { Widgets } from "./components/Widgets";
import { ControlCenter } from "./components/ControlCenter";
import { Spotlight } from "./components/Spotlight";
import { AppIcon } from "./components/Icon";
import { AppView } from "./apps/AppView";
import { Mobile } from "./components/Mobile";
import { LockScreen } from "./components/LockScreen";
import { registerOSTools } from "./lib/webmcp";
import { AppMenu } from "./components/AppMenu";
import { NotificationCenter } from "./components/NotificationCenter";
export default function App() {
  const os = useOS();
  const mobile = useMobile();
  const reducedMotion = useReducedMotion();
  const initialized = useRef(false);
  const [context, setContext] = useState<{ x: number; y: number } | null>(null);
  const [launchQuery, setLaunchQuery] = useState("");
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      if (!mobile) os.openApp("about");
    }
    const fit = () => useOS.getState().fitWindows();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = os.theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", os.theme === "light" ? "#cddfeb" : "#131b3a");
  }, [os.theme]);
  useEffect(() => useMusic.getState().init(), []);
  useEffect(() => setAudioVolume(os.volume), [os.volume]);
  useEffect(() => registerOSTools(), []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const s = useOS.getState();
      if (e.key === "Escape") {
        s.setPanel(null);
        setContext(null);
      }
      if (e.metaKey && e.ctrlKey && e.key.toLowerCase() === "q") {
        e.preventDefault();
        s.setLocked(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.code === "Space") {
        e.preventDefault();
        s.setPanel(s.panel === "spotlight" ? null : "spotlight");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n" && !s.locked) {
        e.preventDefault();
        s.setSelectedFile(useFiles.getState().createNote());
        s.openApp("notes");
      }
      if ((e.metaKey || e.ctrlKey) && ["w", "m"].includes(e.key) && !s.locked) {
        const active = s.windows.filter((w) => !w.minimized).at(-1);
        if (active) {
          e.preventDefault();
          if (e.key === "w") {
            s.closeApp(active.app);
          } else s.minimize(active.app);
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (!os.notification) return;
    const id = setTimeout(() => os.notify(null), 4200);
    return () => clearTimeout(id);
  }, [os.notification]);
  function open(app: AppId) {
    os.openApp(app);
    setContext(null);
  }
  return (
    <div
      className={`os-root ${mobile ? "mobile" : "desktop"} ${reducedMotion ? "reduce-motion" : ""} ${os.focusMode ? "focus-mode" : ""} ${os.panel === "spotlight" ? "spotlight-open" : ""}`}
      data-testid="os-root"
    >
      <div className="wallpaper wallpaper-light" style={{ backgroundImage: `url("${asset(`assets/wallpapers/${os.wallpaper === "dynamic" ? "light" : os.wallpaper}.jpg`)}")` }} />
      <div className="wallpaper wallpaper-dark" style={{ backgroundImage: `url("${asset(`assets/wallpapers/${os.wallpaper === "dynamic" ? "dark" : os.wallpaper}.jpg`)}")` }} />
      <div
        className="display-dimmer"
        style={{ opacity: (1 - os.brightness) * 0.7 }}
      />
      {mobile ? (
        <Mobile />
      ) : (
        <>
          <MenuBar />
          {os.locked ? (
            <LockScreen mobile={false} />
          ) : (
            <main
              className="desktop-surface"
              aria-label="macfolio desktop"
              onContextMenu={(e) => {
                if (!(e.target as HTMLElement).closest(".os-window")) {
                  e.preventDefault();
                  os.setPanel(null);
                  setContext({
                    x: Math.min(e.clientX, window.innerWidth - 250),
                    y: Math.min(e.clientY, window.innerHeight - 210),
                  });
                }
              }}
            >
              <Widgets />
              {os.windows.map((win, i) => (
                <Window key={win.app} win={win} z={10 + i}>
                  <AppView id={win.app} />
                </Window>
              ))}
              <Dock />
            </main>
          )}
        </>
      )}
      {os.panel && (
        <div
          className={`panel-backdrop ${os.panel === "launchpad" ? "launchpad-backdrop" : os.panel === "spotlight" ? "spotlight-backdrop" : ""}`}
          onClick={() => os.setPanel(null)}
        />
      )}
      {os.panel === "control" && <ControlCenter mobile={mobile} />}
      {os.panel === "spotlight" && <Spotlight />}
      {(os.panel === "file" ||
        os.panel === "edit" ||
        os.panel === "view" ||
        os.panel === "window" ||
        os.panel === "help") && <AppMenu key={os.panel} menu={os.panel} />}
      {os.panel === "apple" && (
        <div className="apple-menu menu-popover" role="menu">
          <button role="menuitem" onClick={() => open("settings")}>
            <Info size={16} />
            About macfolio
          </button>
          <hr />
          <button role="menuitem" onClick={() => open("settings")}>
            System Settings…
          </button>
          <button role="menuitem" onClick={() => os.setPanel("launchpad")}>
            Applications <ChevronRight size={15} />
          </button>
          <hr />
          <button
            role="menuitem"
            onClick={() => {
              os.setPanel(null);
              os.windows.forEach((w) => os.minimize(w.app));
            }}
          >
            Show Desktop
          </button>
          <button role="menuitem" onClick={() => os.setLocked(true)}>
            <Lock size={16} />
            Lock Screen <kbd>⌃⌘Q</kbd>
          </button>
        </div>
      )}
      {os.panel === "launchpad" && (
        <section className="launchpad" role="dialog" aria-label="Launchpad">
          <div className="launchpad-search">
            <Search size={17} />
            <input
              placeholder="Search"
              aria-label="Search Launchpad"
              value={launchQuery}
              onChange={(e) => setLaunchQuery(e.target.value)}
            />
          </div>
          <div className="launchpad-grid">
            {apps
              .filter((a) =>
                a.name.toLowerCase().includes(launchQuery.toLowerCase()),
              )
              .map((a) => (
                <button key={a.id} onClick={() => open(a.id)}>
                  <AppIcon id={a.id} size={85} />
                  <span>{a.name}</span>
                </button>
              ))}
          </div>
          <button className="launchpad-close" onClick={() => os.setPanel(null)}>
            Back to desktop
          </button>
        </section>
      )}
      {os.panel === "notifications" && <NotificationCenter />}
      {context && (
        <>
          <div className="context-backdrop" onClick={() => setContext(null)} />
          <div
            className="context-menu menu-popover"
            style={{ left: context.x, top: context.y }}
          >
            <button
              onClick={() => {
                os.setSelectedFile(useFiles.getState().createNote());
                open("notes");
              }}
            >
              <Plus size={16} />
              New Note
            </button>
            <button onClick={() => open("resume")}>
              <FileText size={16} />
              Open Résumé
            </button>
            <hr />
            <button
              onClick={() => {
                os.setTheme(os.theme === "light" ? "dark" : "light");
                setContext(null);
              }}
            >
              {os.theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              Switch to {os.theme === "light" ? "Dark" : "Light"}
            </button>
            <button onClick={() => open("settings")}>
              <Monitor size={16} />
              Change Appearance…
            </button>
          </div>
        </>
      )}
      {os.notification && !os.focusMode && (
        <div className="notification" role="status">
          <AppIcon id="about" size={34} />
          <div>
            <strong>macfolio</strong>
            <span>{os.notification}</span>
          </div>
          <button
            aria-label="Dismiss notification"
            onClick={() => os.notify(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
