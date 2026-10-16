import { beforeAll, afterAll, expect, it, vi } from "vitest";
import { useMusic } from "../state/music";
let cleanup: () => void;
beforeAll(() => { cleanup = useMusic.getState().init(); });
afterAll(() => cleanup());
it("does not download or start the track before a Play request", () => {
  expect(fetch).not.toHaveBeenCalled();
  expect(useMusic.getState().assetLoading).toBe(false);
  expect(useMusic.getState().ready).toBe(false);
  expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  expect(useMusic.getState().playing).toBe(false);
  expect(document.querySelectorAll("#macfolio-audio")).toHaveLength(1);
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
it("falls back to original bytes after a native media error and handles a final decode failure", async () => {
  const audio = document.querySelector<HTMLAudioElement>("#macfolio-audio")!;
  Object.defineProperty(audio, "error", { configurable: true, value: { code: 4 } });
  audio.dispatchEvent(new Event("error"));
  expect(useMusic.getState().playing).toBe(false);
  await vi.waitFor(() => expect(useMusic.getState().assetLoading).toBe(false));
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(audio.src).toBe('blob:test-track');
  audio.dispatchEvent(new Event("error"));
  expect(useMusic.getState().ready).toBe(false);
  expect(useMusic.getState().playing).toBe(false);
  expect(useMusic.getState().error).toContain("decode");
  expect(useMusic.getState().assetLoading).toBe(false);
  Object.defineProperty(audio, "error", { configurable: true, value: null });
});
