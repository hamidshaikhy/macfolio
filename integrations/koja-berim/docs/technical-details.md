# کجا بریم؟ · Koja Berim

A Persian, map-first city guide for discovering sights, historic places, cafés, gardens and metro stations. React + TypeScript, responsive desktop/mobile layouts, local collections and live location with explicit permission.

## Run locally

Node.js **22+**. Recommended reproducible install:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Or, if you use npm:

```sh
npm install
npm run dev
```

Open the localhost address printed by Vite. Geolocation needs **HTTPS or localhost**; an ordinary HTTP LAN IP is not enough. A phone's browser must have OS-level location permission too.

```sh
npm test
npm run build
npm run preview
```

## What works

- Interactive **Leaflet map without WebGL or API keys**, using OpenStreetMap raster tiles and automatic HOT / OSM France fallback. Clusters, selected pins, GPS accuracy and route geometry work in this mode. The quiet/vector map switch and its engine have been removed.
- Discovery includes sights/history/museums, historic houses/bridges/caravanserais, cafés, gardens/parks, nature reserves, peaks/waterfalls/caves and metro stations. Hospitals, schools, banks, restaurants and other unrelated amenities are excluded. `src/discovery.json` keeps live queries and snapshot refresh categories aligned.
- Eight initial cities: Tehran, Isfahan, Shiraz, Tabriz, Rasht, Mashhad, Yazd and Kashan. Submit a city-name search for other Iranian cities.
- Search by place name, alternate name or category, selected-first/nearest/alphabetic sorting and photo-only filtering. The default shows **every loaded place without a radius or count cutoff**; optional 1–60 km radius/viewport filters remain available. Lists render 40 cards at a time with “show more”; all matching places remain on the map. Distances in cards are explicitly **straight-line** distances; route distances come from the router.
- User-initiated refresh up to 15 km around the map centre **merges** new records with existing ones, preserving stable IDs, photos and descriptions. Refresh does not silently enable viewport filtering. Quick suggestions stay inside the sidebar; the duplicate Recommendations header/mobile navigation tab has been removed. Numbered recommendations reflect information, photos, editorial selection and distance, without invented star ratings.
- Tehran metro overlay: seven numbered lines with individual colors, source track geometry, **145 mapped stations and 17 interchanges**, airport/suburban branches, per-line filters, ordered station lists, full-route fitting and station detail badges. Transfer stations have multiple colors. This is a geographic OSM-derived overlay, not a schematic image or live operating-status feed.
- Detail sheet, description/photo attribution where available, optional website/phone/opening hours, personal notes, shareable place links.
- Bookmarks, named collections, rename/delete, add/remove places, validated JSON export/import. No account is required. All personal state stays in IndexedDB on the current browser profile.
- Optional GPS **watchPosition**, accuracy circle, stop control, permission/timeout errors. No automatic permission request on load; watches are cleaned up on unmount. No GPS tracks or background tracking.
- Real walking and driving routing, selectable origin on map or current location, route geometry, estimated duration/distance and Persian step instructions. Google Maps handoff is available; no fabricated straight-line route fallback.
- Installable PWA, local fonts, bundled source-attributed photos and offline app shell. Cached metadata/saved places remain usable offline; new tiles, searches and routes require network access.
- `100dvh`, safe-area insets, independent scroll areas, mobile bottom sheet, reduced-motion support, keyboard-accessible controls and a focus-trapped modal.

## Data, photographs and honest limitations

**Default provider requires no key:** OpenStreetMap / HOT basemap, OSM/Overpass place queries, Nominatim city search and OSRM/FOSSGIS routing. Wikipedia/Wikidata provide source-linked descriptions and verified coordinates, and Wikimedia provides available photos. This does **not** scrape or embed Google Maps photos/reviews and does not invent ratings. Public tile endpoints are subject to their [usage policy](https://operations.osmfoundation.org/policies/tiles/); network availability is not guaranteed.

- **Tehran now has 4,096 raw source records, including 1,124 cafés**, extracted from [Geofabrik's Iran OSM dump](https://download.geofabrik.de/asia/iran.html). Source data timestamp: **2026-10-14 20:21:12 UTC**. Geographic bounds: 35.50–35.95 N, 51.05–51.75 E; the metro network additionally includes mapped suburban/airport branches outside that box. Bam-e Tehran, Tochal, Darband and Chitgar are included. Duplicate/enriched records are merged in the UI, so visible counts may differ from raw counts.
- OSM is **not an exhaustive business directory**, and the 145 mapped metro stations do not certify that every station is currently operational. Every line retains its source route-relation URLs. Other cities still use partial snapshots; the separate selected-sights catalog contains 139 records across eight cities. Public Overpass may time out or return 429; local extracts avoid depending on it for initial Tehran discovery.
- Cafés without a verifiable photo show a category illustration, never an unrelated café photo. Not every POI has an address, phone number or opening hours. Raw OSM opening-hours strings are shown as registered; no unverified “open now” badge.
- Before web-source expansion, the Tehran UI contained 211 photographed places out of 4,094 places. A further **15 reviewed museum source records** now have photos from ToIran, Amordad, Deed Studio and Karnaval. Source records may merge with another entry for the same place; the live photo-count button shows the distinct-place count. The requested 1,000 photographed places has **not** been reached. Café coverage is unchanged; this import excludes cafés and metro stations.
- Web photographs are listed in `scripts/tehran-web-photos.json`, with the exact original image, source page, publisher credit and visual-review notes. They show the named museum's building, entrance, interior hall or grounds. Original image rights are retained; no Creative Commons licence is inferred for these sources. Unrelated objects, portraits, posters and placeholder images were excluded.
- Photo discovery inspected 9,827 Wikidata/Commons candidates using both names and coordinates. Only 41 additional source-record matches survived review; repeated shots of a place do not increase place coverage. Visual review also removed 15 unrelated/unverified images from previous imports, including maps, portraits and photographs of surrounding streets. `scripts/tehran-photo-rejections.json` prevents reimporting those files and blocks their display from older saved data. Unchecked Wikipedia page images are no longer fetched when selecting a place. Missing photos stay as category icons. The list shows the actual photo count and a one-click photo-only filter.
- Recommendations rank the selected sights, presence of information/photos and distance. “Selected sights first” is **not** Google popularity or a user-review score.
- Route ETAs do not include live traffic. This is route planning, not a background turn-by-turn navigation system. A new route is calculated when you change the start or mode, not on every GPS tick.
- Public service uptime, rate limits, data completeness and access **inside Iran have not been guaranteed or verified on an Iranian connection**. A domestic Neshan integration is included below; it needs your own activated keys.
- Browser storage is local and can be cleared by the user/OS; export backups. It is not cloud synchronization or an encrypted account system.

See `public/data/featured.json` and `public/data/tehran.json` → `details` for bundled photos' file pages, authors and licences. The Tehran photo importer uses explicit references or a visually reviewed name-and-coordinate manifest, never name-only image search or surrounding street imagery. Discovery output is a proposal report and cannot be imported directly. New imports must be inspected for subject identity; source references alone can point to a broader topic. Existing approved photos are preserved. Photos are distributed with their original Wikimedia licences; **the code licence does not relicense photographs or OSM data**. OSM attribution: [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL. Wikipedia excerpts retain their CC BY-SA source links.

## Optional Neshan: search, details and routing

Default mode is fully usable without any `.env` file. For Neshan:

1. Register in [Neshan Platform](https://platform.neshan.org/), create a **server API key** and activate Search v3, Nearby, POI Details and pedestrian/car routing. Some services require support activation.
2. Copy `.env.example` to `.env`.
3. Set `VITE_NESHAN_API=true` and `NESHAN_API_KEY=<server key>`. The server key never goes into a `VITE_` variable or the browser bundle. The Leaflet basemap stays the same.
4. Development: `npm run dev` provides the same-origin gateway. Production on Vercel: set the environment variables and redeploy; `api/neshan.mjs` is the serverless function.

The gateway supports allowlisted nearby categories, Search v3, POI Details by validated hash, and walking/car routing. When enabled, submitting a place-name search adds Neshan results; selecting a returned place retrieves phone, website and hours when available. The documented POI Details schema has **no place-photo field**; its category icon is never treated as a photograph. The gateway validates Iranian coordinates and limits radius, with a bounded short-lived cache and per-instance request budget.

The gateway adapter and polyline decoder are covered by fixtures. **Live authenticated Neshan calls have not been tested because no key was supplied.** Google's free consumer website being reachable does not provide an API key or photo API access; Google integration is not claimed.

### Static hosting

`npm run build` outputs `dist/`. Deploy it to a static host. The no-key mode needs no server. Static Sites publication does not run `api/neshan.mjs`; leave `VITE_NESHAN_API=false` there unless you deploy a separate same-origin gateway. A plain static host cannot keep a server API key secret.

### Deploy on Vercel

- Framework preset: Vite
- Root directory: repository root
- Build command: `npm run build`
- Output: `dist`
- Node: 22+
- No environment variables needed in default mode.

## Embed in Macfolio later

This source does not modify Macfolio. Build it independently, put the output under `/apps/koja-berim/`, and mount an iframe **only on app open**, with `allow="geolocation; fullscreen"`. Default relative asset paths work under its own directory; alternatively build with `APP_BASE=/apps/koja-berim/`.

Open Full should point to the same path in a new tab. An embedding document must permit geolocation through its Permissions Policy. The app does not register its service worker when inside an iframe. Its standalone worker only manages caches with its own scope-prefixed name, and never deletes another app's caches. For a standalone build at a new path, reinstall/refresh the manifest from that path. Do not merge its CSS or map engine into the OS bundle.

If enabling Neshan in Macfolio, put the optional gateway at the host's `/api/neshan` (or set `VITE_NESHAN_GATEWAY` to your same-origin route); never copy `.env` into public assets.

## Validation

45 automated checks cover distance calculations, categories, alternate names, refresh merging, full Tehran coverage, metro geometry/membership/interchanges/branches, photo attribution, rejected-image regression checks (including older saved data), suggestions, backup validation, IndexedDB, routing profiles, Neshan search/details validation and polyline decoding. Run `npm test` for the current count.

The TypeScript production build and Chrome browser checks passed on desktop and a 390 px mobile viewport. Browser checks covered actual tiles without WebGL, fallback, offline tile failure, pagination, Bam-e Tehran, removed navigation/map switches, all seven metro colors, Line 1/4 station counts and branches, interchanges and station selection. Route UI/geometry was checked using a fixture response. **Live routing, authenticated Neshan calls, actual geolocation permissions and installation on physical iPhone/Android devices have not been verified.**

## Structure

- `src/App.tsx`: UI, sheet state, collections, geolocation lifecycle
- `src/MapView.tsx`: lazy Leaflet map; `src/RasterMapView.tsx`: clusters, selected pins, routing, metro track and station overlays
- `src/model.ts`: typed records, filtering, distance, safe links and backup validation
- `src/api.ts`: public providers, timeouts, cancellation and cache
- `src/neshan.ts`, `api/neshan.mjs`: optional domestic provider and server gateway
- `src/storage.ts`: IndexedDB personal data and bounded provider cache
- `scripts/refresh-catalog.py`: refresh OSM snapshots using shared discovery categories, retain existing records on failure (Python standard library)
- `scripts/expand-sights.py`: expand the selected-sights catalog using Wikipedia and Wikidata, retain existing photos and skip unverified coordinates (Python standard library)
- `scripts/import-tehran.py --iran --pbf <iran-latest.osm.pbf>`: import the full supported Tehran region from Geofabrik's PBF (`pip install osmium`); omitting `--iran` uses the smaller BBBike extract
- `scripts/import-metro.py --pbf <iran-latest.osm.pbf>`: derive the seven metro lines and branches from actual OSM route relations (`osmium`)
- `scripts/enrich-tehran.py`: resolve photos/descriptions from explicit references and preserve approved assets; `--metro-only` includes metro references, `--reviewed-matches scripts/tehran-photo-matches.json` imports a visually reviewed manifest. Rejected files are always excluded (`pip install Pillow`).
- `scripts/discover-tehran-photos.py --commons`: propose name/coordinate matches from geotagged Commons files and Wikidata. Cached, rate-limited, keyless; writes review proposals under `.data-cache/`, never assigns photos to places automatically.
- `scripts/import-web-photos.py`: prepare source-page image candidates for review; `--apply` imports only explicitly reviewed entries from `scripts/tehran-web-photos.json`. Keeps source attribution/rights and excludes cafés/metro.
- `scripts/prepare-data.py`, `scripts/prepare-places.py`: legacy preparation utilities; use the importers above to retain full Tehran coverage
- `scripts/build-sw.mjs`: scope-safe offline shell generation

## Code licence

MIT — see `LICENSE`. Third-party data, fonts, photographs, map tiles and RTL plugin retain their respective licences/terms.
