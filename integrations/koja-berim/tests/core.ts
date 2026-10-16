import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  classify,
  distance,
  distanceText,
  durationText,
  emptyLibrary,
  filterPlaces,
  fromOSM,
  mergePlaces,
  normalize,
  parseLibrary,
  recommended,
  safeUrl,
  validPoint,
  cities,
  cityRadius,
  quickSuggestions,
  isPlacePhoto,
  type MetroNetwork,
  type Place,
} from "../src/model";
import {
  overpassQuery,
  getRoute,
  routeInstruction,
  jsonFetch,
} from "../src/api";
import { decodePolyline, fromNeshanSearch, fromNeshanDetails } from "../src/neshan";
import { neshanRequest } from "../api/neshan.mjs";
import {
  readLibrary,
  writeLibrary,
  readCache,
  writeCache,
} from "../src/storage";
const a: Place = {
    id: "a",
    name: "کافه آفتاب",
    lat: 35.71,
    lng: 51.41,
    category: "cafe",
    source: "test",
  },
  b: Place = {
    id: "b",
    name: "کاخ گلستان",
    lat: 35.68,
    lng: 51.42,
    category: "sight",
    source: "test",
    featured: true,
  },
  c: Place = {
    id: "c",
    name: "ایستگاه مترو",
    lat: 35.72,
    lng: 51.4,
    category: "metro",
    source: "test",
  };
test("GPS coordinates reject invalid values", () => {
  assert.equal(validPoint({ lat: 91, lng: 2 }), false);
  assert.equal(validPoint({ lat: "35", lng: 51 }), false);
  assert.equal(validPoint({ lat: NaN, lng: 51 }), false);
  assert.equal(validPoint(a), true);
});
test("haversine handles equal coordinates", () =>
  assert.equal(distance(a, a), 0));
test("haversine known distance", () =>
  assert.ok(
    Math.abs(distance({ lat: 0, lng: 0 }, { lat: 0, lng: 1 }) - 111195) < 2,
  ));
test("Persian normalization handles Arabic letters and spacing", () =>
  assert.equal(normalize("  كافه‌ ياس "), "کافه یاس"));
test("map POIs exclude schools hospitals and other amenities", () => {
  for (const amenity of [
    "hospital",
    "school",
    "university",
    "clinic",
    "pharmacy",
    "bank",
    "restaurant",
  ])
    assert.equal(classify({ amenity }), undefined);
  assert.equal(
    classify({ amenity: "hospital", historic: "monument" }),
    undefined,
  );
});
test("only metro stations, not arbitrary rail stations", () => {
  assert.equal(classify({ railway: "station" }), undefined);
  assert.equal(classify({ railway: "station", station: "subway" }), "metro");
});
test("requested leisure categories are allowed", () => {
  assert.equal(classify({ amenity: "cafe" }), "cafe");
  assert.equal(classify({ tourism: "museum" }), "sight");
  assert.equal(classify({ historic: "castle" }), "sight");
  assert.equal(classify({ leisure: "park" }), "nature");
});
test("historic houses, bridges and natural sights are included", () => {
  for (const historic of ["house", "bridge", "baths", "caravanserai", "tomb", "mosque"])
    assert.equal(classify({ historic }), "sight");
  assert.equal(classify({ tourism: "zoo" }), "sight");
  assert.equal(classify({ natural: "peak" }), "nature");
  assert.equal(classify({ waterway: "waterfall" }), "nature");
  assert.equal(classify({ amenity: "school", historic: "building" }), undefined);
});
test("alternate names remain searchable", () => {
  const parsed = fromOSM([{ id: 7, type: "node", lat: 35.7, lon: 51.4,
    tags: { "name:fa": "خانه تاریخی", "name:en": "Historic House", alt_name: "خانه قدیمی;خانه آبی", historic: "house" } }]);
  assert.equal(filterPlaces(parsed, { category: "all", query: "خانه آبی", origin: a,
    radius: cityRadius, photosOnly: false, sort: "name" }).length, 1);
  assert.ok(parsed[0].aliases?.includes("Historic House"));
});
test("refresh merges by stable ID when name and coordinates change, keeping enriched information", () => {
  const old = { ...b, description: "existing description", wiki: "https://fa.wikipedia.org/wiki/Test" };
  const updated = { ...b, lat: b.lat + .01, name: "نام اصلاح‌شده", description: undefined };
  const merged = mergePlaces([a, old], [updated]);
  assert.equal(merged.length, 2);
  const place = merged.find(p => p.id === b.id)!;
  assert.equal(place.lat, updated.lat);
  assert.equal(place.name, updated.name);
  assert.equal(place.description, old.description);
  assert.ok(place.aliases?.includes(b.name));
});
test("default city radius includes Persepolis and keeps the explicit small-radius filter", () => {
  const featured = JSON.parse(readFileSync("public/data/featured.json", "utf8")) as Place[];
  const persepolis = featured.find(p => p.name === "تخت جمشید")!;
  const shiraz = cities.find(c => c.id === "shiraz")!;
  const opts = { category: "all" as const, query: "", origin: shiraz,
    photosOnly: false, sort: "name", radius: cityRadius };
  assert.ok(filterPlaces([persepolis], opts).length === 1);
  assert.ok(filterPlaces([persepolis], { ...opts, radius: 15000 }).length === 0);
});
test("OSM parser rejects invalid location / missing names and supports way centers", () => {
  const p = fromOSM([
    {
      id: 1,
      type: "node",
      lat: 500,
      lon: 51,
      tags: { name: "بد", amenity: "cafe" },
    },
    { id: 2, type: "node", lat: 35, lon: 51, tags: { amenity: "cafe" } },
    {
      id: 3,
      type: "way",
      center: { lat: 35, lon: 51 },
      tags: { name: "Cafe", "name:fa": "کافه", amenity: "cafe" },
    },
  ]);
  assert.equal(p.length, 1);
  assert.equal(p[0].name, "کافه");
  assert.equal(p[0].id, "osm:way/3");
});
test("URL validation excludes script and data payloads", () => {
  assert.equal(safeUrl("javascript:alert(1)"), undefined);
  assert.equal(safeUrl("data:text/html,a"), undefined);
  assert.equal(safeUrl("https://example.com"), "https://example.com/");
  assert.equal(safeUrl("example.com"), "https://example.com/");
});
test("metadata enrichment preserves OSM identifiers", () => {
  const f = {
    ...a,
    id: "wiki:1",
    featured: true,
    photo: {
      url: "photos/1.webp",
      source: "https://commons.wikimedia.org",
      author: "author",
      license: "CC",
    },
  };
  const m = mergePlaces([a], [f]);
  assert.equal(m.length, 1);
  assert.equal(m[0].id, "a");
  assert.equal(m[0].featured, true);
});
test("merge does not replace a similarly located unrelated place", () =>
  assert.equal(
    mergePlaces([a], [{ ...a, name: "کافه دیگری", id: "different" }]).length,
    2,
  ));
test("category search words find all places in that category", () => {
  const list = filterPlaces([a, b, c], {
    category: "all",
    query: "کافه",
    origin: a,
    radius: 15000,
    photosOnly: false,
    sort: "name",
  });
  assert.deepEqual(
    list.map((p) => p.id),
    ["a"],
  );
});
test("radius filter uses meters", () =>
  assert.equal(
    filterPlaces([a, b], {
      category: "all",
      query: "",
      origin: a,
      radius: 500,
      photosOnly: false,
      sort: "name",
    }).length,
    1,
  ));
test("featured sort and nearest sort differ correctly", () => {
  const opts = {
    category: "all" as const,
    query: "",
    origin: a,
    radius: 15000,
    photosOnly: false,
    sort: "recommended",
  };
  assert.equal(filterPlaces([a, b], opts)[0].id, "b");
  assert.equal(filterPlaces([a, b], { ...opts, sort: "distance" })[0].id, "a");
});
test("map viewport boundaries exclude offscreen points", () => {
  assert.equal(
    filterPlaces([a, b], {
      category: "all",
      query: "",
      origin: a,
      radius: 15000,
      photosOnly: false,
      sort: "name",
      bounds: { south: 35.7, north: 35.73, west: 51.4, east: 51.43 },
    }).length,
    1,
  );
});
test("photo-only filter never creates fictitious photos", () =>
  assert.equal(
    filterPlaces([a, b], {
      category: "all",
      query: "",
      origin: a,
      radius: 15000,
      photosOnly: true,
      sort: "name",
    }).length,
    0,
  ));
test("recommendations exclude metro from leisure suggestions", () =>
  assert.ok(recommended([a, b, c], a).every((p) => p.category !== "metro")));
test("empty local library is independent per initialization", () => {
  const x = emptyLibrary(),
    y = emptyLibrary();
  x.saved.push(a);
  assert.equal(y.saved.length, 0);
});
test("backup rejects null / invalid version", () => {
  assert.throws(() => parseLibrary(null));
  assert.throws(() =>
    parseLibrary({ version: 2, saved: [], collections: [], notes: {} }),
  );
});
test("backup rejects duplicate places / collection IDs / missing references", () => {
  assert.throws(() => parseLibrary({ ...emptyLibrary(), saved: [a, a] }));
  assert.throws(() =>
    parseLibrary({
      ...emptyLibrary(),
      collections: [
        { id: "x", name: "a", ids: [] },
        { id: "x", name: "b", ids: [] },
      ],
    }),
  );
  assert.throws(() =>
    parseLibrary({
      ...emptyLibrary(),
      collections: [{ id: "x", name: "a", ids: ["missing"] }],
    }),
  );
});
test("backup limits note size and excludes prototype keys", () => {
  const lib = parseLibrary({
    ...emptyLibrary(),
    saved: [a],
    notes: { a: "x".repeat(4000), other: "hidden" },
  });
  assert.equal(lib.notes.a.length, 3000);
  assert.equal(lib.notes.other, undefined);
});
test("snapshot cities have data and all normalized categories stay in scope", () => {
  for (const city of cities) {
    const file = `public/data/${city.id}.json`;
    assert.ok(existsSync(file), file);
    const data = JSON.parse(readFileSync(file, "utf8"));
    const p = fromOSM(data.elements);
    assert.ok(p.length > 0);
    assert.ok(
      p.every((x) => ["cafe", "sight", "nature", "metro"].includes(x.category)),
    );
  }
});
test("Tehran catalog covers northern and western sights and more than the old central neighborhood", () => {
  const data = JSON.parse(readFileSync("public/data/tehran.json", "utf8"));
  const places = fromOSM(data.elements);
  assert.ok(places.length > 3000);
  assert.ok(places.filter(p => p.category === "cafe").length > 1000);
  for (const name of ["بام تهران", "دربند", "مجموعه تفریحی و ورزشی توچال", "بوستان جنگلی چیتگر"])
    assert.ok(places.some(p => p.name === name), name);
  assert.ok(data.bounds.north >= 35.9 && data.bounds.west <= 51.1);
  const all = filterPlaces(places, { category: "all", query: "", origin: cities[0], radius: 0,
    photosOnly: false, sort: "recommended" });
  assert.equal(all.length, places.length);
});
test("Tehran metro has seven colored lines, valid ordered stations and source track geometry", () => {
  const network = JSON.parse(readFileSync("public/data/tehran-metro.json", "utf8")) as MetroNetwork;
  assert.deepEqual(network.lines.map(line => line.id), ["1", "2", "3", "4", "5", "6", "7"]);
  assert.equal(new Set(network.lines.map(line => line.color)).size, 7);
  assert.equal(network.lines[0].color, "#e32636");
  assert.ok(network.stations.length >= 140);
  const stations = new Map(network.stations.map(p => [p.id, p]));
  assert.equal(stations.size, network.stations.length);
  for (const line of network.lines) {
    assert.match(line.color, /^#[0-9a-f]{6}$/i);
    assert.equal(new Set(line.stationIds).size, line.stationIds.length);
    for (const [order, id] of line.stationIds.entries()) {
      const station = stations.get(id)!;
      assert.ok(station && validPoint(station), id);
      assert.ok(station.metroLines?.includes(line.id));
      assert.equal(station.metroOrder?.[line.id], order);
    }
    assert.ok(line.routes.some(route => route.segments.length > 0));
    for (const route of line.routes) {
      assert.match(route.sourceUrl, /^https:\/\/www.openstreetmap.org\/relation\/[0-9]+$/);
      for (const segment of route.segments) {
        assert.ok(segment.length >= 2);
        assert.ok(segment.every(([lng, lat]) => validPoint({ lat, lng })));
      }
    }
  }
});
test("Metro interchanges and airport branches retain shared membership and terminals", () => {
  const network = JSON.parse(readFileSync("public/data/tehran-metro.json", "utf8")) as MetroNetwork;
  const gate = network.stations.find(p => p.name === "دروازه دولت")!;
  assert.deepEqual(gate.metroLines, ["1", "4"]);
  assert.ok(network.stations.some(p => /پرند/.test(p.name) && p.metroLines?.includes("1")));
  assert.ok(network.stations.filter(p => /مهرآباد/.test(p.name) && p.metroLines?.includes("4")).length >= 2);
  assert.ok(network.stations.filter(p => (p.metroLines?.length || 0) > 1).length >= 15);
});
test("Tehran bundled photographs preserve original source, attribution and assets", () => {
  const data = JSON.parse(readFileSync("public/data/tehran.json", "utf8"));
  const web = JSON.parse(readFileSync("scripts/tehran-web-photos.json", "utf8")).places;
  assert.ok(Object.values(data.details || {}).filter((metadata: any) => metadata.photo).length >= 100);
  for (const [id, metadata] of Object.entries(data.details || {}) as [string, any][]) {
    if (!metadata.photo) continue;
    assert.ok(existsSync("public/" + metadata.photo.url));
    if (!metadata.photo.source.startsWith("https://commons.wikimedia.org/")) {
      const approved = web.find((entry: any) => entry.ids.includes(id) && entry.source === metadata.photo.source);
      assert.ok(approved?.reviewed && approved?.visualReview && approved?.reviewNotes, id);
      assert.ok(metadata.photoMatch?.image === approved.image, id);
    }
    assert.ok(metadata.photo.author && metadata.photo.license);
  }
});
test("Unrelated page images stay excluded from places and metro stations", () => {
  const data = JSON.parse(readFileSync("public/data/tehran.json", "utf8"));
  const metro = JSON.parse(readFileSync("public/data/tehran-metro.json", "utf8"));
  const featured = JSON.parse(readFileSync("public/data/featured.json", "utf8"));
  const rejected = JSON.parse(readFileSync("scripts/tehran-photo-rejections.json", "utf8"));
  const fileKey = (source: string) => decodeURIComponent(source.split("File:").at(-1)!).replaceAll("_", " ").toLowerCase();
  const files = new Set(rejected.rejections.map((entry: any) => fileKey(entry.source)));
  for (const entry of [...Object.values(data.details), ...metro.stations, ...featured] as any[]) {
    if (entry.photo) assert.ok(!files.has(fileKey(entry.photo.source)), entry.photo.source);
  }
  const reviewed = JSON.parse(readFileSync("scripts/tehran-photo-matches.json", "utf8"));
  assert.equal(reviewed.visualReview, true);
  for (const match of reviewed.matches) {
    assert.equal(match.reviewed, true);
    assert.ok(match.source && match.reviewNotes);
    assert.ok(data.details[match.id]?.photo, match.name);
  }
});
test("Rejected photos in older saved data cannot pass the photo-only filter", () => {
  const rejected = JSON.parse(readFileSync("scripts/tehran-photo-rejections.json", "utf8"));
  const old: Place = { ...a, photo: { url: "photos/1.webp", source: rejected.rejections[0].source,
    author: "Wikimedia Commons", license: "CC BY-SA" } };
  assert.equal(isPlacePhoto(old.photo), false);
  assert.equal(filterPlaces([old], { category: "all", query: "", origin: a,
    radius: 0, photosOnly: true, sort: "name" }).length, 0);
});
test("Quick suggestions offer diverse categories and exclude metro", () => {
  const garden: Place = { ...b, id: "garden", category: "nature" };
  const picks = quickSuggestions([a, b, c, garden], a);
  assert.deepEqual(picks.map(p => p.category), ["nature", "sight", "cafe"]);
});
test("Neshan search parses actual x/y fields and rejects irrelevant businesses", () => {
  const items = fromNeshanSearch([
    { title: "کافه نمونه", type: "cafe", location: { x: 51.4, y: 35.7 }, poiHash: "valid_hash_123" },
    { title: "بانک", type: "bank", location: { x: 51.4, y: 35.7 } },
    { title: "کافه نامعتبر", type: "cafe", location: { x: NaN, y: 35.7 } },
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0].lat, 35.7);
  assert.equal(items[0].lng, 51.4);
  assert.equal(items[0].providerId, "valid_hash_123");
});
test("Neshan details do not mistake the category icon for a real place photo", () => {
  const details = fromNeshanDetails({ phoneNumber: "02112345678", website: "example.com",
    layer: { icon: "https://static.neshanmap.ir/poi/cafe.png" },
    workHours: [{ day: "شنبه", ranges: [{ start: "09:00", end: "21:00" }] }] });
  assert.equal(details.photo, undefined);
  assert.equal(details.website, "https://example.com/");
  assert.match(details.hours!, /09:00–21:00/);
  assert.throws(() => neshanRequest(new URLSearchParams({ action: "details", hash: "../../secret" })));
  const url = new URL(neshanRequest(new URLSearchParams({ action: "details", hash: "valid_hash_123" })));
  assert.equal(url.pathname, "/v1/point");
  assert.equal(url.searchParams.get("hash"), "valid_hash_123");
});
test("featured photos refer to bundled assets and real sources", () => {
  const data = JSON.parse(readFileSync("public/data/featured.json", "utf8"));
  assert.ok(data.length >= 30);
  for (const p of data) {
    assert.ok(validPoint(p));
    assert.match(p.wiki, /^https:\/\/fa.wikipedia.org/);
    if (p.photo) {
      assert.ok(existsSync("public/" + p.photo.url));
      assert.match(p.photo.source, /^https:\/\/commons.wikimedia.org/);
      assert.ok(p.photo.author && p.photo.license);
    }
  }
});
test("base map contains no visible POI or airport labels", () => {
  const d = JSON.parse(readFileSync("public/map-style.json", "utf8"));
  for (const layer of d.layers.filter((x: any) =>
    /poi|housenumber|airport|transit/.test(x.id),
  ))
    assert.equal(layer.layout.visibility, "none");
});
test("Overpass requests clamp search radius and reject bad coordinates", () => {
  assert.match(overpassQuery(a, 1e7), /around:15000/);
  assert.throws(() => overpassQuery({ lat: NaN, lng: 1 }, 1e3));
  assert.doesNotMatch(overpassQuery(a, 5000), /hospital|school/);
  assert.match(overpassQuery(a, 5000), /name:fa/);
  assert.match(overpassQuery(a, 5000), /caravanserai/);
  assert.doesNotMatch(overpassQuery(a, 5000), /center 3000/);
});
test("polyline decoding preserves lon/lat order", () => {
  const pts = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
  assert.deepEqual(pts[0], [-120.2, 38.5]);
  assert.deepEqual(pts[2], [-126.453, 43.252]);
  assert.throws(() => decodePolyline("~"));
});
test("Neshan gateway rejects arbitrary paths and unrelated layers", () => {
  assert.throws(() =>
    neshanRequest(new URLSearchParams({ action: "https://evil.test" })),
  );
  assert.throws(() =>
    neshanRequest(
      new URLSearchParams({
        action: "nearby",
        origin: "35,51",
        layer: "hospital",
        radius: "1000",
      }),
    ),
  );
  assert.throws(() =>
    neshanRequest(
      new URLSearchParams({
        action: "route",
        origin: "0,0",
        destination: "35,51",
        mode: "walk",
      }),
    ),
  );
});
test("Neshan request format uses documented endpoint and coordinate order", () => {
  const url = new URL(
    neshanRequest(
      new URLSearchParams({
        action: "route",
        origin: "35.7,51.4",
        destination: "35.8,51.5",
        mode: "walk",
      }),
    ),
  );
  assert.equal(url.origin, "https://api.neshan.org");
  assert.equal(url.pathname, "/v1/direction");
  assert.equal(url.searchParams.get("type"), "pedestrian");
  assert.equal(url.searchParams.get("origin"), "35.7,51.4");
});
test("Persian route instructions", () => {
  assert.equal(
    routeInstruction({ maneuver: { type: "arrive" } }),
    "به مقصد رسیدی",
  );
  assert.match(
    routeInstruction({
      maneuver: { type: "turn", modifier: "left" },
      name: "ولیعصر",
    }),
    /چپ.*ولیعصر/,
  );
});
test("display units do not confuse seconds with minutes", () => {
  assert.match(durationText(90), /۲/);
  assert.match(distanceText(1500), /کیلومتر/);
});
test("IndexedDB library and cache roundtrip", async () => {
  const lib = { ...emptyLibrary(), saved: [a] };
  await writeLibrary(lib);
  assert.deepEqual(await readLibrary(), lib);
  await writeCache("test-cache", { a: 1 });
  assert.deepEqual(await readCache("test-cache"), { a: 1 });
});
test("routing validates the response and walking profile without fabricating a line", async () => {
  const real = globalThis.fetch;
  let requested = "";
  globalThis.fetch = async (input: any) => {
    requested = String(input);
    return new Response(
      JSON.stringify({
        code: "Ok",
        routes: [
          {
            distance: 1200,
            duration: 800,
            geometry: {
              coordinates: [
                [51.4, 35.7],
                [51.5, 35.8],
              ],
            },
            legs: [
              { steps: [{ distance: 1200, maneuver: { type: "arrive" } }] },
            ],
          },
        ],
      }),
      { status: 200 },
    );
  };
  try {
    const r = await getRoute(a, b, "walk");
    assert.match(requested, /routed-foot\/route\/v1\/foot/);
    assert.equal(r.distance, 1200);
    assert.equal(r.coordinates.length, 2);
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ code: "NoRoute" }), { status: 200 });
    await assert.rejects(() => getRoute(a, b, "car"));
  } finally {
    globalThis.fetch = real;
  }
});
