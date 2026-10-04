import type { AppId } from "./apps";
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface OSWindow {
  app: AppId;
  rect: Rect;
  minimized: boolean;
  maximized: boolean;
}
export const viewport = () => ({ w: window.innerWidth, h: window.innerHeight });
export function clampRect(rect: Rect, size: { w: number; h: number }, app?: AppId): Rect {
  const w = Math.min(Math.max(app === "calculator" ? 280 : 420, rect.w), Math.max(280, size.w - 24));
  const h = Math.min(Math.max(320, rect.h), Math.max(240, size.h - 130));
  return {
    w,
    h,
    x: Math.min(Math.max(12, rect.x), Math.max(12, size.w - w - 12)),
    y: Math.min(Math.max(40, rect.y), Math.max(40, size.h - h - 90)),
  };
}
export function initialRect(app: AppId, index = 0): Rect {
  const v = viewport();
  const w = app === "about" ? 960 : app === "github" ? 1080 : app === "calculator" ? 320 : app === "chess" ? 840 : app === "terminal" ? 740 : 860;
  return clampRect(
    {
      x: app === "calculator" ? (v.w - w) / 2 : Math.max(280, (v.w - w) / 2 + 60) + index * 24,
      y: app === "calculator" ? (v.h - 510) / 2 - 20 : 88 + index * 24,
      w,
      h: app === "about" ? 660 : app === "github" ? 690 : app === "calculator" ? 510 : app === "chess" ? 600 : 580,
    },
    v,
    app,
  );
}
