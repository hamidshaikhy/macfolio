import { asset, jsonFetch } from "./api";
import { safeUrl, validPoint, type Place, type Point, type Route } from "./model";
export const neshanEnabled = import.meta.env.VITE_NESHAN_API === "true";
const layers: Record<string, Place["category"]> = {
  cafe: "cafe",
  historical: "sight",
  interests: "sight",
  park: "nature",
  garden: "nature",
  metro_entrance: "metro",
};
const gateway = (p: Record<string, string>, signal?: AbortSignal) =>
  jsonFetch(
    (import.meta.env.VITE_NESHAN_GATEWAY || "/api/neshan") +
      "?" +
      new URLSearchParams(p),
    { signal },
    16000,
  );
export async function neshanNearby(
  p: Point,
  radius: number,
  signal?: AbortSignal,
): Promise<Place[]> {
  const result: Place[] = [];
  for (const [layer, category] of Object.entries(layers)) {
    const d = await gateway(
      {
        action: "nearby",
        origin: `${p.lat},${p.lng}`,
        layer,
        radius: String(radius),
      },
      signal,
    );
    for (const n of d.layerPoints?.nearestPoints || []) {
      const point = { lat: n.location?.latitude, lng: n.location?.longitude };
      if (validPoint(point) && typeof n.name === "string")
        result.push({
          ...point,
          id: "neshan:" + (n.poiHash || n.name + point.lat),
          name: n.name,
          category,
          source: "نشان",
          providerId: n.poiHash,
        });
    }
  }
  return Array.from(new Map(result.map((p) => [p.id, p])).values());
}
export function fromNeshanSearch(items: any[]): Place[] {
  const kinds: Record<string, Place["category"]> = { ...layers,
    cafe_restaurant: "cafe", museum: "sight", gallery: "sight", monument: "sight",
    viewpoint: "nature", natural_feature: "nature", entertainment: "sight",
  };
  return items.flatMap(n => {
    const point = { lat: n.location?.y, lng: n.location?.x };
    const category = kinds[n.type];
    if (!category || !validPoint(point) || typeof n.title !== "string" || !n.title.trim()) return [];
    return [{ ...point, id: `neshan:${n.poiHash || `${n.type}:${point.lat}:${point.lng}`}`,
      providerId: n.poiHash, name: n.title.slice(0, 180), category,
      address: [n.region, n.neighbourhood, n.address].filter(Boolean).join("، "), source: "نشان" }];
  });
}
export async function neshanSearch(term: string, point: Point, signal?: AbortSignal): Promise<Place[]> {
  if (!validPoint(point)) throw Error("مختصات معتبر نیست.");
  const data = await gateway({ action: "search", term, origin: `${point.lat},${point.lng}` }, signal);
  if (!Array.isArray(data.items)) throw Error("پاسخ جست‌وجوی نشان کامل نیست.");
  return fromNeshanSearch(data.items);
}
export function fromNeshanDetails(d: any): Partial<Place> {
  const text = (v: unknown) => typeof v === "string" && v.trim() ? v.trim() : undefined;
  return {
    address: text(d.address), phone: text(d.phoneNumber), website: safeUrl(text(d.website)),
    hours: Array.isArray(d.workHours) ? d.workHours.flatMap((day: any) => {
      if (!text(day.day) || !Array.isArray(day.ranges)) return [];
      const ranges = day.ranges.filter((r: any) => /^\d{2}:\d{2}$/.test(r.start) && /^\d{2}:\d{2}$/.test(r.end))
        .map((r: any) => `${r.start}–${r.end}`);
      return [`${day.day}: ${ranges.length ? ranges.join("، ") : "تعطیل"}`];
    }).join("؛ ") || undefined : undefined,
  };
}
export async function neshanDetails(hash: string, signal?: AbortSignal): Promise<Partial<Place>> {
  const data = await gateway({ action: "details", hash }, signal);
  if (!data || typeof data.name !== "string") throw Error("جزئیات مکان از نشان دریافت نشد.");
  return fromNeshanDetails(data);
}
export function decodePolyline(s: string): [number, number][] {
  let index = 0,
    lat = 0,
    lng = 0;
  const out: [number, number][] = [];
  const read = () => {
    let value = 0,
      shift = 0,
      b = 0;
    do {
      if (index >= s.length || shift > 30) throw Error("خط مسیر معتبر نیست.");
      b = s.charCodeAt(index++) - 63;
      if (b < 0 || b > 63) throw Error("خط مسیر معتبر نیست.");
      value |= (b & 31) << shift;
      shift += 5;
    } while (b >= 32);
    return value & 1 ? ~(value >> 1) : value >> 1;
  };
  while (index < s.length) {
    lat += read();
    lng += read();
    const p = { lat: lat / 1e5, lng: lng / 1e5 };
    if (!validPoint(p)) throw Error("مختصات مسیر معتبر نیست.");
    out.push([p.lng, p.lat]);
  }
  return out;
}
export async function neshanRoute(
  a: Point,
  b: Point,
  mode: "walk" | "car",
  signal?: AbortSignal,
): Promise<Route> {
  const d = await gateway(
    {
      action: "route",
      origin: `${a.lat},${a.lng}`,
      destination: `${b.lat},${b.lng}`,
      mode,
    },
    signal,
  );
  const r = d.routes?.[0];
  if (!r?.overview_polyline?.points || !Array.isArray(r.legs))
    throw Error("مسیری از نشان دریافت نشد.");
  return {
    coordinates: decodePolyline(r.overview_polyline.points),
    distance: r.legs.reduce(
      (s: number, l: any) => s + Number(l.distance?.value || 0),
      0,
    ),
    duration: r.legs.reduce(
      (s: number, l: any) => s + Number(l.duration?.value || 0),
      0,
    ),
    steps: r.legs.flatMap((l: any) =>
      l.steps.map((s: any) => ({
        text: String(s.instruction || s.name || "ادامه مسیر"),
        distance: Number(s.distance?.value || 0),
      })),
    ),
    provider: "نشان",
  };
}
