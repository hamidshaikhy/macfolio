import { useRef, useState, useEffect } from "react";
import { AppIcon } from "./Icon";
import { memo } from "react";
import { dockApps } from "../lib/apps";
import { useOS } from "../state/os";

import { magnification } from "../lib/dock";
import { useReducedMotion } from "../lib/hooks";
const items = [{ id: "launchpad", name: "Launchpad" }, ...dockApps, { id: "trash", name: "Trash" }] as const;
export const Dock = memo(function Dock() {
  const running = useOS(s => s.windows.map(w => w.app).sort().join(","));
  const dockSize = useOS(s => s.dockSize);
  const enabled = useOS(s => s.dockMagnification);
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(window.innerWidth);
  const [scales, setScales] = useState<number[]>([]);
  const raf = useRef(0);
  const [hover, setHover] = useState<string | null>(null);
  useEffect(() => { const resize = () => { setWidth(window.innerWidth); setScales([]); }; window.addEventListener("resize", resize); return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf.current); }; }, []);
  const size = Math.max(30, Math.min(dockSize, Math.floor((width - 155) / items.length) - 6));
  const base = size + 6;
  return <nav className="dock" aria-label="Dock" style={{ height: size + 25 }} onPointerMove={event => {
    if (event.pointerType === "touch" || reduced || !enabled) return;
    const x = event.clientX - width / 2;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const raw = items.map((_, index) => magnification(x - (index - (items.length - 1) / 2) * base));
      const growth = raw.reduce((total, scale) => total + (scale - 1) * size, 0);
      const budget = Math.max(0, width - 48 - (items.length * base + 48));
      const factor = growth ? Math.min(1, budget / growth) : 1;
      setScales(raw.map(scale => 1 + (scale - 1) * factor));
    });
  }} onPointerLeave={() => { cancelAnimationFrame(raf.current); setScales([]); setHover(null); }}>
    {items.map((item, index) => {
      const scale = reduced || !enabled ? 1 : scales[index] || 1;
      return <div className={`dock-slot ${item.id === "trash" ? "dock-separator" : ""}`} key={item.id} style={{ width: base + (scale - 1) * size, height: size + 14 }} onPointerEnter={() => setHover(item.id)}>
        <button className="dock-button" aria-label={item.name} style={{ transform: `translateY(${-((scale - 1) * 20)}px) scale(${scale})` }} onFocus={() => setHover(item.id)} onBlur={() => setHover(null)} onClick={() => { const os = useOS.getState(); item.id === "launchpad" ? os.setPanel(os.panel === "launchpad" ? null : "launchpad") : os.openApp(item.id); }}><AppIcon id={item.id} size={size} /></button>
        <span className="dock-tooltip" style={{ opacity: hover === item.id ? 1 : 0, bottom: size * scale + (scale - 1) * 20 + 12 }}>{item.name}</span>
        <span className={`dock-dot ${running.split(",").includes(item.id) ? "running" : ""}`} />
      </div>;
    })}
  </nav>;
});
