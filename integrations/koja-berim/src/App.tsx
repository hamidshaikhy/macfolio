import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  MapPin,
  Search,
  ChevronDown,
  Compass,
  Bookmark,
  Layers,
  SlidersHorizontal,
  Coffee,
  Landmark,
  Trees,
  TrainFront,
  LocateFixed,
  Plus,
  Minus,
  X,
  ArrowUpLeft,
  ArrowRight,
  Route as RouteIcon,
  Share2,
  Navigation,
  Footprints,
  Car,
  Check,
  CheckCheck,
  Trash2,
  Pencil,
  Download,
  Upload,
  Info,
  RefreshCw,
  ChevronUp,
  ChevronLeft,
  ExternalLink,
  WifiOff,
  Heart,
  Image as ImageIcon,
  Map as MapIcon,
  LoaderCircle,
  CheckCircle2,
  ArrowDown,
  Settings2,
} from "lucide-react";
import {
  cities,
  cityRadius,
  categories,
  categoryLabel,
  distance,
  distanceText,
  durationText,
  emptyLibrary,
  fa,
  filterPlaces,
  mergePlaces,
  isPlacePhoto,
  normalize,
  parseLibrary,
  quickSuggestions,
  suggestionReason,
  safeUrl,
  shareUrl,
  validPoint,
  type Category,
  type City,
  type Library,
  type Place,
  type Point,
  type Bounds,
  type Route,
  type MetroNetwork,
} from "./model";
import {
  asset,
  featuredPlaces,
  findCities,
  getRoute,
  nearby,
  snapshot,
  tehranMetro,
} from "./api";
import { readLibrary, writeLibrary } from "./storage";
import type { MapHandle } from "./MapView";
const usingNeshan = import.meta.env.VITE_NESHAN_API === "true";
const MapView = lazy(() => import("./MapView"));
const icons = {
  sight: Landmark,
  cafe: Coffee,
  nature: Trees,
  metro: TrainFront,
};
type Tab = "explore" | "saved" | "collections" | "recommend";
function CatIcon({
  category,
  size = 18,
}: {
  category: Category | "all";
  size?: number;
}) {
  const I = category === "all" ? Compass : icons[category];
  return <I size={size} />;
}
function Photo({
  place,
  className = "",
}: {
  place: Place;
  className?: string;
}) {
  const [error, setError] = useState(false);
  useEffect(() => setError(false), [place.photo?.url]);
  return (
    <div className={"place-photo " + place.category + " " + className}>
      {isPlacePhoto(place.photo) && !error ? (
        <img
          src={
            /^photos\//.test(place.photo.url)
              ? asset(place.photo.url)
              : place.photo.url
          }
          alt={place.name}
          loading="lazy"
          decoding="async"
          onError={() => setError(true)}
        />
      ) : (
        <>
          <CatIcon category={place.category} size={30} />
          <span>{categoryLabel(place.category)}</span>
        </>
      )}
    </div>
  );
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    ref.current
      ?.querySelector<HTMLElement>("input,button,select,textarea")
      ?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab") {
        const nodes = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            "button:not(:disabled),a[href],input,textarea,select",
          ) || [],
        ).filter((x) => x.offsetParent !== null);
        if (!nodes.length) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey && document.activeElement === nodes[0]) {
          e.preventDefault();
          nodes.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
          e.preventDefault();
          nodes[0].focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      old?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
      >
        <header>
          <h2>{title}</h2>
          <button className="icon-button" aria-label="بستن" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
export default function App() {
  const [city, setCity] = useState<City>(cities[0]),
    [places, setPlaces] = useState<Place[]>([]),
    [featured, setFeatured] = useState<Place[]>([]),
    [loadState, setLoadState] = useState<
      "loading" | "snapshot" | "live" | "error"
    >("loading"),
    [dataDate, setDataDate] = useState(""),
    [fetching, setFetching] = useState(false);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [metroNetwork, setMetroNetwork] = useState<MetroNetwork>();
  const [metroLine, setMetroLine] = useState<string>();
  const [metroError, setMetroError] = useState(false);
  const [metroAttempt, setMetroAttempt] = useState(0);
  const [tab, setTab] = useState<Tab>("explore"),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState<Category | "all">("all"),
    [sort, setSort] = useState("recommended"),
    [radius, setRadius] = useState(cityRadius),
    [photosOnly, setPhotosOnly] = useState(false),
    [bounds, setBounds] = useState<Bounds>(),
    [viewCenter, setViewCenter] = useState<Point>(cities[0]),
    [zoom, setZoom] = useState(12),
    [onlyBounds, setOnlyBounds] = useState(false),
    [mapMoved, setMapMoved] = useState(false);
  const [renderLimit, setRenderLimit] = useState(40);
  const [selected, setSelected] = useState<Place>(),
    [hover, setHover] = useState<string>(),
    [library, setLibrary] = useState<Library>(emptyLibrary),
    [libraryReady, setLibraryReady] = useState(false),
    [collectionId, setCollectionId] = useState<string>(),
    [sheet, setSheet] = useState<"peek" | "mid" | "full">("mid");
  const [modal, setModal] = useState<
      "city" | "filters" | "about" | "addCollection" | "assign" | undefined
    >(),
    [cityQuery, setCityQuery] = useState(""),
    [remoteCities, setRemoteCities] = useState<City[]>([]),
    [searchingCity, setSearchingCity] = useState(false),
    [newCollection, setNewCollection] = useState(""),
    [toast, setToast] = useState(""),
    [notice, setNotice] = useState(""),
    [online, setOnline] = useState(navigator.onLine);
  const [gps, setGps] = useState<Point & { accuracy: number }>(),
    [gpsActive, setGpsActive] = useState(false),
    [gpsLoading, setGpsLoading] = useState(false),
    [routeOpen, setRouteOpen] = useState(false),
    [route, setRoute] = useState<Route>(),
    [routeLoading, setRouteLoading] = useState(false),
    [routeError, setRouteError] = useState(""),
    [mode, setMode] = useState<"walk" | "car">("walk"),
    [origin, setOrigin] = useState<Point>(),
    [originLabel, setOriginLabel] = useState(""),
    [picking, setPicking] = useState(false),
    [stepsExpanded, setStepsExpanded] = useState(false),
    [shareFallback, setShareFallback] = useState("");
  const map = useRef<MapHandle>(null),
    watch = useRef<number | undefined>(undefined),
    loadAbort = useRef<AbortController | undefined>(undefined),
    libraryRef = useRef(library),
    saveQueue = useRef(Promise.resolve()),
    requestId = useRef(0),
    cityRequest = useRef(0),
    sheetStart = useRef(0),
    dragged = useRef(false),
    firstGps = useRef(true),
    fileInput = useRef<HTMLInputElement>(null),
    listRef = useRef<HTMLDivElement>(null);
  const distanceFromGPS = !!gps && distance(gps, city) < 45000;
  const originForDistance = distanceFromGPS ? gps! : city;
  const allPlaces = useMemo(
    () =>
      mergePlaces(mergePlaces(places, featured.filter((x) => x.city === city.id)),
        city.id === "tehran" ? metroNetwork?.stations || [] : []),
    [places, featured, city, metroNetwork],
  );
  const savedIds = useMemo(
    () => new Set(library.saved.map((p) => p.id)),
    [library.saved],
  );
  const activeCollection = library.collections.find(
    (c) => c.id === collectionId,
  );
  const visible = useMemo(() => {
    if (tab === "saved")
      return library.saved
        .filter((p) => normalize(p.name).includes(normalize(query)))
        .sort(
          (a, b) =>
            distance(originForDistance, a) - distance(originForDistance, b),
        );
    if (tab === "collections")
      return activeCollection
        ? library.saved.filter(
            (p) =>
              activeCollection.ids.includes(p.id) &&
              normalize(p.name).includes(normalize(query)),
          )
        : [];
    const matches = filterPlaces(allPlaces, {
      category,
      query,
      origin: onlyBounds ? viewCenter : originForDistance,
      radius,
      photosOnly,
      sort: tab === "recommend" ? "recommended" : sort,
      bounds: onlyBounds ? bounds : undefined,
    });
    if (category === "metro" && metroLine) return matches.filter(p => p.metroLines?.includes(metroLine))
      .sort((a, b) => (a.metroOrder?.[metroLine] ?? 10000) - (b.metroOrder?.[metroLine] ?? 10000));
    return tab === "recommend" ? matches.filter(p => p.category !== "metro") : matches;
  }, [
    allPlaces,
    tab,
    library,
    activeCollection,
    query,
    originForDistance,
    category,
    radius,
    photosOnly,
    sort,
    onlyBounds,
    bounds,
    viewCenter,
    metroLine,
  ]);
  const mapPlaces = useMemo(
    () =>
      selected && !visible.some((p) => p.id === selected.id)
        ? [...visible, selected]
        : visible,
    [visible, selected],
  );
  const suggestions = useMemo(() => quickSuggestions(allPlaces, originForDistance), [allPlaces, originForDistance]);
  useEffect(() => {
    setRenderLimit(40);
    listRef.current?.scrollTo({ top: 0 });
  }, [city, tab, collectionId, query, category, sort, radius, photosOnly, onlyBounds]);
  useEffect(() => {
    let alive = true;
    readLibrary()
      .then((d) => {
        if (alive) {
          setLibrary(d);
          libraryRef.current = d;
          setLibraryReady(true);
        }
      })
      .catch(() => {
        setLibraryReady(true);
        setNotice(
          "ذخیره‌سازی مرورگر در دسترس نیست. ذخیره‌ها پس از بستن صفحه ممکن است باقی نمانند.",
        );
      });
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      alive = false;
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);
  useEffect(() => {
    const id = ++cityRequest.current;
    loadAbort.current?.abort();
    requestId.current++;
    setFetching(false);
    setLoadState("loading");
    setSelected(undefined);
    setRouteOpen(false);
    setRoute(undefined);
    setPicking(false);
    setOnlyBounds(false);
    setMapMoved(false);
    setViewCenter(city);
    setQuery("");
    setRadius(cityRadius);
    setNotice("");
    Promise.all([snapshot(city), featuredPlaces()]).then(async ([s, f]) => {
      if (id !== cityRequest.current) return;
      setFeatured(f);
      setPlaces(s.places);
      setDataDate(s.date || "");
      if (s.places.length || f.some((p: Place) => p.city === city.id))
        setLoadState("snapshot");
      else {
        setLoadState("loading");
        const controller = new AbortController();
        loadAbort.current = controller;
        setFetching(true);
        try {
          const result = await nearby(city, 15000, controller.signal);
          if (id !== cityRequest.current) return;
          setPlaces(result);
          setLoadState("live");
          setDataDate(new Date().toISOString());
        } catch (e) {
          if (id === cityRequest.current && !controller.signal.aborted) {
            setLoadState("error");
            setNotice(
              "دریافت مکان‌های این شهر ممکن نشد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.",
            );
          }
        } finally {
          if (id === cityRequest.current) setFetching(false);
        }
      }
    });
  }, [city]);
  useEffect(() => {
    let alive = true;
    setMetroNetwork(undefined); setMetroLine(undefined); setMetroError(false);
    if (city.id === "tehran") tehranMetro().then(network => {
      if (alive) setMetroNetwork(network);
    }).catch(() => { if (alive) setMetroError(true); });
    return () => { alive = false; };
  }, [city.id, metroAttempt]);
  useEffect(() => {
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(
    () => () => {
      if (watch.current !== undefined)
        navigator.geolocation?.clearWatch(watch.current);
      loadAbort.current?.abort();
    },
    [],
  );
  useEffect(() => {
    if (!routeOpen || !selected || !origin) return;
    const controller = new AbortController();
    setRoute(undefined);
    setRouteLoading(true);
    setRouteError("");
    getRoute(origin, selected, mode, controller.signal)
      .then((r) => {
        if (!controller.signal.aborted) setRoute(r);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setRouteError(
            (e as Error).name === "AbortError"
              ? "دریافت مسیر طول کشید. دوباره امتحان کن."
              : (e as Error).message,
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setRouteLoading(false);
      });
    return () => controller.abort();
  }, [routeOpen, selected?.id, origin, mode]);
  useEffect(() => {
    if (!usingNeshan || !selected?.providerId) return;
    const controller = new AbortController();
    const id = selected.id;
    import("./neshan").then(({ neshanDetails }) => neshanDetails(selected.providerId!, controller.signal))
      .then(details => {
        if (controller.signal.aborted) return;
        const available = Object.fromEntries(Object.entries(details).filter(([, v]) => v != null && v !== ""));
        setSelected(p => p?.id === id ? { ...p, ...available } : p);
        setPlaces(previous => previous.map(p => p.id === id ? { ...p, ...available } : p));
      }).catch(() => {});
    return () => controller.abort();
  }, [selected?.id, selected?.providerId]);
  useEffect(() => {
    const hash = new URLSearchParams(location.hash.slice(1));
    const point = {
      lat: Number(hash.get("lat")),
      lng: Number(hash.get("lng")),
    };
    if (hash.has("place") && validPoint(point) && hash.get("name")) {
      setSelected({
        ...point,
        id: hash.get("place")!,
        name: hash.get("name")!.slice(0, 180),
        category: ["sight", "cafe", "nature", "metro"].includes(
          hash.get("category") || "",
        )
          ? (hash.get("category") as Category)
          : "sight",
        source: "لینک اشتراک‌گذاری",
      });
      setTimeout(() => map.current?.fly(point, 14), 1200);
    }
  }, []);
  function commit(next: Library) {
    libraryRef.current = next;
    setLibrary(next);
    saveQueue.current = saveQueue.current
      .then(() => writeLibrary(next))
      .catch(() => {
        setNotice(
          "ذخیره‌سازی انجام نشد؛ فضای مرورگر را بررسی کن و از اطلاعاتت خروجی بگیر.",
        );
      });
  }
  function selectPlace(p: Place) {
    setSelected(p);
    setRouteOpen(false);
    setRoute(undefined);
    setPicking(false);
    setStepsExpanded(false);
    setSheet("mid");
    map.current?.fly(p, Math.max(14, zoom));
    requestAnimationFrame(() =>
      document
        .getElementById("card-" + p.id)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
    );
  }
  function toggleSave(p: Place) {
    if (!libraryReady) return;
    const current = libraryRef.current;
    if (current.saved.some((x) => x.id === p.id)) {
      const notes = { ...current.notes };
      delete notes[p.id];
      commit({
        ...current,
        saved: current.saved.filter((x) => x.id !== p.id),
        collections: current.collections.map((c) => ({
          ...c,
          ids: c.ids.filter((id) => id !== p.id),
        })),
        notes,
      });
      setToast("از ذخیره‌ها برداشته شد");
    } else {
      commit({ ...current, saved: [p, ...current.saved] });
      setToast("به مکان‌های ذخیره‌شده اضافه شد");
    }
  }
  function setNavigation(t: Tab) {
    setTab(t);
    setQuery("");
    setSelected(undefined);
    setRouteOpen(false);
    setRoute(undefined);
    setPicking(false);
    if (t !== "collections") setCollectionId(undefined);
    setSheet("mid");
  }
  async function refreshArea() {
    const id = ++requestId.current;
    loadAbort.current?.abort();
    const controller = new AbortController();
    loadAbort.current = controller;
    setFetching(true);
    setNotice("");
    const center = { ...viewCenter };
    try {
      const data = await nearby(center, Math.min(radius || 15000, 15000), controller.signal);
      if (id !== requestId.current) return;
      setPlaces(previous => mergePlaces(previous, data));
      setOnlyBounds(false);
      setMapMoved(false);
      setLoadState("live");
      setDataDate(new Date().toISOString());
      setToast(`${fa(data.length)} مکان ثبت‌شده در این محدوده دریافت شد`);
    } catch (e) {
      if (!controller.signal.aborted && id === requestId.current)
        setNotice(
          "دریافت مکان‌های تازه ممکن نشد؛ " +
            ((e as Error).message || "اتصال اینترنت را بررسی کن."),
        );
    } finally {
      if (id === requestId.current) setFetching(false);
    }
  }
  async function searchProvider() {
    if (!usingNeshan || query.trim().length < 2 || searchingPlaces) return;
    const cityId = cityRequest.current;
    const term = query.trim();
    setSearchingPlaces(true);
    try {
      const { neshanSearch } = await import("./neshan");
      const results = await neshanSearch(term, city);
      if (cityId !== cityRequest.current) return;
      setPlaces(previous => mergePlaces(previous, results));
      setRadius(0); setOnlyBounds(false);
      setToast(results.length ? `${fa(results.length)} مکان مرتبط از نشان دریافت شد` : "نشان مکان مرتبطی در این دسته‌ها پیدا نکرد");
    } catch {
      if (cityId === cityRequest.current) setNotice("جست‌وجوی نشان در دسترس نیست؛ کلید و فعال‌سازی سرویس جست‌وجو را در سرور بررسی کن. فهرست فعلی در دسترس است.");
    } finally { setSearchingPlaces(false); }
  }
  function startGPS() {
    if (gpsLoading) return;
    if (gpsActive) {
      if (gps) map.current?.fly(gps, 15);
      return;
    }
    if (!navigator.geolocation) {
      setNotice(
        "مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند. می‌توانی مبدا را روی نقشه انتخاب کنی.",
      );
      return;
    }
    setGpsLoading(true);
    firstGps.current = true;
    watch.current = navigator.geolocation.watchPosition(
      (p) => {
        const pos = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
        };
        setGps(pos);
        setGpsLoading(false);
        setGpsActive(true);
        if (firstGps.current) {
          map.current?.fly(pos, 14);
          firstGps.current = false;
          setToast("موقعیت زنده روشن شد؛ فقط تا وقتی صفحه باز است");
        }
      },
      (e) => {
        setGpsLoading(false);
        setNotice(
          e.code === 1
            ? "دسترسی موقعیت مکانی رد شد. از تنظیمات مرورگر اجازه بده یا مبدا را روی نقشه انتخاب کن."
            : e.code === 2
              ? "موقعیت پیدا نشد. GPS گوشی و دسترسی مرورگر را بررسی کن."
              : "پیدا کردن موقعیت طول کشید. دوباره تلاش کن.",
        );
        if (watch.current !== undefined)
          navigator.geolocation.clearWatch(watch.current);
        watch.current = undefined;
        setGpsActive(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  }
  function stopGPS() {
    if (watch.current !== undefined)
      navigator.geolocation.clearWatch(watch.current);
    watch.current = undefined;
    setGpsActive(false);
    setGpsLoading(false);
    setGps(undefined);
    setToast("موقعیت زنده خاموش شد");
  }
  function openRoute() {
    setRouteOpen(true);
    setOrigin(gps ? { lat: gps.lat, lng: gps.lng } : { ...viewCenter });
    setOriginLabel(gps ? "موقعیت فعلی من" : "مرکز نقشه (مبدا قابل تغییر)");
    setSheet("mid");
  }
  async function share(p: Place) {
    const url = shareUrl(p);
    try {
      if (navigator.share) {
        await navigator.share({
          title: p.name,
          text: `${p.name} در کجا بریم`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setToast("لینک مکان کپی شد");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setShareFallback(url);
    }
  }
  async function remoteCitySearch() {
    setSearchingCity(true);
    try {
      const result = await findCities(cityQuery);
      setRemoteCities(result);
      if (!result.length) setToast("شهری با این نام پیدا نشد");
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setSearchingCity(false);
    }
  }
  function createCollection() {
    const name = newCollection.trim();
    if (!name) return;
    const current = libraryRef.current;
    if (current.collections.length >= 100) {
      setToast("حداکثر ۱۰۰ مجموعه می‌توانی داشته باشی");
      return;
    }
    const id = crypto.randomUUID();
    commit({
      ...current,
      saved:
        selected && !current.saved.some((place) => place.id === selected.id)
          ? [selected, ...current.saved]
          : current.saved,
      collections: [
        ...current.collections,
        { id, name: name.slice(0, 60), ids: selected ? [selected.id] : [] },
      ],
    });
    setNewCollection("");
    setCollectionId(id);
    setTab("collections");
    setModal(undefined);
    setToast("مجموعه ساخته شد");
  }
  function assign(cId: string, p: Place) {
    let current = libraryRef.current;
    const exists = current.saved.some((x) => x.id === p.id);
    if (!exists) current = { ...current, saved: [p, ...current.saved] };
    commit({
      ...current,
      collections: current.collections.map((c) =>
        c.id !== cId
          ? c
          : {
              ...c,
              ids: c.ids.includes(p.id)
                ? c.ids.filter((x) => x !== p.id)
                : [...c.ids, p.id],
            },
      ),
    });
  }
  function downloadBackup() {
    const blob = new Blob([JSON.stringify(libraryRef.current, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "koja-berim-backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importBackup(file?: File) {
    if (!file) return;
    try {
      if (file.size > 5e6) throw Error("حجم فایل باید کمتر از ۵ مگابایت باشد.");
      const data = parseLibrary(JSON.parse(await file.text()));
      if (
        !window.confirm(
          "ذخیره‌ها و مجموعه‌های فعلی با اطلاعات این فایل جایگزین شوند؟",
        )
      )
        return;
      commit(data);
      setToast("پشتیبان بازیابی شد");
    } catch (e) {
      setToast((e as Error).message || "فایل معتبر نیست.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  const title =
    tab === "explore"
      ? "یه جای خوب پیدا کن"
      : tab === "recommend"
        ? "پیشنهاد برای گشت امروز"
        : tab === "saved"
          ? "مکان‌های ذخیره‌شده"
          : activeCollection?.name || "مجموعه‌های من";
  const navigation = [
    { id: "explore" as Tab, label: "کشف شهر", mobile: "نقشه", Icon: MapIcon },
    {
      id: "saved" as Tab,
      label: "ذخیره‌شده‌ها",
      mobile: "ذخیره‌ها",
      Icon: Bookmark,
    },
    {
      id: "collections" as Tab,
      label: "مجموعه‌های من",
      mobile: "مجموعه‌ها",
      Icon: Layers,
    },
  ];
  const hasFilter = radius !== cityRadius || photosOnly || sort !== "recommended" || onlyBounds;
  const detail = selected && (
    <section
      className={"detail-card" + (routeOpen ? " with-route" : "")}
      aria-label={"جزئیات " + selected.name}
    >
      <button
        className="detail-close icon-button"
        aria-label="بستن جزئیات"
        onClick={() => {
          setSelected(undefined);
          setRouteOpen(false);
          setRoute(undefined);
          setPicking(false);
        }}
      >
        <X size={18} />
      </button>
      {!routeOpen ? (
        <>
          <div className="detail-cover">
            <Photo place={selected} />
            <div className="detail-cover-shade" />
            <span className="category-tag">
              <CatIcon category={selected.category} size={14} />
              {categoryLabel(selected.category)}
            </span>
            <button
              className={
                "icon-button save-cover " +
                (savedIds.has(selected.id) ? "is-saved" : "")
              }
              aria-label="ذخیره یا حذف مکان"
              onClick={() => toggleSave(selected)}
            >
              <Bookmark
                size={20}
                fill={savedIds.has(selected.id) ? "currentColor" : "none"}
              />
            </button>
          </div>
          <div className="detail-body">
            <div className="detail-title">
              <h2>{selected.name}</h2>
              <button
                className="icon-button"
                title="اشتراک‌گذاری"
                aria-label="اشتراک‌گذاری مکان"
                onClick={() => share(selected)}
              >
                <Share2 size={18} />
              </button>
            </div>
            <div className="detail-meta">
              <span>
                <MapPin size={14} />
                {selected.address ||
                  cities.find((c) => c.id === selected.city)?.name ||
                  city.name}
              </span>
              <span>
                {distanceText(distance(originForDistance, selected))} فاصلهٔ
                مستقیم {distanceFromGPS ? "از تو" : "از مرکز شهر"}
              </span>
            </div>
            {selected.metroLines?.length && metroNetwork ? <div className="station-line-badges">
              {selected.metroLines.map(id => {
                const line = metroNetwork.lines.find(line => line.id === id);
                return line && <button key={id} style={{ borderColor: line.color, color: line.color }} onClick={() => {
                  setTab("explore"); setCategory("metro"); setMetroLine(id); setRadius(0); setPhotosOnly(false); setOnlyBounds(false); setQuery("");
                }}>خط {fa(Number(id))}</button>;
              })}
              {selected.metroLines.length > 1 && <small>ایستگاه تقاطعی</small>}
            </div> : null}
            {selected.description && (
              <p className="description">{selected.description}</p>
            )}
            {selected.hours && (
              <p className="hours">
                <Info size={14} />
                ساعات ثبت‌شده: <bdi>{selected.hours}</bdi>
              </p>
            )}
            <div className="detail-actions">
              <button className="primary" onClick={openRoute}>
                <Navigation size={17} />
                مسیریابی
              </button>
              <button className="secondary" onClick={() => setModal("assign")}>
                <Plus size={17} />
                افزودن به مجموعه
              </button>
            </div>
            <details className="more-details">
              <summary>
                اطلاعات بیشتر و یادداشت
                <ChevronDown size={14} />
              </summary>
              <a href={"https://www.google.com/maps/search/?" + new URLSearchParams({ api: "1",
                query: selected.name + " " + (cities.find(c => c.id === selected.city)?.name || city.name),
              })} target="_blank" rel="noreferrer">
                جست‌وجوی عکس‌ها و نظرها در Google Maps <ExternalLink size={12} />
              </a>
              {selected.osmType && selected.osmId && <a href={`https://www.openstreetmap.org/${selected.osmType}/${selected.osmId}`} target="_blank" rel="noreferrer">
                اطلاعات ثبت‌شدهٔ این مکان در OpenStreetMap <ExternalLink size={12} />
              </a>}
              {selected.phone && (
                <a href={"tel:" + selected.phone.replace(/[^+\d]/g, "")}>
                  تماس با مکان: <bdi>{selected.phone}</bdi>
                </a>
              )}
              {safeUrl(selected.website) && (
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={safeUrl(selected.website)}
                >
                  وب‌سایت مکان <ExternalLink size={12} />
                </a>
              )}
              {safeUrl(selected.wiki) && (
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={safeUrl(selected.wiki)}
                >
                  دربارهٔ این مکان در ویکی‌پدیا <ExternalLink size={12} />
                </a>
              )}
              <label>
                یادداشت شخصی
                <textarea
                  key={selected.id}
                  placeholder="چی اینجا رو برات خاص می‌کنه؟"
                  maxLength={3000}
                  value={library.notes[selected.id] || ""}
                  onChange={(e) => {
                    const current = libraryRef.current;
                    commit({
                      ...current,
                      saved: current.saved.some((x) => x.id === selected.id)
                        ? current.saved
                        : [selected, ...current.saved],
                      notes: {
                        ...current.notes,
                        [selected.id]: e.target.value,
                      },
                    });
                  }}
                />
              </label>
            </details>
            <div className="source-line">
              منبع اطلاعات: {selected.source}
              {isPlacePhoto(selected.photo) && (
                <>
                  {" "}
                  ·{" "}
                  <a
                    href={safeUrl(selected.photo.source)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    عکس: {selected.photo.author} · {selected.photo.license}
                  </a>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="route-body">
          <div className="eyebrow">
            <RouteIcon size={15} />
            برنامهٔ رسیدن
          </div>
          <h2>{selected.name}</h2>
          <div className="mode-switch">
            <button
              className={mode === "walk" ? "active" : ""}
              onClick={() => setMode("walk")}
            >
              <Footprints size={18} />
              پیاده
            </button>
            <button
              className={mode === "car" ? "active" : ""}
              onClick={() => setMode("car")}
            >
              <Car size={18} />
              خودرو
            </button>
          </div>
          <div className="origin-box">
            <span>
              <span className="origin-dot" />
              {originLabel}
            </span>
            <button
              onClick={() => {
                setPicking(true);
                setSheet("peek");
                setToast("برای تعیین مبدا، یک نقطه روی نقشه بزن");
              }}
            >
              تغییر روی نقشه
            </button>
          </div>
          {gps && (
            <button
              className="text-button"
              onClick={() => {
                setOrigin({ lat: gps.lat, lng: gps.lng });
                setOriginLabel("موقعیت فعلی من");
              }}
            >
              <LocateFixed size={14} />
              شروع از موقعیت فعلی من
            </button>
          )}
          {routeLoading ? (
            <div className="route-loading">
              <LoaderCircle className="spin" size={22} />
              در حال پیدا کردن مسیر…
            </div>
          ) : routeError ? (
            <div className="route-error">
              <p>{routeError}</p>
              <button
                className="secondary"
                onClick={() =>
                  setOrigin(origin ? { ...origin } : { ...viewCenter })
                }
              >
                تلاش دوباره
              </button>
            </div>
          ) : (
            route && (
              <>
                <div className="route-summary">
                  <strong>{durationText(route.duration)}</strong>
                  <span>
                    {distanceText(route.distance)} مسیر{" "}
                    {mode === "walk" ? "پیاده" : "خودرو"}
                  </span>
                  <button
                    className="icon-button"
                    aria-label="نمایش کل مسیر"
                    onClick={() => map.current?.fitRoute()}
                  >
                    <MapIcon size={20} />
                  </button>
                </div>
                <p className="route-note">
                  زمان تخمینی است و ترافیک زنده را لحاظ نمی‌کند.
                </p>
                <button
                  className="steps-toggle"
                  onClick={() => setStepsExpanded((x) => !x)}
                >
                  {stepsExpanded
                    ? "بستن راهنمای مسیر"
                    : "راهنمای مرحله‌به‌مرحله"}
                  <ChevronDown size={16} />
                </button>
                {stepsExpanded && (
                  <ol className="steps">
                    {route.steps.map((s, i) => (
                      <li key={i}>
                        <span>{s.text}</span>
                        <small>{distanceText(s.distance)}</small>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            )
          )}
          <a
            className="primary external-route"
            href={
              "https://www.google.com/maps/dir/?" +
              new URLSearchParams({
                api: "1",
                destination: `${selected.lat},${selected.lng}`,
                travelmode: mode === "walk" ? "walking" : "driving",
                ...(origin ? { origin: `${origin.lat},${origin.lng}` } : {}),
              })
            }
            target="_blank"
            rel="noreferrer"
          >
            ادامه در Google Maps
            <ArrowUpLeft size={17} />
          </a>
          <button
            className="text-button"
            onClick={() => {
              setRouteOpen(false);
              setRoute(undefined);
              setPicking(false);
            }}
          >
            بازگشت به جزئیات مکان
          </button>
        </div>
      )}
    </section>
  );
  return (
    <div
      className={
        "app tab-" +
        tab +
        (selected ? " has-detail" : "") +
        (picking ? " is-picking" : "")
      }
    >
      <header className="topbar">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            setNavigation("explore");
          }}
          aria-label="کجا بریم، صفحه اصلی"
        >
          <span className="brand-symbol">
            <MapPin size={23} />
            <span />
          </span>
          <span>
            کجا بریم<span className="brand-question">؟</span>
            <small>شهر، هنوز دیدنی داره</small>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="بخش‌های برنامه">
          {navigation.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setNavigation(id)}
            >
              <Icon size={17} />
              {label}
              {id === "saved" && library.saved.length > 0 && (
                <span className="nav-count">{fa(library.saved.length)}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <button
            className="city-button"
            onClick={() => {
              setCityQuery("");
              setRemoteCities([]);
              setModal("city");
            }}
          >
            <MapPin size={16} />
            {city.name}
            <ChevronDown size={14} />
          </button>
          <button
            className="icon-button about-button"
            aria-label="راهنما و تنظیمات"
            onClick={() => setModal("about")}
          >
            <Info size={20} />
          </button>
        </div>
      </header>
      <main className="workspace">
        <div className="map-region">
          <Suspense
            fallback={
              <div className="map-loading">
                <span className="spinner" />
                در حال آماده‌کردن نقشه…
              </div>
            }
          >
            <MapView
              ref={map}
              city={city}
              places={mapPlaces}
              selected={selected}
              hover={hover}
              location={gps}
              route={route}
              metro={city.id === "tehran" && category === "metro" && (tab === "explore" || tab === "recommend") ? metroNetwork : undefined}
              metroLine={metroLine}
              onMetroLine={setMetroLine}
              onSelect={selectPlace}
              onView={(center, b, z) => {
                setViewCenter(center);
                setBounds(b);
                setZoom(z);
                if (distance(center, city) > 500) setMapMoved(true);
              }}
              onPick={
                picking
                  ? (p) => {
                      setOrigin(p);
                      setOriginLabel("مبدا انتخاب‌شده روی نقشه");
                      setPicking(false);
                      setSheet("mid");
                    }
                  : undefined
              }
            />
          </Suspense>
          <div className="map-top-left">
            <button
              className={"area-button " + (fetching ? "working" : "")}
              onClick={refreshArea}
              disabled={fetching || !online}
            >
              <RefreshCw size={16} className={fetching ? "spin" : ""} />
              {fetching
                ? "در حال جست‌وجو…"
                : mapMoved
                  ? "جست‌وجو در این محدوده"
                  : "به‌روزرسانی مکان‌های اطراف"}
            </button>
            {onlyBounds && (
              <button
                className="area-reset"
                onClick={() => {
                  setOnlyBounds(false);
                  setMapMoved(false);
                }}
              >
                برداشتن محدودیت نمای نقشه <X size={12} />
              </button>
            )}
          </div>
          <div className="map-tools">
            <button
              className={"icon-button " + (gpsActive ? "gps-active" : "")}
              aria-label={
                gpsActive ? "نمایش موقعیت زنده من" : "فعال‌کردن موقعیت زنده من"
              }
              onClick={startGPS}
            >
              {gpsLoading ? (
                <LoaderCircle className="spin" size={21} />
              ) : (
                <LocateFixed size={21} />
              )}
            </button>
            <div className="zoom-controls">
              <button
                className="icon-button"
                aria-label="بزرگ‌نمایی"
                onClick={() => map.current?.zoom(1)}
              >
                <Plus size={21} />
              </button>
              <button
                className="icon-button"
                aria-label="کوچک‌نمایی"
                onClick={() => map.current?.zoom(-1)}
              >
                <Minus size={21} />
              </button>
            </div>
          </div>
          {gpsActive && (
            <button className="live-location" onClick={stopGPS}>
              <span />
              موقعیت زنده · خاموش کردن
              <X size={12} />
            </button>
          )}
          {picking && (
            <div className="pick-banner">
              <MapPin size={18} />
              مبدا مسیر را روی نقشه انتخاب کن
              <button onClick={() => setPicking(false)}>لغو</button>
            </div>
          )}
          {!online && (
            <div className="offline-label">
              <WifiOff size={15} />
              آفلاین هستی؛ مکان‌ها و ذخیره‌های قبلی در دسترس‌اند.
            </div>
          )}
          <div className="map-legend">
            <span>
              <i className="legend-dot cafe" />
              کافه
            </span>
            <span>
              <i className="legend-dot sight" />
              دیدنی
            </span>
            <span>
              <i className="legend-dot nature" />
              بوستان
            </span>
            <span>
              <i className="legend-dot metro" />
              مترو
            </span>
          </div>
          <div className="desktop-detail">{detail}</div>
        </div>
        <aside className={"sidebar sheet-" + sheet} aria-label="فهرست مکان‌ها">
          <button
            className="sheet-handle"
            aria-label={sheet === "full" ? "کوچک کردن فهرست" : "باز کردن فهرست"}
            onClick={() => {
              if (dragged.current) {
                dragged.current = false;
                return;
              }
              setSheet((x) => (x === "full" ? "peek" : "full"));
            }}
            onPointerDown={(e) => {
              dragged.current = false;
              sheetStart.current = e.clientY;
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerUp={(e) => {
              const delta = e.clientY - sheetStart.current;
              if (Math.abs(delta) > 25) {
                dragged.current = true;
                setSheet(delta < 0 ? "full" : "peek");
                e.preventDefault();
              }
            }}
          >
            <span />
          </button>
          <div className="sidebar-controls">
            <div className="sidebar-intro">
              <div>
                <span className="eyebrow">
                  {tab === "explore"
                    ? "برای یک گشت تازه"
                    : tab === "recommend"
                      ? "کمی از مسیر همیشگی دور شو"
                      : "نقشهٔ شخصی تو"}
                </span>
                <h1>{title}</h1>
              </div>
              <span className="intro-icon">
                <Compass size={23} />
              </span>
            </div>
            <form
              className="search-field"
              onSubmit={(e) => {
                e.preventDefault();
                setSheet("full");
                if (usingNeshan) void searchProvider();
              }}
            >
              <Search size={20} />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (selected) {
                    setSelected(undefined);
                    setRouteOpen(false);
                    setRoute(undefined);
                  }
                }}
                placeholder={
                  tab === "saved" || tab === "collections"
                    ? "جست‌وجو در مکان‌های خودت…"
                    : "کجا بریم؟ اسم مکان یا دسته…"
                }
                aria-label="جست‌وجوی مکان"
              />
              {query && (
                <button
                  type="button"
                  className="icon-button"
                  aria-label="پاک کردن جست‌وجو"
                  onClick={() => setQuery("")}
                >
                  <X size={16} />
                </button>
              )}
            </form>
            {usingNeshan && query.trim().length >= 2 && <button className="provider-search text-button" onClick={searchProvider} disabled={searchingPlaces}>
              {searchingPlaces ? <LoaderCircle size={15} className="spin" /> : <Search size={15} />}
              {searchingPlaces ? "در حال جست‌وجو در نشان…" : "جست‌وجوی این نام در نشان"}
            </button>}
            {(tab === "explore" || tab === "recommend") && (
              <div className="category-row">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    aria-pressed={category === c.id}
                    className={
                      "category-chip " + (category === c.id ? "active" : "")
                    }
                    onClick={() => {
                      setCategory(c.id);
                      if (c.id === "metro") {
                        setMetroLine(undefined); setQuery(""); setRadius(0); setPhotosOnly(false); setOnlyBounds(false);
                      }
                      setSelected(undefined);
                      setRouteOpen(false);
                      setRoute(undefined);
                    }}
                  >
                    <CatIcon category={c.id} size={16} />
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="list-heading">
            <div>
              {tab === "collections" && !activeCollection ? (
                <>
                  <strong>{fa(library.collections.length)}</strong> مجموعه
                </>
              ) : (
                <>
                  <strong>{fa(visible.length)}</strong>{" "}
                  {tab === "recommend" ? "پیشنهاد برای تو" : "مکان"}
                  {tab === "explore" && <span>{onlyBounds ? " روی نقشه" : " در شهر و اطراف"}</span>}
                </>
              )}
            </div>
            {tab === "explore" ? (
              <button
                className={"filter-button " + (hasFilter ? "active" : "")}
                onClick={() => setModal("filters")}
              >
                <SlidersHorizontal size={15} />
                فیلتر و ترتیب{hasFilter && <i />}
              </button>
            ) : tab === "collections" ? (
              <button
                className="text-button"
                onClick={() => setModal("addCollection")}
              >
                <Plus size={16} />
                مجموعه جدید
              </button>
            ) : tab === "saved" ? (
              <button
                className="text-button"
                title="خروجی پشتیبان"
                onClick={downloadBackup}
              >
                <Download size={16} />
              </button>
            ) : (
              <button className="text-button" onClick={() => setModal("about")}>
                <Info size={16} />
              </button>
            )}
          </div>
          {tab === "explore" && visible.length > 0 && (
            <div className="photo-coverage">
              <button aria-pressed={photosOnly} onClick={() => setPhotosOnly(!photosOnly)}>
                <ImageIcon size={14} />
                {fa(visible.filter(place => isPlacePhoto(place.photo)).length)} مکان با عکس
                {photosOnly && <X size={13} />}
              </button>
              <span>{photosOnly ? "نمایش مکان‌های عکس‌دار" : "در این فهرست"}</span>
            </div>
          )}
          {(tab === "explore" || tab === "recommend") && category !== "metro" && sort === "recommended" &&
            <p className="ranking-note">شماره‌ها ترتیب پیشنهادی بر اساس اطلاعات، عکس و فاصله‌اند؛ امتیاز کاربران نیستند.</p>}
          {tab === "recommend" && (
            <p className="recommend-explainer">
              دیدنی‌های منتخب و مکان‌های دارای اطلاعات بیشتر، با توجه به فاصله؛
              بدون امتیاز و نظر ساختگی.
            </p>
          )}
          <div className="place-list" ref={listRef}>
            {category === "metro" && city.id === "tehran" && (tab === "explore" || tab === "recommend") && (
              <section className="metro-panel" aria-label="خطوط مترو تهران">
                <div className="suggestions-heading"><strong>خطوط متروی تهران و حومه</strong>
                  <button onClick={() => map.current?.fitMetro(metroLine)}><MapIcon size={14} /> نمایش کل مسیر</button>
                </div>
                {metroNetwork ? <>
                  <div className="metro-line-options">
                    <button className={!metroLine ? "active" : ""} aria-pressed={!metroLine} onClick={() => setMetroLine(undefined)}>همهٔ خطوط</button>
                    {metroNetwork.lines.map(line => <button key={line.id} className={metroLine === line.id ? "active" : ""}
                      aria-pressed={metroLine === line.id} style={{ "--metro-color": line.color } as React.CSSProperties}
                      onClick={() => { setMetroLine(line.id); setQuery(""); setSelected(undefined); setRoute(undefined); setRouteOpen(false); }}>
                      <i /> خط {fa(Number(line.id))}<small>{fa(line.stationIds.length)}</small>
                    </button>)}
                  </div>
                  {metroLine && <p className="metro-endpoints">{metroNetwork.lines.find(line => line.id === metroLine)?.routes
                    .filter(route => route.from && route.to).filter((route, i, routes) => i === 0 || !routes.slice(0, i).some(r => r.from === route.to && r.to === route.from))
                    .map(route => `${route.from} ↔ ${route.to}`).join(" · ")}</p>}
                  <p className="metro-note">حلقهٔ چندرنگ: ایستگاه تقاطعی. مسیرها و انشعاب‌های ثبت‌شده در OSM نمایش داده می‌شوند؛ اطلاعات زندهٔ بهره‌برداری نیست.</p>
                </> : metroError ? <p className="metro-note">اطلاعات خطوط دریافت نشد. <button onClick={() => setMetroAttempt(n => n + 1)}>تلاش دوباره</button></p>
                  : <p className="metro-note">در حال دریافت خطوط و ایستگاه‌ها…</p>}
              </section>
            )}
            {tab === "explore" && !query && category === "all" && suggestions.length > 0 && (
              <section className="quick-suggestions" aria-label="پیشنهادهای گشت">
                <div className="suggestions-heading">
                  <strong>برای گشت {city.name}</strong>
                  <button onClick={() => setNavigation("recommend")}>همهٔ پیشنهادها <ChevronLeft size={14} /></button>
                </div>
                <div className="suggestions-row">
                  {suggestions.map(p => <button key={p.id} onClick={() => selectPlace(p)} aria-label={"پیشنهاد: " + p.name}>
                    <Photo place={p} />
                    <b>{p.name}</b><small>{suggestionReason(p)}</small>
                  </button>)}
                </div>
              </section>
            )}
            {tab === "collections" && !activeCollection ? (
              <>
                <p className="collection-lead">
                  جاهایی که دوست داری بری، مرتب و دم دست.
                </p>
                <div className="collection-grid">
                  {library.collections.map((c, i) => {
                    const preview = library.saved.find(
                      (p) => c.ids.includes(p.id) && isPlacePhoto(p.photo),
                    );
                    return (
                      <button
                        className="collection-tile"
                        key={c.id}
                        onClick={() => setCollectionId(c.id)}
                      >
                        <div className={"collection-art tone-" + (i % 3)}>
                          {preview ? (
                            <Photo place={preview} />
                          ) : (
                            <Layers size={34} />
                          )}
                          <span>{fa(c.ids.length)} مکان</span>
                        </div>
                        <strong>{c.name}</strong>
                        <ArrowUpLeft size={17} />
                      </button>
                    );
                  })}
                  <button
                    className="collection-tile add"
                    onClick={() => setModal("addCollection")}
                  >
                    <div className="collection-art">
                      <Plus size={30} />
                    </div>
                    <strong>یک مجموعهٔ تازه</strong>
                  </button>
                </div>
              </>
            ) : (
              <>
                {tab === "collections" && activeCollection && (
                  <div className="collection-toolbar">
                    <button
                      className="text-button"
                      onClick={() => setCollectionId(undefined)}
                    >
                      <ArrowRight size={16} />
                      همه مجموعه‌ها
                    </button>
                    <button
                      className="icon-button"
                      aria-label="تغییر نام مجموعه"
                      onClick={() => {
                        const name = window.prompt(
                          "نام جدید مجموعه",
                          activeCollection.name,
                        );
                        if (name?.trim())
                          commit({
                            ...libraryRef.current,
                            collections: libraryRef.current.collections.map(
                              (c) =>
                                c.id === activeCollection.id
                                  ? { ...c, name: name.trim().slice(0, 60) }
                                  : c,
                            ),
                          });
                      }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label="حذف مجموعه"
                      onClick={() => {
                        if (
                          window.confirm(
                            "مجموعه حذف شود؟ مکان‌های ذخیره‌شده باقی می‌مانند.",
                          )
                        ) {
                          commit({
                            ...libraryRef.current,
                            collections: libraryRef.current.collections.filter(
                              (c) => c.id !== activeCollection.id,
                            ),
                          });
                          setCollectionId(undefined);
                        }
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
                {loadState === "loading" &&
                  tab === "explore" &&
                  Array.from({ length: 5 }, (_, i) => (
                    <div className="skeleton-card" key={i}>
                      <div />
                      <section>
                        <i />
                        <i />
                        <i />
                      </section>
                    </div>
                  ))}
                {visible.slice(0, renderLimit).map((p, i) => (
                  <article
                    id={"card-" + p.id}
                    key={p.id}
                    className={
                      "place-card " + (selected?.id === p.id ? "selected" : "")
                    }
                    onMouseEnter={() => setHover(p.id)}
                    onMouseLeave={() => setHover(undefined)}
                  >
                    <button
                      className="card-main"
                      onClick={() => selectPlace(p)}
                      aria-label={"نمایش " + p.name + " روی نقشه"}
                    >
                      <Photo place={p} />
                      <div className="card-copy">
                        <div className="card-title">
                          {p.category !== "metro" && (sort === "recommended" || tab === "recommend") && <span className="place-rank" title="ترتیب پیشنهادی بر اساس اطلاعات موجود">{fa(i + 1)}</span>}
                          <h2>{p.name}</h2>
                          {p.featured && (
                            <span className="featured-badge">{p.category === "cafe" ? "کافهٔ منتخب" : "دیدنیِ منتخب"}</span>
                          )}
                        </div>
                        <p>
                          <CatIcon category={p.category} size={12} />
                          {categoryLabel(p.category)}
                          <span>·</span>
                          {distanceText(distance(originForDistance, p))}
                        </p>
                        {p.metroLines?.length && metroNetwork ? <div className="card-metro-lines">{p.metroLines.map(id => <span key={id}
                          style={{ borderColor: metroNetwork.lines.find(line => line.id === id)?.color }}>
                          خط {fa(Number(id))}
                        </span>)}</div> : null}
                        <span className="card-address">
                          <MapPin size={12} />
                          {p.address ||
                            cities.find((c) => c.id === p.city)?.name ||
                            city.name}
                        </span>
                        {tab === "recommend" && <small className="suggestion-reason">{suggestionReason(p)}</small>}
                      </div>
                    </button>
                    <button
                      className={
                        "card-save " + (savedIds.has(p.id) ? "is-saved" : "")
                      }
                      aria-label={
                        savedIds.has(p.id)
                          ? "برداشتن " + p.name + " از ذخیره‌ها"
                          : "ذخیره " + p.name
                      }
                      disabled={!libraryReady}
                      onClick={() => toggleSave(p)}
                    >
                      <Bookmark
                        size={17}
                        fill={savedIds.has(p.id) ? "currentColor" : "none"}
                      />
                    </button>
                    {tab === "collections" && activeCollection && (
                      <button
                        className="remove-from-collection"
                        title="برداشتن از مجموعه"
                        onClick={() => assign(activeCollection.id, p)}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </article>
                ))}
                {!visible.length &&
                  !(loadState === "loading" && tab === "explore") && (
                    <div className="empty-state">
                      <MapPin size={32} />
                      <h2>
                        {tab === "saved"
                          ? "یه جای خوب رو نگه دار"
                          : tab === "collections"
                            ? "اولین مکان رو به این مجموعه اضافه کن"
                            : "اینجا چیزی پیدا نشد"}
                      </h2>
                      <p>
                        {tab === "saved"
                          ? "روی نشان ذخیره کنار هر مکان بزن تا اینجا پیداش کنی."
                          : tab === "collections"
                            ? "از جزئیات هر مکان، «افزودن به مجموعه» رو انتخاب کن."
                            : "فیلترها رو کمتر کن، نقشه رو جابه‌جا کن یا مکان‌های تازه رو دریافت کن."}
                      </p>
                      <button
                        className="secondary"
                        onClick={() => {
                          setNavigation("explore");
                          setCategory("all");
                          setQuery("");
                          setPhotosOnly(false);
                          setRadius(cityRadius);
                          setOnlyBounds(false);
                        }}
                      >
                        کشف مکان‌ها
                        <ArrowUpLeft size={15} />
                      </button>
                    </div>
                  )}
                {visible.length > renderLimit && (
                  <button className="load-more secondary" onClick={() => setRenderLimit(n => n + 40)}>
                    نمایش مکان‌های بیشتر · {fa(visible.length - renderLimit)} مکان دیگر
                    <ChevronDown size={16} />
                  </button>
                )}
                {visible.length > 0 && visible.length <= renderLimit && (
                  <div className="list-end">
                    <span />
                    از همین‌جا یه گشت خوب شروع می‌شه
                    <span />
                  </div>
                )}
              </>
            )}
          </div>
          <footer className="sidebar-footer">
            <span
              className={"data-dot " + (loadState === "live" ? "fresh" : "")}
            />
            {loadState === "live"
              ? usingNeshan
                ? "اطلاعات دریافت‌شده از نشان"
                : "اطلاعات دریافت‌شده از نقشهٔ باز"
              : loadState === "error"
                ? "ارتباط با سرویس برقرار نشد"
                : "مکان‌های ثبت‌شده در نقشهٔ باز"}
            <button onClick={() => setModal("about")}>
              دربارهٔ داده‌ها
              <Info size={12} />
            </button>
          </footer>
        </aside>
        {selected && (
          <div className={"mobile-detail sheet-" + sheet}>
            <button
              className="sheet-handle"
              aria-label="تغییر اندازه جزئیات"
              onClick={() => {
                if (dragged.current) {
                  dragged.current = false;
                  return;
                }
                setSheet((s) => (s === "full" ? "mid" : "full"));
              }}
              onPointerDown={(e) => {
                dragged.current = false;
                sheetStart.current = e.clientY;
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerUp={(e) => {
                const delta = e.clientY - sheetStart.current;
                if (Math.abs(delta) > 25) {
                  dragged.current = true;
                  setSheet(delta < 0 ? "full" : "peek");
                }
              }}
            >
              <span />
            </button>
            {detail}
          </div>
        )}
      </main>
      <nav className="mobile-nav" aria-label="ناوبری موبایل">
        {navigation.map(({ id, mobile, Icon }) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setNavigation(id)}
          >
            <Icon size={21} strokeWidth={tab === id ? 2.2 : 1.7} />
            <span>{mobile}</span>
            {id === "saved" && library.saved.length > 0 && (
              <i>{fa(library.saved.length)}</i>
            )}
          </button>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
      {notice && (
        <div className="notice" role="status">
          <Info size={18} />
          <p>{notice}</p>
          <button
            className="icon-button"
            aria-label="بستن پیام"
            onClick={() => setNotice("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
      {modal === "city" && (
        <Modal title="کدوم شهر رو بگردیم؟" onClose={() => setModal(undefined)}>
          <p className="modal-description">
            یک شهر انتخاب کن یا اسم شهر خودت رو جست‌وجو کن.
          </p>
          <form
            className="search-field"
            onSubmit={(e) => {
              e.preventDefault();
              remoteCitySearch();
            }}
          >
            <Search size={19} />
            <input
              placeholder="نام شهر…"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              aria-label="نام شهر"
            />
            <button
              className="text-button"
              type="submit"
              disabled={searchingCity}
            >
              {searchingCity ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                "جست‌وجو"
              )}
            </button>
          </form>
          <div className="city-grid">
            {[
              ...cities.filter((c) =>
                normalize(c.name).includes(normalize(cityQuery)),
              ),
              ...remoteCities.filter(
                (c) =>
                  !cities.some((x) => normalize(x.name) === normalize(c.name)),
              ),
            ].map((c) => (
              <button
                key={c.id}
                className={city.id === c.id ? "active" : ""}
                onClick={() => {
                  setCity(c);
                  setTab("explore");
                  setModal(undefined);
                }}
              >
                <MapPin size={16} />
                {c.name}
                {city.id === c.id && <Check size={16} />}
              </button>
            ))}
          </div>
          <p className="hint">
            شهرهای بالا اطلاعات اولیه دارند. برای شهرهای دیگر، مکان‌ها از سرویس
            نقشه دریافت می‌شوند.
          </p>
        </Modal>
      )}
      {modal === "filters" && (
        <Modal title="گشتت رو شخصی کن" onClose={() => setModal(undefined)}>
          <label className="field-label">
            ترتیب نمایش
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="recommended">دیدنی‌های منتخب اول</option>
              <option value="distance">نزدیک‌ترها اول</option>
              <option value="name">بر اساس نام</option>
            </select>
          </label>
          <p className="hint">
            «منتخب» بر اساس فهرست دیدنی‌های شاخص و اطلاعات موجود است؛ امتیاز
            کاربران نیست.
          </p>
          <div className="field-label">
            <span>محدوده: {radius === 0 ? "همهٔ مکان‌های موجود؛ بدون محدودیت فاصله" : distanceText(radius)}</span>
            <label className="check-row">
              <input type="checkbox" checked={radius === 0} onChange={e => setRadius(e.target.checked ? 0 : 15000)} />
              همهٔ مکان‌های شهر و اطراف
            </label>
          </div>
          {radius !== 0 && <label className="field-label">
            شعاع نمایش: {distanceText(radius)}
            <input
              type="range"
              min="1000"
              max="60000"
              step="1000"
              value={radius}
              onChange={(e) => setRadius(+e.target.value)}
            />
          </label>}
          <p className="hint">
            فاصلهٔ مستقیم از{" "}
            {onlyBounds
              ? "مرکز نقشه"
              : distanceFromGPS
                ? "موقعیت تو"
                : "مرکز شهر"}{" "}
            محاسبه می‌شود.
          </p>
          <label className="check-row">
            <input type="checkbox" checked={onlyBounds} onChange={e => setOnlyBounds(e.target.checked)} />
            <MapIcon size={18} />
            فقط مکان‌های داخل نمای نقشه
          </label>
          <p className="hint">دریافت مکان‌های تازه تا شعاع ۱۵ کیلومتر از مرکز نقشه انجام می‌شود و مکان‌های قبلی را نگه می‌دارد.</p>
          <label className="check-row">
            <input
              type="checkbox"
              checked={photosOnly}
              onChange={(e) => setPhotosOnly(e.target.checked)}
            />
            <ImageIcon size={18} />
            فقط مکان‌های دارای عکس
          </label>
          <button className="primary wide" onClick={() => setModal(undefined)}>
            نمایش {fa(visible.length)} مکان
            <Check size={17} />
          </button>
          <button
            className="text-button wide"
            onClick={() => {
              setSort("recommended");
              setRadius(cityRadius);
              setPhotosOnly(false);
              setOnlyBounds(false);
            }}
          >
            بازنشانی فیلترها
          </button>
        </Modal>
      )}
      {modal === "addCollection" && (
        <Modal title="یه مجموعهٔ تازه بساز" onClose={() => setModal(undefined)}>
          <p className="modal-description">
            مثلاً «کافه‌های دنج» یا «یک روز در اصفهان».
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createCollection();
            }}
          >
            <label className="field-label">
              اسم مجموعه
              <input
                autoComplete="off"
                value={newCollection}
                onChange={(e) => setNewCollection(e.target.value)}
                maxLength={60}
                placeholder="برای گشت بعدی…"
              />
            </label>
            <button
              className="primary wide"
              disabled={!newCollection.trim()}
              type="submit"
            >
              <Plus size={17} />
              ساخت مجموعه
            </button>
          </form>
        </Modal>
      )}
      {modal === "assign" && selected && (
        <Modal title="افزودن به مجموعه" onClose={() => setModal(undefined)}>
          <p className="modal-description">{selected.name}</p>
          <div className="assign-list">
            {library.collections.map((c) => (
              <button
                key={c.id}
                className={c.ids.includes(selected.id) ? "active" : ""}
                onClick={() => assign(c.id, selected)}
              >
                <Layers size={18} />
                <span>
                  {c.name}
                  <small>{fa(c.ids.length)} مکان</small>
                </span>
                {c.ids.includes(selected.id) ? (
                  <CheckCircle2 size={21} />
                ) : (
                  <Plus size={19} />
                )}
              </button>
            ))}
          </div>
          <button
            className="secondary wide"
            onClick={() => setModal("addCollection")}
          >
            <Plus size={16} />
            ساخت مجموعهٔ جدید
          </button>
        </Modal>
      )}
      {modal === "about" && (
        <Modal title="دربارهٔ کجا بریم" onClose={() => setModal(undefined)}>
          <div className="about-intro">
            <span className="brand-symbol">
              <MapPin size={25} />
            </span>
            <p>
              برای وقت‌هایی که دلت می‌خواد بیرون بری،
              <br />
              <strong>ولی نمی‌دونی کجا.</strong>
            </p>
          </div>
          <div className="info-section">
            <h3>اطلاعات مکان‌ها</h3>
            <p>
              نقشه: OpenStreetMap و OSM France. {" "}
              {usingNeshan ? "جست‌وجوی تازه و مسیر: نشان. " : ""} مکان‌ها: دادهٔ
              باز OSM و دیدنی‌های منتخب ویکی‌پدیا. عکس‌ها از Wikimedia و منابع گردشگری با لینک
              منبع و اطلاعات حقوق تصویرند. عکس یا امتیاز گوگل‌مپ در این نسخه استفاده
              نشده.
            </p>
            <p>
              تهران از استخراج منطقه‌ای داده‌های OSM دریافت شده و محدودیت تعداد برای نمایش مکان‌های موجود ندارد؛
              پوشش منبع کامل نیست و ساعات کاری ممکن است تغییر کرده باشد.
              «جست‌وجو در این محدوده» اطلاعات تازه را از Overpass می‌گیرد.{" "}
              {dataDate &&
                `تاریخ داده‌های فعلی: ${new Date(dataDate).toLocaleDateString("fa-IR")}.`}
            </p>
            <h3>موقعیت و حریم خصوصی</h3>
            <p>
              موقعیت فقط بعد از اجازهٔ تو و هنگام باز بودن صفحه خوانده می‌شود؛
              در پشتیبان ذخیره نمی‌شود. برای جست‌وجوی اطراف و مسیریابی، مختصات
              به سرویس مربوط ارسال می‌شود. ذخیره‌ها و یادداشت‌ها روی همین مرورگر
              می‌مانند؛ ورود و همگام‌سازی ابری نداریم.
            </p>
            {gpsActive && (
              <button className="secondary" onClick={stopGPS}>
                خاموش کردن موقعیت زنده
              </button>
            )}
            <h3>مسیریابی و پیشنهادها</h3>
            <p>
              مسیر پیاده و خودرو از OSRM دریافت می‌شود؛ زمان تخمینی و بدون
              ترافیک زنده است. پیشنهادها با توجه به منتخب‌بودن مکان، وجود
              اطلاعات و فاصله مرتب می‌شوند؛ رتبه‌بندی مردمی نیستند.
            </p>
            <h3>نسخهٔ گوشی</h3>
            <p>
              در Safari از Share ← Add to Home Screen و در Chrome از منوی نصب
              استفاده کن. ذخیره‌ها و پوستهٔ برنامه آفلاین‌اند؛ دریافت نقشه و
              مسیر جدید اینترنت می‌خواهد.
            </p>
          </div>
          <div className="backup-actions">
            <button className="secondary" onClick={downloadBackup}>
              <Download size={17} />
              خروجی پشتیبان
            </button>
            <button
              className="secondary"
              onClick={() => fileInput.current?.click()}
            >
              <Upload size={17} />
              بازیابی پشتیبان
            </button>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => importBackup(e.target.files?.[0])}
          />
          <a
            className="source-link"
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            © OpenStreetMap contributors · ODbL
          </a>
        </Modal>
      )}
      {shareFallback && (
        <Modal title="لینک این مکان" onClose={() => setShareFallback("")}>
          <input
            className="share-input"
            readOnly
            value={shareFallback}
            onFocus={(e) => e.target.select()}
            dir="ltr"
          />
          <p className="hint">لینک را انتخاب و کپی کن.</p>
        </Modal>
      )}
    </div>
  );
}
