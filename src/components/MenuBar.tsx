import { useOS } from "../state/os";
import { appById } from "../lib/apps";
import { useClock, tehranDate } from "../lib/hooks";
import { SystemIcon } from "./SystemIcon";
export function MenuBar() {
  const os = useOS();
  const now = useClock();
  const active = os.windows.filter((w) => !w.minimized).at(-1)?.app;
  const toggle = (panel: typeof os.panel) =>
    os.setPanel(os.panel === panel ? null : panel);
  return (
    <header className="menubar">
      <div className="menu-left">
        <button
          className="apple-button"
          aria-label="Apple menu"
          aria-haspopup="menu"
          aria-expanded={os.panel === "apple"}
          onClick={() => toggle("apple")}
        >
          <span className="apple-logo" />
        </button>
        <button
          className="active-app"
          onClick={() => os.openApp(active ?? "about")}
        >
          {active ? appById(active).name : "Finder"}
        </button>
        {(["file", "edit", "view", "window", "help"] as const).map((menu) => (
          <button
            key={menu}
            className={os.panel === menu ? "selected" : ""}
            aria-haspopup="menu"
            aria-expanded={os.panel === menu}
            onClick={() => toggle(menu)}
          >
            {menu[0].toUpperCase() + menu.slice(1)}
          </button>
        ))}
      </div>
      <div className="menu-right">
        {os.focusMode && <SystemIcon name="focus" size={14} />}
        <button style={{opacity: os.bluetooth ? 1 : .45}} aria-label="Bluetooth" onClick={() => toggle("control")}>
          <SystemIcon name="bluetooth" size={15} />
        </button>
        <button style={{opacity: os.wifi ? 1 : .45}} aria-label="Wi-Fi" onClick={() => toggle("control")}>
          <SystemIcon name="wifi" size={17} />
        </button>
        <button aria-label="Sound" onClick={() => toggle("control")}>
          <SystemIcon name={os.volume ? "volume" : "mute"} size={17} />
        </button>
        <span className="battery" role="img" aria-label="Battery charging" title="Charging">
          <SystemIcon name="battery" size={25} />
        </span>
        <button aria-label="Spotlight" onClick={() => toggle("spotlight")}>
          <SystemIcon name="spotlight" size={16} />
        </button>
        <button
          aria-label="Control Center"
          className={os.panel === "control" ? "selected" : ""}
          onClick={() => toggle("control")}
        >
          <SystemIcon name="control" size={17} />
        </button>
        <button className="menubar-date" aria-label="Notification Center" aria-expanded={os.panel === "notifications"} onClick={() => toggle("notifications")}>
          {tehranDate(now, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}{" "}
          &nbsp;
          {tehranDate(now, {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </button>
      </div>
    </header>
  );
}
