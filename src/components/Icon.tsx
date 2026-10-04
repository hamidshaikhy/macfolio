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
  const icon =
    id === "music"
      ? "apple-music"
      : id === "launchpad" || id === "github"
        ? id
        : appById(id).icon;
  return (
    <img
      className="app-icon"
      src={asset(`assets/icons/${icon}.${["calculator", "linkedin", "about", "calendar", "contacts"].includes(icon) ? "svg" : "png"}`)}
      style={{ width: size, height: size }}
      alt=""
      draggable={false}
    />
  );
}
