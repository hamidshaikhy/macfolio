import { openDB } from "idb";
import { emptyLibrary, parseLibrary, type Library } from "./model";
const db = openDB("koja-berim-v1", 1, {
  upgrade(d) {
    d.createObjectStore("settings");
    d.createObjectStore("cache");
  },
});
export async function readLibrary(): Promise<Library> {
  const raw = await (await db).get("settings", "library");
  return raw ? parseLibrary(raw) : emptyLibrary();
}
export async function writeLibrary(v: Library) {
  await (await db).put("settings", v, "library");
}
export async function readCache<T>(
  key: string,
  maxAge = 24 * 3600e3,
): Promise<T | undefined> {
  try {
    const v = await (await db).get("cache", key);
    if (v && Date.now() - v.time < maxAge) return v.data;
  } catch {}
}
export async function writeCache(key: string, data: unknown) {
  try {
    const d = await db;
    await d.put("cache", { time: Date.now(), data }, key);
    const keys = await d.getAllKeys("cache");
    if (keys.length > 80) {
      const values = await d.getAll("cache");
      const entries = keys
        .map((key, i) => ({ key, time: values[i].time }))
        .sort((a, b) => a.time - b.time);
      const tx = d.transaction("cache", "readwrite");
      for (const e of entries.slice(0, keys.length - 70))
        tx.store.delete(e.key);
      await tx.done;
    }
  } catch {}
}
