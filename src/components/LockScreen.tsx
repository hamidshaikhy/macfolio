import { Lock, ChevronUp } from "lucide-react";
import { useRef } from "react";
import { useClock, tehranDate } from "../lib/hooks";
import { useOS } from "../state/os";
import { MusicCard } from "./ControlCenter";
import { useMusic } from "../state/music";
import { asset } from "../lib/assets";
export function LockScreen({ mobile }: { mobile: boolean }) {
  const now = useClock();
  const os = useOS();
  const music = useMusic();
  const start = useRef(0);
  return (
    <main
      className={`lock-screen ${mobile ? "mobile-lock" : ""}`}
      onPointerDown={(e) => {
        start.current = e.clientY;
      }}
      onPointerUp={(e) => {
        if (start.current - e.clientY > 45) os.setLocked(false);
      }}
    >
      <div className="lock-time">
        <Lock size={22} />
        <span>
          {tehranDate(now, { weekday: "long", month: "long", day: "numeric" })}
        </span>
        <strong>
          {tehranDate(now, {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </strong>
      </div>
      {mobile && (music.playing || music.time > 0 || music.duration > 0) && <MusicCard large />}
      <button className="login-profile" onClick={() => os.setLocked(false)}>
        <img src={asset("assets/avatar.png")} alt="Hamid Shaikhy" />
        <strong>Hamid Shaikhy</strong>
        <span>{mobile ? "Tap to unlock" : "Enter HamidOS"}</span>
      </button>
      {mobile && (
        <button className="unlock-hint" onClick={() => os.setLocked(false)}>
          <ChevronUp size={20} /> Swipe up to open
        </button>
      )}
    </main>
  );
}
