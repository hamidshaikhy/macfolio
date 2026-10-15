import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
async function walk(dir) {
  let out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = dir + "/" + e.name;
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name !== "sw.js") out.push(p);
  }
  return out;
}
const files = await walk("dist"),
  hash = createHash("sha256");
for (const f of files) hash.update(await readFile(f));
const name = "finance-shell-" + hash.digest("hex").slice(0, 12),
  urls = files.map((p) => "/" + p.slice(5));
urls.push("/");
await writeFile(
  "dist/sw.js",
  `const CACHE=${JSON.stringify(name)},FILES=${JSON.stringify(urls)};self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));});self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('finance-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('/index.html')));return;}e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));});`,
);
console.log("Offline shell:", files.length, "local files");
