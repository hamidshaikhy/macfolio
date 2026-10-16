// Optional same-origin Neshan gateway. Server API keys never enter browser bundles.
// Works as a Vercel function, or via the development middleware in vite.config.ts.
const allowedLayers = new Set([
  "cafe",
  "historical",
  "interests",
  "park",
  "garden",
  "metro_entrance",
]);
const cache = new Map(),
  budgets = new Map();
const point = (s) => {
  const a = String(s || "")
    .split(",")
    .map(Number);
  if (
    a.length !== 2 ||
    a.some((x) => !Number.isFinite(x)) ||
    a[0] < 24 ||
    a[0] > 40 ||
    a[1] < 44 ||
    a[1] > 64
  )
    throw Error("مختصات باید داخل ایران باشد.");
  return a.join(",");
};
export function neshanRequest(params) {
  const action = params.get("action");
  let path, query;
  if (action === "nearby") {
    const layer = params.get("layer");
    if (!allowedLayers.has(layer)) throw Error("دسته مجاز نیست.");
    const radius = Number(params.get("radius"));
    if (!Number.isInteger(radius) || radius < 500 || radius > 15000)
      throw Error("شعاع معتبر نیست.");
    path = "/v1/nearby";
    query = {
      location: point(params.get("origin")),
      layer,
      searchRadius: String(radius),
    };
  } else if (action === "route") {
    const mode = params.get("mode");
    if (!["walk", "car"].includes(mode)) throw Error("نوع مسیر معتبر نیست.");
    path = mode === "walk" ? "/v1/direction" : "/v4/direction/no-traffic";
    query = {
      origin: point(params.get("origin")),
      destination: point(params.get("destination")),
      type: mode === "walk" ? "pedestrian" : "car",
      alternative: "false",
    };
  } else if (action === "details") {
    const hash = params.get("hash");
    if (!hash || !/^[A-Za-z0-9_-]{5,300}$/.test(hash)) throw Error("شناسه مکان معتبر نیست.");
    path = "/v1/point";
    query = { hash };
  } else if (action === "search") {
    const term = params.get("term")?.trim();
    if (!term || term.length > 120) throw Error("عبارت جست‌وجو معتبر نیست.");
    const [latitude, longitude] = point(params.get("origin"))
      .split(",")
      .map(Number);
    path = "/v3/search";
    query = { q: JSON.stringify({ term, center: { latitude, longitude } }) };
  } else throw Error("درخواست پشتیبانی نمی‌شود.");
  return "https://api.neshan.org" + path + "?" + new URLSearchParams(query);
}
export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }
  if (!process.env.NESHAN_API_KEY) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: "NESHAN_API_KEY is not configured" }));
    return;
  }
  // Browser requests must be same-origin; this is not authentication. Configure a
  // provider quota and gateway protection at the hosting edge for public traffic.
  const fetchSite = req.headers["sec-fetch-site"];
  if (fetchSite === "cross-site") {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: "Cross-site request rejected" }));
    return;
  }
  let upstream;
  try {
    upstream = neshanRequest(new URL(req.url, "http://localhost").searchParams);
  } catch (e) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: e.message }));
    return;
  }
  const ip = String(
    req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "local",
  ).split(",")[0];
  const now = Date.now(),
    budget = budgets.get(ip);
  if (budget && now - budget.start < 60000 && budget.count >= 24) {
    res.statusCode = 429;
    res.end(JSON.stringify({ error: "Rate limit reached" }));
    return;
  }
  budgets.set(
    ip,
    budget && now - budget.start < 60000
      ? { ...budget, count: budget.count + 1 }
      : { start: now, count: 1 },
  );
  if (budgets.size > 2000)
    for (const [k, v] of budgets) {
      if (now - v.start > 60000) budgets.delete(k);
    }
  // Never cache route requests (origins may contain a user's precise location).
  const isRoute = upstream.includes("/direction");
  const cached = !isRoute && cache.get(upstream);
  if (cached && now - cached.time < 120000) {
    res.end(cached.text);
    return;
  }
  try {
    const r = await fetch(upstream, {
      headers: { "Api-Key": process.env.NESHAN_API_KEY },
      signal: AbortSignal.timeout(12000),
      redirect: "error",
    });
    const text = await r.text();
    if (!r.ok) {
      res.statusCode = r.status === 429 || r.status === 482 ? 429 : 502;
      res.end(
        JSON.stringify({
          error: "Neshan service unavailable",
          upstreamStatus: r.status,
        }),
      );
      return;
    }
    const d = JSON.parse(text);
    if (!isRoute) {
      cache.set(upstream, { time: now, text: JSON.stringify(d) });
      if (cache.size > 100) cache.delete(cache.keys().next().value);
    }
    res.end(JSON.stringify(d));
  } catch {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: "Neshan connection failed" }));
  }
}
