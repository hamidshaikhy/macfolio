import discovery from "./discovery.json";
import photoRejections from "../scripts/tehran-photo-rejections.json";
export type Point = { lat: number; lng: number };
// Zero means the complete loaded catalog, without a distance cutoff.
export const cityRadius = 0;
export type Category = "sight" | "cafe" | "nature" | "metro";
export type Photo = {
  url: string;
  source: string;
  author: string;
  license: string;
  licenseUrl?: string;
};
const photoKey = (source: string) => {
  try { return decodeURIComponent(source.split("File:").at(-1) || "").replaceAll("_", " ").toLowerCase(); }
  catch { return source; }
};
const rejectedPhotoKeys = new Set(photoRejections.rejections.map(entry => photoKey(entry.source)));
export function isPlacePhoto(photo?: Photo | null): photo is Photo {
  return !!photo && typeof photo.source === "string" && !rejectedPhotoKeys.has(photoKey(photo.source));
}
export type Place = Point & {
  id: string;
  name: string;
  aliases?: string[];
  category: Category;
  city?: string;
  featured?: boolean;
  wiki?: string;
  wikidata?: string;
  commons?: string;
  providerId?: string;
  metroLines?: string[];
  metroOrder?: Record<string, number>;
  description?: string;
  photo?: Photo | null;
  address?: string;
  hours?: string;
  phone?: string;
  website?: string;
  source: string;
  osmType?: string;
  osmId?: number;
};
export type City = Point & { id: string; name: string; zoom: number };
export type Bounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};
export type Collection = { id: string; name: string; ids: string[] };
export type Library = {
  version: 1;
  saved: Place[];
  collections: Collection[];
  notes: Record<string, string>;
};
export type Route = {
  distance: number;
  duration: number;
  coordinates: [number, number][];
  steps: { text: string; distance: number }[];
  provider: string;
};
export type MetroRoute = { id: string; name: string; from: string; to: string;
  stationIds: string[]; segments: [number, number][][]; sourceUrl: string };
export type MetroLine = { id: string; name: string; color: string; stationIds: string[]; routes: MetroRoute[] };
export type MetroNetwork = { source: string; sourceUrl: string; sourceTimestamp?: string;
  lines: MetroLine[]; stations: Place[] };
export const cities: City[] = [
  { id: "tehran", name: "تهران", lat: 35.72, lng: 51.413, zoom: 11.8 },
  { id: "isfahan", name: "اصفهان", lat: 32.657, lng: 51.677, zoom: 12.7 },
  { id: "shiraz", name: "شیراز", lat: 29.616, lng: 52.542, zoom: 12.4 },
  { id: "tabriz", name: "تبریز", lat: 38.073, lng: 46.299, zoom: 12.4 },
  { id: "rasht", name: "رشت", lat: 37.28, lng: 49.586, zoom: 13 },
  { id: "mashhad", name: "مشهد", lat: 36.29, lng: 59.604, zoom: 12.2 },
  { id: "yazd", name: "یزد", lat: 31.896, lng: 54.367, zoom: 13 },
  { id: "kashan", name: "کاشان", lat: 33.985, lng: 51.442, zoom: 13 },
];
export const categories: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "sight", label: "دیدنی و تاریخی" },
  { id: "cafe", label: "کافه" },
  { id: "nature", label: "باغ و بوستان" },
  { id: "metro", label: "مترو" },
];
export const categoryLabel = (c: Category) =>
  categories.find((x) => x.id === c)?.label || "دیدنی";
export const emptyLibrary = (): Library => ({
  version: 1,
  saved: [],
  collections: [{ id: "weekend", name: "برای آخر هفته", ids: [] }],
  notes: {},
});
export const fa = (n: number, digits = 0) =>
  new Intl.NumberFormat("fa-IR", { maximumFractionDigits: digits }).format(n);
export const normalize = (s: string) =>
  s
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\u200e\u200f]/g, " ")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase()
    .trim();
export function distance(a: Point, b: Point) {
  const r = Math.PI / 180;
  const dlat = (b.lat - a.lat) * r,
    dlng = (b.lng - a.lng) * r;
  const x =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dlng / 2) ** 2;
  return (
    6371008.8 *
    2 *
    Math.atan2(Math.sqrt(Math.min(1, x)), Math.sqrt(Math.max(0, 1 - x)))
  );
}
export const distanceText = (m: number) =>
  m < 1000
    ? `${fa(Math.round(m / 10) * 10)} متر`
    : `${fa(m / 1000, 1)} کیلومتر`;
export const durationText = (s: number) =>
  s < 3600
    ? `${fa(Math.max(1, Math.round(s / 60)))} دقیقه`
    : `${fa(Math.floor(s / 3600))} ساعت و ${fa(Math.round((s % 3600) / 60))} دقیقه`;
export function validPoint(p: unknown): p is Point {
  const q = p as Point;
  return (
    !!q &&
    Number.isFinite(q.lat) &&
    Number.isFinite(q.lng) &&
    Math.abs(q.lat) <= 90 &&
    Math.abs(q.lng) <= 180
  );
}
export function safeUrl(s?: string): string | undefined {
  if (!s) return;
  try {
    const u = new URL(/^[a-z]+:/i.test(s) ? s : "https://" + s);
    if (u.protocol === "https:" || u.protocol === "http:") return u.href;
  } catch {}
}
export function classify(t: Record<string, string>): Category | undefined {
  if (
    ["hospital", "school", "university", "clinic", "pharmacy", "bank"].includes(
      t.amenity,
    )
  )
    return;
  if (
    (t.railway === "station" || t.public_transport === "station") &&
    (t.station === "subway" || t.subway === "yes")
  )
    return "metro";
  if (t.amenity === "cafe") return "cafe";
  if (t.tourism === "viewpoint") return "nature";
  if (
    discovery.tourism.includes(t.tourism) ||
    discovery.historic.includes(t.historic)
  )
    return "sight";
  if (discovery.leisure.includes(t.leisure) ||
      discovery.natural.includes(t.natural) ||
      discovery.waterway.includes(t.waterway)) return "nature";
}
export function fromOSM(elements: any[]): Place[] {
  return elements.flatMap((e) => {
    const t = e.tags || {},
      category = classify(t),
      p = { lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon };
    if (!category || !validPoint(p) || !(t["name:fa"] || t.name)) return [];
    const wiki = t.wikipedia?.split(":");
    return [
      {
        ...p,
        id: `osm:${e.type}/${e.id}`,
        name: (t["name:fa"] || t.name).slice(0, 180),
        aliases: [...new Set([t.name, t["name:en"], t.alt_name, t.old_name]
          .filter(Boolean).flatMap((s: string) => s.split(";")))],
        category,
        address: [t["addr:city"], t["addr:street"], t["addr:housenumber"]]
          .filter(Boolean)
          .join("، "),
        hours: t.opening_hours,
        phone: t.phone || t["contact:phone"],
        website: safeUrl(t.website || t["contact:website"]),
        wiki:
          wiki && wiki.length > 1
            ? `https://${wiki[0]}.wikipedia.org/wiki/${encodeURIComponent(wiki.slice(1).join(":"))}`
            : undefined,
        wikidata: t.wikidata,
        commons: /^File:/i.test(t.wikimedia_commons || "") ? t.wikimedia_commons :
          /^https?:\/\/(commons|upload)\.wikimedia\.org\//i.test(t.image || "") ? t.image : undefined,
        source: "OpenStreetMap",
        osmType: e.type,
        osmId: e.id,
      },
    ];
  });
}
export function mergePlaces(osm: Place[], featured: Place[]): Place[] {
  const out = [...osm];
  for (const p of featured) {
    const idx = out.findIndex(
      (o) =>
        p.id === o.id ||
        (p.wikidata && p.wikidata === o.wikidata) ||
        (o.category === p.category &&
          distance(o, p) < 160 &&
          (normalize(o.name).includes(normalize(p.name)) ||
            normalize(p.name).includes(normalize(o.name)))),
    );
    if (idx >= 0) {
      const previous = out[idx];
      const enriched = Object.fromEntries(Object.entries(p).filter(([, v]) => v != null && v !== ""));
      out[idx] = { ...previous, ...enriched, id: previous.id,
        aliases: [...new Set([...(previous.aliases || []), ...(p.aliases || []), previous.name, p.name])],
      };
    }
    else out.push(p);
  }
  const seen = new Set<string>();
  return out.filter((p) => {
    const key =
      normalize(p.name) +
      ":" +
      p.category +
      ":" +
      p.lat.toFixed(3) +
      ":" +
      p.lng.toFixed(3);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
export function filterPlaces(
  places: Place[],
  opts: {
    category: Category | "all";
    query: string;
    origin: Point;
    radius: number;
    photosOnly: boolean;
    sort: string;
    bounds?: Bounds;
  },
) {
  const q = normalize(opts.query);
  let category = opts.category;
  let term = q;
  const aliases: Record<string, Category> = {
    کافه: "cafe",
    "کافی شاپ": "cafe",
    مترو: "metro",
    "ایستگاه مترو": "metro",
    تاریخی: "sight",
    دیدنی: "sight",
    "جاهای دیدنی": "sight",
    "مکان های تاریخی": "sight",
    پارک: "nature",
    بوستان: "nature",
    باغ: "nature",
  };
  if (aliases[q]) {
    category = aliases[q];
    term = "";
  }
  const list = places.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      (!term ||
        normalize(
          [p.name, ...(p.aliases || []), p.address || "", categoryLabel(p.category)].join(" "),
        ).includes(term)) &&
      (!opts.photosOnly || isPlacePhoto(p.photo)) &&
      (opts.radius === 0 || distance(opts.origin, p) <= opts.radius) &&
      (!opts.bounds ||
        (p.lat >= opts.bounds.south &&
          p.lat <= opts.bounds.north &&
          p.lng >= opts.bounds.west &&
          p.lng <= opts.bounds.east)),
  );
  const scores = new Map(list.map(p => [p.id,
    (p.featured ? 100 : 0) + (isPlacePhoto(p.photo) ? 15 : 0) + (p.wikidata ? 10 : 0) +
    (p.phone ? 2 : 0) + (p.hours ? 2 : 0) + (p.website ? 2 : 0) -
    (p.category === "metro" ? 30 : 0) - distance(opts.origin, p) / 1000]));
  return list.sort((a, b) =>
    opts.sort === "distance"
      ? distance(opts.origin, a) - distance(opts.origin, b)
      : opts.sort === "name"
        ? a.name.localeCompare(b.name, "fa")
        : scores.get(b.id)! - scores.get(a.id)!,
  );
}
export function recommended(places: Place[], origin: Point) {
  return filterPlaces(places, {
    category: "all",
    query: "",
    origin,
    radius: cityRadius,
    photosOnly: false,
    sort: "recommended",
  })
    .filter((p) => p.category !== "metro")
    .slice(0, 10);
}
export function suggestionReason(p: Place): string {
  if (/بام|چشم.انداز|توچال/.test(p.name)) return "برای تماشای منظرهٔ شهر";
  if (p.category === "cafe") return p.featured ? "یک کافهٔ منتخب برای گشت" : "برای کافه‌گردی؛ اطلاعات ثبت‌شده را ببین";
  if (p.category === "nature") return "برای قدم‌زدن و فضای باز";
  return p.featured ? "از دیدنی‌های شاخص شهر" : "برای گشت تاریخی و فرهنگی";
}
export function quickSuggestions(places: Place[], origin: Point): Place[] {
  const ranked = filterPlaces(places, { category: "all", query: "", origin,
    radius: 0, photosOnly: false, sort: "recommended" });
  const picks: Place[] = [];
  for (const category of ["nature", "sight", "cafe"] as const) {
    const p = ranked.find(p => p.category === category);
    if (p) picks.push(p);
  }
  return picks;
}
export function parseLibrary(raw: unknown): Library {
  const d = raw as Library;
  if (
    !d ||
    d.version !== 1 ||
    !Array.isArray(d.saved) ||
    !Array.isArray(d.collections) ||
    typeof d.notes !== "object" ||
    d.notes === null ||
    d.saved.length > 3000 ||
    d.collections.length > 100
  )
    throw Error("فایل پشتیبان معتبر نیست.");
  const ids = new Set<string>();
  for (const p of d.saved) {
    if (
      !validPoint(p) ||
      typeof p.id !== "string" ||
      typeof p.name !== "string" ||
      p.name.length > 500 ||
      !["sight", "cafe", "nature", "metro"].includes(p.category) ||
      ids.has(p.id)
    )
      throw Error("اطلاعات مکان معتبر نیست.");
    ids.add(p.id);
    if (p.website) p.website = safeUrl(p.website);
    if (p.wiki) p.wiki = safeUrl(p.wiki);
    if (
      p.photo &&
      !safeUrl(p.photo.url) &&
      !/^photos\/[0-9]+\.webp$/.test(p.photo.url)
    )
      p.photo = null;
  }
  const collectionIds = new Set<string>();
  for (const c of d.collections) {
    if (
      !c ||
      typeof c.id !== "string" ||
      collectionIds.has(c.id) ||
      typeof c.name !== "string" ||
      c.name.length > 100 ||
      !Array.isArray(c.ids) ||
      c.ids.some((x) => typeof x !== "string" || !ids.has(x))
    )
      throw Error("مجموعه معتبر نیست.");
    collectionIds.add(c.id);
    c.ids = [...new Set(c.ids)];
  }
  const notes: Record<string, string> = {};
  for (const [k, v] of Object.entries(d.notes)) {
    if (ids.has(k) && typeof v === "string") notes[k] = v.slice(0, 3000);
  }
  return { ...d, notes };
}
export function shareUrl(p: Place) {
  const u = new URL(location.href);
  u.searchParams.delete("embed");
  u.searchParams.delete("instance");
  u.hash = new URLSearchParams({
    place: p.id,
    lat: String(p.lat),
    lng: String(p.lng),
    name: p.name,
    category: p.category,
  }).toString();
  return u.href;
}
