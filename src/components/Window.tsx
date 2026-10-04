import { memo, useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { X, Minus, Maximize2 } from "lucide-react";
import { useOS } from "../state/os";
import { appById } from "../lib/apps";
import type { OSWindow } from "../lib/windows";
export const Window = memo(function Window({
  win,
  z,
  children,
}: {
  win: OSWindow;
  z: number;
  children: ReactNode;
}) {
  const os = useOS.getState();
  const active = useOS(s => s.windows.filter(w => !w.minimized).at(-1)?.app === win.app);
  const endGesture = useRef<(() => void) | null>(null);
  useEffect(() => () => endGesture.current?.(), []);
  function gesture(e: PointerEvent<HTMLElement>, resize = false) {
    if (
      e.button !== 0 ||
      win.maximized ||
      (!resize && (e.target as HTMLElement).closest("button,input,a"))
    )
      return;
    e.preventDefault();
    endGesture.current?.();
    os.focusApp(win.app);
    const start = { x: e.clientX, y: e.clientY, rect: { ...win.rect } };
    e.currentTarget.setPointerCapture(e.pointerId);
    const target = e.currentTarget;
    const move = (ev: globalThis.PointerEvent) => {
      const dx = ev.clientX - start.x,
        dy = ev.clientY - start.y;
      os.moveWindow(
        win.app,
        resize
          ? { ...start.rect, w: start.rect.w + dx, h: start.rect.h + dy }
          : { ...start.rect, x: start.rect.x + dx, y: start.rect.y + dy },
      );
    };
    const end = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", end);
      target.removeEventListener("pointercancel", end);
      endGesture.current = null;
    };
    endGesture.current = end;
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", end);
    target.addEventListener("pointercancel", end);
  }
  return (
    <section
      role="dialog"
      aria-label={appById(win.app).name}
      className={`os-window ${active ? "active" : ""} ${win.maximized ? "maximized" : ""} app-${win.app}`}
      style={
        win.maximized
          ? {
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
              zIndex: 205,
            }
          : {
              left: win.rect.x,
              top: win.rect.y,
              width: win.rect.w,
              height: win.rect.h,
              zIndex: z,
            }
      }
      onPointerDown={() => os.focusApp(win.app)}
      hidden={win.minimized}
    >
      <header
        className="window-titlebar"
        onPointerDown={gesture}
        onDoubleClick={(e) => {
          if (!(e.target as HTMLElement).closest("button"))
            os.maximize(win.app);
        }}
      >
        <div className="traffic-lights">
          <button
            className="close"
            aria-label={`Close ${appById(win.app).name}`}
            onClick={() => os.closeApp(win.app)}
          >
            <X size={9} />
          </button>
          <button
            className="minimize"
            aria-label={`Minimize ${appById(win.app).name}`}
            onClick={() => os.minimize(win.app)}
          >
            <Minus size={9} />
          </button>
          <button
            className="maximize"
            aria-label={`Maximize ${appById(win.app).name}`}
            onClick={() => os.maximize(win.app)}
          >
            <Maximize2 size={8} />
          </button>
        </div>
        {win.app !== "calculator" && <span>{appById(win.app).name}</span>}
        <span className="window-title-spacer" />
      </header>
      <div className="window-content">{children}</div>
      {!win.maximized && (
        <div
          className="resize-handle"
          role="separator"
          aria-label="Resize window"
          onPointerDown={(e) => gesture(e, true)}
        />
      )}
    </section>
  );
}, (previous, next) => previous.win === next.win && previous.z === next.z);

