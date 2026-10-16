import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const urlPath = relative("dist", p).replace(/\\/g, "/");
    if (statSync(p).isDirectory()) walk(p);
    else if (
      !p.endsWith("sw.js") &&
      !urlPath.startsWith("photos/") &&
      statSync(p).size < 2500000
    )
      files.push("./" + urlPath);
  }
}
walk("dist");
const hash = createHash("sha256");
files.forEach((f) => hash.update(readFileSync(join("dist", f))));
const version = hash.digest("hex").slice(0, 12);
writeFileSync(
  "dist/sw.js",
  `const PREFIX='koja-berim:'+new URL(self.registration.scope).pathname+':';const CACHE=PREFIX+'${version}';const FILES=${JSON.stringify(files)};self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));});self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});self.addEventListener('fetch',e=>{const u=new URL(e.request.url),scope=new URL(self.registration.scope);if(e.request.method!=='GET'||u.origin!==scope.origin||!u.pathname.startsWith(scope.pathname)||u.pathname.includes('/api/'))return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match(new URL('index.html',scope).href)));return;}e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(async r=>{if(r.ok){const c=await caches.open(CACHE);await c.put(e.request,r.clone());const keys=await c.keys();if(keys.length>220)await c.delete(keys.find(k=>!FILES.some(f=>new URL(f,scope).href===k.url))||keys[0]);}return r;})));});`,
);
console.log("Offline shell generated:", files.length, "files");
