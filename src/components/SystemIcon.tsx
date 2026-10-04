import type { CSSProperties } from "react";
export type SystemSymbol = "wifi" | "bluetooth" | "battery" | "spotlight" | "control" | "volume" | "mute" | "focus" | "appearance" | "airdrop" | "display";
/** A single optical family for system chrome. Original SVG silhouettes. */
export function SystemIcon({ name, size = 18, style }: { name: SystemSymbol; size?: number; style?: CSSProperties }) {
  const path = {
    wifi: <><path d="M2 8.3a17.7 17.7 0 0 1 20 0l-1.7 2.2a14.8 14.8 0 0 0-16.6 0zM5.5 12.8a11.8 11.8 0 0 1 13 0l-1.8 2.3a8.8 8.8 0 0 0-9.4 0zM9 17.3a5.5 5.5 0 0 1 6 0L12 21z" /></>,
    bluetooth: <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m6 7 12 10-6 5V2l6 5L6 17" />,
    battery: <><rect x="1" y="6.5" width="19" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" /><rect className="battery-fill" x="3" y="8.5" width="15" height="7" rx="1.3" fill="#34c759" /><path className="battery-bolt" d="m12 7-5 6h4l-1 4 6-7h-4z" fill="white" /><path d="M21.5 10v4c2 0 2-4 0-4" /></>,
    spotlight: <><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></>,
    control: <><rect x="3" y="3" width="18" height="7" rx="3.5" /><circle cx="7" cy="6.5" r="2" fill="var(--symbol-hole, var(--titlebar))" /><rect x="3" y="14" width="18" height="7" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.7" /><circle cx="17" cy="17.5" r="2" /></>,
    volume: <><path d="M3 9h4l6-5v16l-6-5H3z" /><path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></>,
    mute: <><path d="M3 9h4l6-5v16l-6-5H3z" /><path d="m17 9 5 6m0-6-5 6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></>,
    focus: <path d="M20.5 14.5A9 9 0 0 1 9.5 3.4 9.4 9.4 0 1 0 20.5 14.5" />,
    appearance: <><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 3a9 9 0 0 1 0 18z" /></>,
    airdrop: <><path d="M8 19a8 8 0 1 1 8 0M10 15a4 4 0 1 1 4 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="m12 13-4 8h8z" /></>,
    display: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>,
  }[name];
  return <svg className="system-symbol" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={style}>{path}</svg>;
}
