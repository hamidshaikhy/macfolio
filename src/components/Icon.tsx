import { integratedApp } from "../lib/integrated-apps";
import { appById, type AppId } from "../lib/apps";
import { asset } from "../lib/assets";
export function AppIcon({
  id,
  size = 56,
}: {
  id: AppId | "launchpad" | "github" | "music";
  size?: number;
}) {
  if (id === "calendar") return <span className="calendar-app-icon app-icon" style={{width:size,height:size}}><small>{new Date().toLocaleDateString("en-US",{timeZone:"Asia/Tehran",weekday:"short"})}</small><strong>{new Date().toLocaleDateString("en-US",{timeZone:"Asia/Tehran",day:"numeric"})}</strong></span>;
  if (id === "chess")
    return (
      <span
        className="chess-icon app-icon"
        style={{ width: size, height: size }}
      >
        <img src={asset("assets/chess/wN.svg")} alt="" draggable={false} />
      </span>
    );
  const integrated = integratedApp(id);
  if (integrated) return <img className="app-icon" src={asset(integrated.icon)} style={{width:size,height:size}} alt="" draggable={false}/>;
  const icon =
    id === "music"
      ? "apple-music"
      : id === "launchpad" || id === "github"
        ? id
        : appById(id).icon;
  return (
    <img
      className="app-icon"
      src={asset(`assets/icons/${icon}.${["calculator", "about", "calendar", "contacts"].includes(icon) ? "svg" : "webp"}`)}
      style={{ width: size, height: size }}
      alt=""
      draggable={false}
    />
  );
}
