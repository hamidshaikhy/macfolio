import { afterEach, describe, expect, it, vi } from "vitest";
import { readStoredValue } from "../lib/storage";

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

describe("saved-data compatibility after rebranding", () => {
  it.each(["preferences", "files", "calendar", "chess"])("keeps previous %s data and copies it to the new key", section => {
    const value = JSON.stringify({ saved: section });
    const previous = `hamidos.${section}.v1`;
    const current = `macfolio.${section}.v1`;
    localStorage.setItem(previous, value);
    expect(readStoredValue(current)).toBe(value);
    expect(localStorage.getItem(current)).toBe(value);
    expect(localStorage.getItem(previous)).toBe(value);
  });
  it("keeps newer data when both names already exist", () => {
    localStorage.setItem("hamidos.files.v1", "old");
    localStorage.setItem("macfolio.files.v1", "new");
    expect(readStoredValue("macfolio.files.v1")).toBe("new");
  });
  it("can still read saved data when copying fails", () => {
    localStorage.setItem("hamidos.calendar.v1", "saved");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Full storage"); });
    expect(readStoredValue("macfolio.calendar.v1")).toBe("saved");
  });
  it("returns null when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Unavailable storage"); });
    expect(readStoredValue("macfolio.preferences.v1")).toBeNull();
  });
});
