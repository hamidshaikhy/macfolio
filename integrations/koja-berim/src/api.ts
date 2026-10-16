import {
  fromOSM,
  validPoint,
  type Place,
  type City,
  type Point,
  type Route,
  type MetroNetwork,
} from "./model";
import { readCache, writeCache } from "./storage";
import discovery from "./discovery.json";
export const asset = (path: string) =>
  import.meta.env.BASE_URL + path.replace(/^\//, "");
export async function jsonFetch(
  url: string,
  opts: RequestInit = {},
  timeout = 22000,
) {
  const c = new AbortController();
  const timer = setTimeout(() => c.abort(), timeout);
  const abort = () => c.abort();
  opts.signal?.addEventListener("abort", abort, { once: true });
  if (opts.signal?.aborted) c.abort();
  try {
    const r = await fetch(url, { ...opts, signal: c.signal });
    if (!r.ok)
      throw Error(
        r.status === 429
          ? "درخواست‌ها زیاد شده؛ کمی بعد دوباره امتحان کن."
          : `ارتباط با سرویس برقرار نشد (${r.status}).`,
      );
    const data = await r.json();
    return data;
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", abort);
  }
}
let featuredPromise: Promise<Place[]> | undefined;
export function featuredPlaces() {
  return (featuredPromise ??= jsonFetch(asset("data/featured.json")).catch(
    () => {
      featuredPromise = undefined;
      return [];
    },
  ));
}
let metroPromise: Promise<MetroNetwork> | undefined;
export function tehranMetro(): Promise<MetroNetwork> {
  return metroPromise ??= jsonFetch(asset("data/tehran-metro.json")).catch(error => {
    metroPromise = undefined;
    throw error;
  });
}
export async function snapshot(
  city: City,
): Promise<{ places: Place[]; date?: string }> {
  try {
    const d = await jsonFetch(asset(`data/${city.id}.json`));
    const highlights = new Set(["بام تهران", "مجموعه تفریحی و ورزشی توچال", "دربند", "درکه", "بام محک", "بام نیاوران"]);
    return { places: fromOSM(d.elements).map(p => ({ ...p,
      ...(city.id === "tehran" && highlights.has(p.name) ? { featured: true } : {}),
      ...(d.details?.[p.id] || {}),
    })), date: d.sourceTimestamp || d.fetchedAt };
  } catch {
    return { places: [] };
  }
}
const hosts = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
let lastPlaces = 0;
export function overpassQuery(p: Point, radius: number) {
  const r = Math.min(15000, Math.max(500, Math.round(radius)));
  if (!validPoint(p)) throw Error("مختصات معتبر نیست.");
  const around = `(around:${r},${p.lat.toFixed(5)},${p.lng.toFixed(5)})`;
  const named = (selector: string) => `nwr${around}${selector}[~"^(name|name:fa)$"~"."];`;
  const selectors = Object.entries(discovery).map(([key, values]) =>
    named(`[${key}~"^(${values.join("|")})$"]`));
  return `[out:json][timeout:25];(${named("[amenity=cafe]")}${selectors.join("")}nwr${around}[railway=station][station=subway];nwr${around}[railway=station][subway=yes];);out tags center;`;
}
export async function nearby(p: Point, radius: number, signal?: AbortSignal) {
  radius = Math.min(15000, Math.max(500, Math.round(radius)));
  const key = `${import.meta.env.VITE_NESHAN_API === "true" ? "neshan" : "osm-v2"}:places:${p.lat.toFixed(3)}:${p.lng.toFixed(3)}:${Math.round(radius / 1000)}`;
  const cached = await readCache<Place[]>(key, 20 * 60e3);
  if (cached) return cached;
  if (Date.now() - lastPlaces < 12000)
    throw Error("برای جست‌وجوی دوباره چند ثانیه صبر کن.");
  lastPlaces = Date.now();
  if (import.meta.env.VITE_NESHAN_API === "true") {
    const { neshanNearby } = await import("./neshan");
    const results = await neshanNearby(p, radius, signal);
    await writeCache(key, results);
    return results;
  }
  const query = overpassQuery(p, radius);
  let failure: unknown;
  for (const host of hosts) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      const d = await jsonFetch(
        host + "?" + new URLSearchParams({ data: query }),
        { signal },
        32000,
      );
      if (d.remark || !Array.isArray(d.elements))
        throw Error("سرویس مکان‌ها پاسخ کامل نداد؛ دوباره امتحان کن.");
      const places = fromOSM(d.elements);
      await writeCache(key, places);
      return places;
    } catch (e) {
      failure = e;
      if (signal?.aborted) throw e;
    }
  }
  throw failure || Error("ارتباط با سرویس مکان‌ها برقرار نشد.");
}
let lastCitySearch = 0;
export async function findCities(q: string): Promise<City[]> {
  if (q.trim().length < 2) return [];
  const key = "city:" + q;
  const cache = await readCache<City[]>(key, 30 * 86400e3);
  if (cache) return cache;
  if (Date.now() - lastCitySearch < 1100)
    throw Error("کمی صبر کن و دوباره جست‌وجو کن.");
  lastCitySearch = Date.now();
  const d = await jsonFetch(
    "https://nominatim.openstreetmap.org/search?" +
      new URLSearchParams({
        q,
        format: "jsonv2",
        countrycodes: "ir",
        "accept-language": "fa",
        limit: "8",
        addressdetails: "1",
        featuretype: "city",
      }),
  );
  const list = d
    .filter(
      (x: any) =>
        ["city", "town", "village", "administrative"].includes(x.type) ||
        ["city", "town", "village"].includes(x.addresstype),
    )
    .map((x: any) => ({
      id: "custom-" + x.place_id,
      name: x.name || x.display_name.split(",")[0],
      lat: Number(x.lat),
      lng: Number(x.lon),
      zoom: 12.5,
    }))
    .filter(validPoint);
  await writeCache(key, list);
  return list;
}
const turn: Record<string, string> = {
  left: "به چپ بپیچ",
  right: "به راست بپیچ",
  "slight left": "کمی به چپ برو",
  "slight right": "کمی به راست برو",
  "sharp left": "به تندی به چپ بپیچ",
  "sharp right": "به تندی به راست بپیچ",
  straight: "مستقیم ادامه بده",
  uturn: "دور بزن",
};
export function routeInstruction(s: any) {
  if (s.maneuver?.type === "depart")
    return "حرکت را شروع کن" + (s.name ? "؛ " + s.name : "");
  if (s.maneuver?.type === "arrive") return "به مقصد رسیدی";
  if (["roundabout", "rotary"].includes(s.maneuver?.type))
    return `در میدان، خروجی ${s.maneuver.exit || ""} را بگیر`;
  return (
    (turn[s.maneuver?.modifier] || "ادامه بده") +
    (s.name ? " به سمت " + s.name : "")
  );
}
export async function getRoute(
  a: Point,
  b: Point,
  mode: "walk" | "car",
  signal?: AbortSignal,
): Promise<Route> {
  if (!validPoint(a) || !validPoint(b)) throw Error("مبدا و مقصد معتبر نیست.");
  if (import.meta.env.VITE_NESHAN_API === "true") {
    const { neshanRoute } = await import("./neshan");
    return neshanRoute(a, b, mode, signal);
  }
  const coords = `${a.lng},${a.lat};${b.lng},${b.lat}`;
  const root =
    mode === "walk"
      ? "https://routing.openstreetmap.de/routed-foot/route/v1/foot/"
      : "https://routing.openstreetmap.de/routed-car/route/v1/driving/";
  const d = await jsonFetch(
    root + coords + "?overview=full&geometries=geojson&steps=true",
    { signal },
  );
  const r = d.routes?.[0];
  if (d.code !== "Ok" || !r || !r.geometry?.coordinates?.length)
    throw Error("برای این مبدا و مقصد مسیری پیدا نشد. مبدا دیگری انتخاب کن.");
  return {
    distance: r.distance,
    duration: r.duration,
    coordinates: r.geometry.coordinates,
    steps: r.legs.flatMap((l: any) =>
      l.steps.map((s: any) => ({
        text: routeInstruction(s),
        distance: s.distance,
      })),
    ),
    provider: "OSRM / OpenStreetMap",
  };
}
