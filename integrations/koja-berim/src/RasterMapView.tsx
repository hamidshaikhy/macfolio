import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { categoryLabel, fa } from "./model";
import type { MapHandle, MapProps } from "./MapView";

const providers = [
  { name: "OpenStreetMap", url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' },
  { name: "Humanitarian", url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, style <a href="https://www.hotosm.org/">HOT</a>, hosted by <a href="https://www.openstreetmap.fr/">OSM France</a>' },
];
const paths = {
  sight: "M2 8L12 2L22 8ZM4 10V19M9 10V19M15 10V19M20 10V19M2 22H22",
  cafe: "M3 5H16V15Q16 19 11 19H8Q3 19 3 15ZM16 6H19Q24 6 22 11Q21 14 16 14M2 22H19",
  nature: "M12 2L5 10H8L3 17H10V22H14V17H21L16 10H19Z",
  metro: "M6 2H18Q21 2 21 6V16Q21 19 18 19H6Q3 19 3 16V6Q3 2 6 2ZM3 12H21M7 6H17M7 16H8M16 16H17M7 19L4 23M17 19L20 23",
};
const animate = () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const RasterMapView = forwardRef<MapHandle, MapProps>(function RasterMapView(props, ref) {
  const el = useRef<HTMLDivElement>(null), map = useRef<L.Map | null>(null), latest = useRef(props);
  latest.current = props;
  const [ready, setReady] = useState(false), [view, setView] = useState(0);
  const [provider, setProvider] = useState(0), [attempt, setAttempt] = useState(0);
  const [tiles, setTiles] = useState<"loading" | "ready" | "failed">("loading");
  const fitRoute = () => {
    const coordinates = latest.current.route?.coordinates;
    if (!coordinates?.length || !map.current) return;
    map.current.fitBounds(L.latLngBounds(coordinates.map(([lng, lat]) => L.latLng(lat, lng))), {
      paddingTopLeft: [55, 90], paddingBottomRight: [55, window.innerWidth < 760 ? window.innerHeight * .43 : 90],
      maxZoom: 16, animate: animate(),
    });
  };
  const fitMetro = (lineId?: string) => {
    const network = latest.current.metro, m = map.current;
    if (!network || !m) return;
    const stations = network.stations.filter(p => !lineId || p.metroLines?.includes(lineId));
    if (!stations.length) return;
    m.fitBounds(L.latLngBounds(stations.map(p => L.latLng(p.lat, p.lng))), {
      paddingTopLeft: [45, 95], paddingBottomRight: [45, window.innerWidth < 760 ? window.innerHeight * .43 : 70],
      maxZoom: 13.5, animate: animate(),
    });
  };
  useImperativeHandle(ref, () => ({
    fly(p, zoom = 14) { map.current?.setView([p.lat, p.lng], zoom, { animate: animate() }); },
    zoom(delta) { const m = map.current; if (m) m.setZoom(m.getZoom() + delta, { animate: animate() }); },
    fitRoute,
    fitMetro,
  }), []);
  useEffect(() => {
    if (!el.current) return;
    const city = latest.current.city;
    const m = L.map(el.current, { zoomControl: false, minZoom: 4, maxZoom: 19,
      preferCanvas: true, attributionControl: true, zoomSnap: .5,
    }).setView([city.lat, city.lng], city.zoom);
    map.current = m;
    m.attributionControl.setPosition("bottomleft");
    L.control.scale({ imperial: false, position: "bottomleft" }).addTo(m);
    const notify = () => {
      const b = m.getBounds(), c = m.getCenter();
      latest.current.onView({ lat: c.lat, lng: c.lng }, {
        south: b.getSouth(), north: b.getNorth(), west: b.getWest(), east: b.getEast(),
      }, m.getZoom());
      setView(v => v + 1);
    };
    m.on("moveend", notify);
    m.on("click", (e: L.LeafletMouseEvent) => latest.current.onPick?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
    const observer = new ResizeObserver(() => m.invalidateSize({ pan: false }));
    observer.observe(el.current);
    setReady(true);
    notify();
    return () => { observer.disconnect(); m.remove(); map.current = null; setReady(false); };
  }, []);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    let disposed = false, successes = 0, errors = 0;
    setTiles("loading");
    const fallback = () => {
      if (disposed) return;
      if (provider < providers.length - 1) setProvider(provider + 1);
      else setTiles("failed");
    };
    const source = providers[provider];
    const layer = L.tileLayer(source.url, { maxZoom: 19, attribution: source.attribution,
      subdomains: "abc", keepBuffer: 2, updateWhenIdle: true,
    });
    let timer = window.setTimeout(fallback, 9000);
    layer.on("tileload", () => {
      if (disposed) return;
      successes++; errors = 0;
      clearTimeout(timer); setTiles("ready");
    });
    layer.on("loading", () => {
      successes = 0; errors = 0;
      clearTimeout(timer); timer = window.setTimeout(() => { if (!successes) fallback(); }, 9000);
    });
    layer.on("tileerror", () => { if (++errors >= 4 && !successes) fallback(); });
    layer.addTo(m);
    return () => { disposed = true; clearTimeout(timer); layer.remove(); };
  }, [ready, provider, attempt]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const group = L.layerGroup().addTo(m), zoom = m.getZoom(), bounds = m.getBounds().pad(.2);
    const cells = new Map<string, typeof props.places>();
    for (const p of props.places) {
      if (props.metro && p.category === "metro" && p.metroLines?.length) continue;
      if (!bounds.contains([p.lat, p.lng])) continue;
      const point = m.project([p.lat, p.lng], Math.floor(zoom));
      const key = zoom >= 15 || p.id === props.selected?.id ? p.id : `${Math.floor(point.x / 58)}:${Math.floor(point.y / 58)}`;
      const cell = cells.get(key);
      if (cell) cell.push(p); else cells.set(key, [p]);
    }
    for (const cell of cells.values()) {
      if (cell.length > 1) {
        const lat = cell.reduce((sum, p) => sum + p.lat, 0) / cell.length;
        const lng = cell.reduce((sum, p) => sum + p.lng, 0) / cell.length;
        const icon = L.divIcon({ className: "map-cluster", html: `<span>${fa(cell.length)}</span>`, iconSize: [42, 42] });
        L.marker([lat, lng], { icon, title: `${fa(cell.length)} مکان؛ برای باز کردن کلیک کن` })
          .on("click", () => { if (!latest.current.onPick) m.setView([lat, lng], Math.min(19, zoom + 2), { animate: animate() });
            else latest.current.onPick({ lat, lng }); }).addTo(group);
      } else {
        const p = cell[0], focused = p.id === props.selected?.id || p.id === props.hover;
        const icon = L.divIcon({ className: `map-place-pin ${p.category}${focused ? " focused" : ""}`,
          html: `<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[p.category]}"/></svg></span>`,
          iconSize: [36, 44], iconAnchor: [18, 44], tooltipAnchor: [0, 1],
        });
        const marker = L.marker([p.lat, p.lng], { icon, title: p.name, alt: p.name, zIndexOffset: focused ? 1000 : p.featured ? 100 : 0 });
        const label = document.createElement("span"); label.textContent = p.name;
        marker.bindTooltip(label, { direction: "bottom", permanent: focused || (zoom >= 16 && !!p.featured), className: "map-place-label", offset: [0, 0] });
        marker.on("click", () => {
          if (latest.current.onPick) latest.current.onPick({ lat: p.lat, lng: p.lng });
          else latest.current.onSelect(p);
        });
        marker.addTo(group);
        marker.getElement()?.setAttribute("aria-label", `${p.name}، ${categoryLabel(p.category)}`);
      }
    }
    return () => { group.remove(); };
  }, [ready, view, props.places, props.selected?.id, props.hover, props.metro]);
  useEffect(() => {
    const m = map.current, network = props.metro;
    if (!m || !ready || !network) return;
    const group = L.layerGroup().addTo(m);
    const colors = new Map(network.lines.map(line => [line.id, line.color]));
    const lines = network.lines.filter(line => !props.metroLine || line.id === props.metroLine);
    const renderer = L.svg();
    for (const line of lines) {
      const segments = line.routes.flatMap(route => route.segments.map(segment => segment.map(([lng, lat]) => L.latLng(lat, lng))));
      L.polyline(segments, { color: "#ffffff", weight: 8, opacity: .95, interactive: false, renderer }).addTo(group);
      const track = L.polyline(segments, { color: line.color, weight: 4, opacity: .95, className: `metro-track metro-track-${line.id}`, renderer });
      const label = document.createElement("span"); label.textContent = `خط ${fa(Number(line.id))} مترو تهران`;
      track.bindTooltip(label, { sticky: true, className: "map-place-label" });
      track.on("click", () => { if (!latest.current.onPick) latest.current.onMetroLine?.(line.id); });
      track.addTo(group);
    }
    for (const p of props.places) {
      if (p.category !== "metro" || !p.metroLines?.length) continue;
      const stationLines = p.metroLines.filter(id => !props.metroLine || id === props.metroLine);
      if (!stationLines.length) continue;
      const palette = p.metroLines.map(id => colors.get(id) || "#466b84");
      const focused = p.id === props.selected?.id || p.id === props.hover;
      const gradient = `conic-gradient(${palette.map((color, i) => `${color} ${i * 100 / palette.length}% ${(i + 1) * 100 / palette.length}%`).join(",")})`;
      const icon = L.divIcon({ className: `metro-station-pin${focused ? " focused" : ""}${palette.length > 1 ? " interchange" : ""}`,
        html: `<span style="background:${gradient}"><i></i></span>`, iconSize: [22, 22], iconAnchor: [11, 11] });
      const marker = L.marker([p.lat, p.lng], { icon, title: p.name, alt: p.name, zIndexOffset: focused ? 1500 : 500 });
      const label = document.createElement("span");
      label.textContent = `${p.name} · خط ${p.metroLines.map(id => fa(Number(id))).join(" و ")}`;
      marker.bindTooltip(label, { direction: "top", permanent: focused || m.getZoom() >= 14, className: "map-place-label metro-station-label" });
      marker.on("click", () => {
        if (latest.current.onPick) latest.current.onPick(p);
        else latest.current.onSelect(p);
      });
      marker.addTo(group);
      marker.getElement()?.setAttribute("aria-label", label.textContent);
    }
    return () => { group.remove(); renderer.remove(); };
  }, [ready, props.metro, props.metroLine, props.places, props.selected?.id, props.hover, view]);
  useEffect(() => {
    if (ready && props.metro) fitMetro(props.metroLine);
  }, [ready, props.metro, props.metroLine]);
  useEffect(() => {
    map.current?.setView([props.city.lat, props.city.lng], props.city.zoom, { animate: animate() });
  }, [props.city]);
  useEffect(() => {
    const m = map.current, p = props.location;
    if (!m || !ready || !p) return;
    const group = L.layerGroup([
      L.circle([p.lat, p.lng], { radius: p.accuracy, color: "#3187ce", weight: 0, fillOpacity: .12 }),
      L.circleMarker([p.lat, p.lng], { radius: 7, color: "white", weight: 3, fillColor: "#3187ce", fillOpacity: 1 }),
    ]).addTo(m);
    return () => { group.remove(); };
  }, [ready, props.location]);
  useEffect(() => {
    const m = map.current, r = props.route;
    if (!m || !ready || !r?.coordinates.length) return;
    const points = r.coordinates.map(([lng, lat]) => L.latLng(lat, lng));
    const group = L.layerGroup([
      L.polyline(points, { color: "white", weight: 9 }),
      L.polyline(points, { color: "#245c41", weight: 5 }),
      L.circleMarker(points[0], { radius: 8, color: "white", weight: 3, fillColor: "#245c41", fillOpacity: 1 }),
    ]).addTo(m);
    fitRoute();
    return () => { group.remove(); };
  }, [ready, props.route]);
  return <>
    <div ref={el} className={`map-canvas raster-map${props.onPick ? " picking" : ""}`} aria-label="نقشه تعاملی مکان‌های گشت‌وگذار" />
    {tiles === "loading" && <div className="map-status" role="status"><span className="spinner" />در حال دریافت نقشه… مکان‌ها قابل انتخاب‌اند.</div>}
    {tiles === "failed" && <div className="map-status map-status-error" role="status">
      <span>خیابان‌ها دریافت نشدند؛ نشان مکان‌ها در دسترس است.</span>
      <button onClick={() => { setProvider(0); setAttempt(a => a + 1); }}>تلاش دوباره</button>
    </div>}
  </>;
});
export default RasterMapView;
