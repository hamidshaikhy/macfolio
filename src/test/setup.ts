import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
afterEach(() => cleanup());
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn((q: string) => ({
    matches: q.includes("max-width") && window.innerWidth < 768,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
window.PointerEvent = MouseEvent as typeof PointerEvent;
Element.prototype.scrollIntoView = vi.fn();
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
Range.prototype.getClientRects = vi.fn(() => [] as unknown as DOMRectList);
Range.prototype.getBoundingClientRect = vi.fn(() => ({ x: 0, y: 0, width: 0, height: 0, top: 0, bottom: 0, left: 0, right: 0, toJSON: () => ({}) }));
vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, arrayBuffer: async () => new Uint8Array(1200).buffer })));
URL.createObjectURL = vi.fn(() => "blob:test-track");
URL.revokeObjectURL = vi.fn();
Object.defineProperty(HTMLMediaElement.prototype, "play", {
  writable: true,
  value: vi.fn(async () => {}),
});
Object.defineProperty(HTMLMediaElement.prototype, "pause", {
  writable: true,
  value: vi.fn(),
});
Object.defineProperty(HTMLMediaElement.prototype, "load", {
  writable: true,
  value: vi.fn(function(this: HTMLMediaElement) { queueMicrotask(() => this.dispatchEvent(new Event("loadedmetadata"))); }),
});
