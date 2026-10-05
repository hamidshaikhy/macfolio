import { useRef, useState } from "react";
import { FileText, Play, Pause, SkipBack, Square, Monitor, Check, X, LoaderCircle } from "lucide-react";
import { useOS } from "../state/os";
import { useMusic, timeLabel } from "../state/music";
import { usePanelFocus } from "./usePanelFocus";
import { SystemIcon } from "./SystemIcon";
import { asset } from "../lib/assets";

export function MusicCard({ large = false }: { large?: boolean }) {
  const music = useMusic();
  const volume = useOS(s => s.volume);
  const previousVolume = useRef(.55);
  return <div className={`music-card ${large ? "large" : ""}`}>
    <div className="music-row"><img src={asset("assets/album.jpg")} alt="The Tide — Riversea album cover" /><div className="music-info"><strong>Drowning in Vertigo</strong><span>Riversea · The Tide</span></div><div className="music-controls">
      <button aria-label="Restart track" title="Restart this track" onClick={music.restart} disabled={!music.duration}><SkipBack size={17} fill="currentColor" /></button>
      <button aria-label={music.playing || music.loading ? "Pause music" : "Play music"} disabled={music.assetLoading} onClick={() => void music.toggle()}>{music.loading || music.buffering || music.assetLoading ? <LoaderCircle className="spinner" size={20} /> : music.playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button>
      <button aria-label="Stop music" title="Stop this track" onClick={() => { music.pause(); music.restart(); }}><Square size={13} fill="currentColor" /></button>
    </div></div>
    <input aria-label="Track position" type="range" min="0" max={music.duration || 1} value={Math.min(music.time, music.duration || 1)} step=".1" disabled={!music.duration} onChange={e => music.seek(Number(e.target.value))} />
    <div className="track-times"><span>{timeLabel(music.time)}</span><span className="track-status">{music.assetLoading ? "Loading track…" : music.buffering ? "Buffering…" : music.loading ? "Loading…" : "Single track"}</span><span>{timeLabel(music.duration)}</span><button aria-label={volume === 0 ? "Unmute music" : "Mute music"} onClick={() => { if (volume > 0) previousVolume.current = volume; useOS.getState().setVolume(volume > 0 ? 0 : previousVolume.current); }}><SystemIcon name={volume ? "volume" : "mute"} size={15} /></button></div>
    {music.error && <small role="alert">{music.error}</small>}
  </div>;
}
export function ControlCenter({ mobile = false }: { mobile?: boolean }) {
  const os = useOS();
  const ref = usePanelFocus<HTMLElement>();
  const [info, setInfo] = useState<"output" | null>(null);
  return <section ref={ref} className={`control-center ${mobile ? "ios-control" : ""}`} role="dialog" aria-modal="true" aria-label="Control Center">
    <div className="control-top"><div className="connectivity control-tile">
      <button aria-label="Toggle Wi-Fi" aria-pressed={os.wifi} onClick={() => os.toggleConnection("wifi")}><span className={`control-circle ${os.wifi ? "blue" : ""}`}><SystemIcon name="wifi" size={22} /></span><span><strong>Wi-Fi</strong><small>{os.wifi ? "macfolio-Net" : "Off"}</small></span></button>
      <button aria-label="Toggle Bluetooth" aria-pressed={os.bluetooth} onClick={() => os.toggleConnection("bluetooth")}><span className={`control-circle ${os.bluetooth ? "blue" : ""}`}><SystemIcon name="bluetooth" size={22} /></span><span><strong>Bluetooth</strong><small>{os.bluetooth ? "On" : "Off"}</small></span></button>
      <button aria-label="Toggle AirDrop" aria-pressed={os.airdrop} onClick={() => os.toggleConnection("airdrop")}><span className={`control-circle ${os.airdrop ? "blue" : ""}`}><SystemIcon name="airdrop" size={22} /></span><span><strong>AirDrop</strong><small>{os.airdrop ? "Contacts" : "Off"}</small></span></button>
    </div><div className="control-quick"><button className="control-tile focus-tile" aria-pressed={os.focusMode} onClick={os.toggleFocus}><span className={`control-circle ${os.focusMode ? "purple" : ""}`}><SystemIcon name="focus" size={20} /></span><span><strong>Focus</strong><small>{os.focusMode ? "On" : "Off"}</small></span></button><div className="control-small"><button className="control-tile" onClick={() => os.openApp("resume")}><span className="control-circle"><FileText size={18} /></span><strong>Résumé</strong></button><button className="control-tile" aria-label="Toggle dark mode" onClick={() => os.setTheme(os.theme === "light" ? "dark" : "light")}><span className="control-circle"><SystemIcon name="appearance" size={20} /></span><strong>{os.theme === "light" ? "Light" : "Dark"}</strong></button></div></div></div>
    {info && <div className="control-info control-tile"><button aria-label="Close audio output" onClick={() => setInfo(null)}><X size={15} /></button><strong>Audio output</strong><p>Browser audio</p></div>}
    <div className="control-tile slider-tile"><label htmlFor="display-range">Display</label><div className="slider-wrap"><SystemIcon name="display" size={16} /><input id="display-range" aria-label="Display brightness" type="range" min=".35" max="1" step=".01" value={os.brightness} style={{ "--fill": `${((os.brightness - .35) / .65) * 100}%` } as React.CSSProperties} onChange={e => os.setBrightness(Number(e.target.value))} /></div></div>
    <div className="control-tile slider-tile"><label htmlFor="volume-range">Sound</label><div className="sound-row"><div className="slider-wrap"><SystemIcon name={os.volume ? "volume" : "mute"} size={16} /><input id="volume-range" aria-label="Music volume" type="range" min="0" max="1" step=".01" value={os.volume} style={{ "--fill": `${os.volume * 100}%` } as React.CSSProperties} onChange={e => os.setVolume(Number(e.target.value))} /></div><button className="control-circle" aria-label="Audio output" onClick={() => setInfo(info === "output" ? null : "output")}><Monitor size={18} /></button></div></div>
    <div className="control-tile"><MusicCard large={mobile} /></div>
    {mobile && <button className="control-done" onClick={() => os.setPanel(null)}><Check size={18} /> Done</button>}
  </section>;
}
