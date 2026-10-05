import { create } from "zustand";
import { asset } from "../lib/assets";
interface MusicState {
  playing: boolean; time: number; duration: number; error: string | null; buffering: boolean; loading: boolean; assetLoading: boolean; ready: boolean;
  toggle: () => Promise<void>; seek: (seconds: number) => void; restart: () => void; pause: () => void; init: () => () => void;
}
let audio: HTMLAudioElement | null = null;
let generation = 0;
let desiredVolume = .55;
let context: AudioContext | null = null;
let gain: GainNode | null = null;
let trackRequest: Promise<void> | null = null;
let trackUrl: string | null = null;
let nativeFallback = false;
function loadNativeTrack() {
  nativeFallback = true;
  const a = player(); a.pause(); a.src = asset("assets/audio/drowning-in-vertigo.mp3"); a.load();
  useMusic.setState({ assetLoading: true, ready: false, playing: false, loading: false, buffering: false, error: null });
}
function player() {
  if (!audio) {
    audio = new Audio();
    audio.id = "macfolio-audio"; audio.preload = "metadata"; audio.hidden = true;
    audio.volume = desiredVolume; audio.muted = desiredVolume === 0;
    document.body.append(audio);
  }
  return audio;
}
function loadTrack() {
  if (trackUrl) return Promise.resolve();
  if (!trackRequest) {
    useMusic.setState({ assetLoading: true, error: null });
    // Fetch the original bytes once. A Blob also works on hosts that mishandle
    // HTTP range requests, without asking the visitor to download a file.
    trackRequest = fetch(asset("assets/audio/track-data.txt"))
      .then(async response => {
        if (!response.ok) throw new Error(`Audio HTTP ${response.status}`);
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength < 1024) throw new Error("Empty audio response");
        trackUrl = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
        const a = player(); a.src = trackUrl; a.load();
      }).catch(() => { trackRequest = null; loadNativeTrack(); });
  }
  return trackRequest;
}
function audioOutput() {
  // A gain node gives iOS Safari a functional in-page volume control.
  if (!context) {
    const Audio = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Audio) {
      try { context = new Audio(); const source = context.createMediaElementSource(player()); gain = context.createGain(); gain.gain.value = desiredVolume; source.connect(gain).connect(context.destination); player().volume = 1; }
      catch { context = null; gain = null; }
    }
  }
  if (context?.state === "suspended") void context.resume().catch(() => {});
}
export const useMusic = create<MusicState>((set, get) => ({
  playing: false, time: 0, duration: 0, error: null, buffering: false, loading: false, assetLoading: true, ready: false,
  init: () => {
    const a = player();
    const progress = () => set({ time: a.currentTime, duration: Number.isFinite(a.duration) ? a.duration : 0 });
    const playing = () => { progress(); set({ playing: true, loading: false, buffering: false, error: null }); };
    const pause = () => { progress(); set({ playing: false, loading: false, buffering: false }); };
    const waiting = () => set({ buffering: true });
    const ready = () => { progress(); set({ assetLoading: false, ready: true, loading: false, buffering: false }); };
    const fail = () => {
      generation++;
      // Some native media pipelines cannot decode Blob URLs. Fall back to
      // the same original MP3 through HTTP; neither path starts playback.
      if (!nativeFallback) { loadNativeTrack(); return; }
      a.pause();
      set({ error: a.error?.code === 4 ? "This browser could not decode the supplied MP3. Retry playback." : "The bundled track could not be loaded. Check your connection and retry.", assetLoading: false, ready: false, playing: false, loading: false, buffering: false });
    };
    const events: [string, () => void][] = [["timeupdate", progress], ["loadedmetadata", ready], ["durationchange", progress], ["playing", playing], ["pause", pause], ["ended", pause], ["waiting", waiting], ["stalled", waiting], ["canplay", ready], ["error", fail]];
    events.forEach(([event, listener]) => a.addEventListener(event, listener)); progress();
    void loadTrack().catch(() => {});
    return () => events.forEach(([event, listener]) => a.removeEventListener(event, listener));
  },
  toggle: async () => {
    const a = player();
    if (get().playing || get().loading || !a.paused) { generation++; a.pause(); set({ playing: false, loading: false, buffering: false }); return; }
    const request = ++generation;
    if (a.error) a.load();
    if (a.ended || (a.duration && a.currentTime >= a.duration)) a.currentTime = 0;
    audioOutput(); set({ loading: true, error: null });
    try { if (!get().ready) await loadTrack(); if (request !== generation) return; await a.play(); if (request === generation) set({ playing: true, loading: false, buffering: false, error: null }); }
    catch (error) { if (request === generation) set({ error: (error as DOMException).name === "NotAllowedError" ? "Tap Play to allow music in this browser." : "The track could not start. Tap Play to retry.", playing: false, loading: false, buffering: false }); }
  },
  seek: seconds => {
    const a = player(); if (!Number.isFinite(seconds) || !Number.isFinite(a.duration) || !a.duration) return;
    try { a.currentTime = Math.min(a.duration, Math.max(0, seconds)); set({ time: a.currentTime }); } catch { /* metadata is still loading */ }
  },
  restart: () => get().seek(0),
  pause: () => { generation++; player().pause(); set({ playing: false, loading: false, buffering: false }); },
}));
export function setAudioVolume(value: number) {
  desiredVolume = Math.min(1, Math.max(0, Number.isFinite(value) ? value : .55));
  const a = player(); a.muted = desiredVolume === 0;
  if (gain && context) gain.gain.setTargetAtTime(desiredVolume, context.currentTime, .02);
  else a.volume = desiredVolume;
}
export function timeLabel(seconds: number) { const s = Number.isFinite(seconds) ? Math.max(0, seconds) : 0; return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`; }
