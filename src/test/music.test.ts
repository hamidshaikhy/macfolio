import { beforeAll, afterAll, expect, it, vi } from "vitest";
import { useMusic } from "../state/music";
let cleanup: () => void;
beforeAll(async () => { cleanup = useMusic.getState().init(); await vi.waitFor(() => expect(useMusic.getState().ready).toBe(true)); });
afterAll(() => cleanup());
it("loads metadata without starting playback", () => {
  expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  expect(useMusic.getState().playing).toBe(false);
  expect(document.querySelectorAll("#hamidos-audio")).toHaveLength(1);
});
it("reports a rejected user playback request without a false playing state", async () => {
  vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new DOMException("Gesture required", "NotAllowedError"));
  await useMusic.getState().toggle();
  expect(useMusic.getState().playing).toBe(false);
  expect(useMusic.getState().loading).toBe(false);
  expect(useMusic.getState().error).toContain("Tap Play");
  await useMusic.getState().toggle();
  expect(useMusic.getState().playing).toBe(true);
  useMusic.getState().pause();
});
it("falls back to the original served MP3 and handles a final decode failure", async () => {
  const audio = document.querySelector<HTMLAudioElement>("#hamidos-audio")!;
  Object.defineProperty(audio, "error", { configurable: true, value: { code: 4 } });
  audio.dispatchEvent(new Event("error"));
  expect(audio.src).toContain("assets/audio/drowning-in-vertigo.mp3");
  expect(useMusic.getState().playing).toBe(false);
  await vi.waitFor(() => expect(useMusic.getState().assetLoading).toBe(false));
  audio.dispatchEvent(new Event("error"));
  expect(useMusic.getState().ready).toBe(false);
  expect(useMusic.getState().playing).toBe(false);
  expect(useMusic.getState().error).toContain("decode");
  expect(useMusic.getState().assetLoading).toBe(false);
  Object.defineProperty(audio, "error", { configurable: true, value: null });
});
