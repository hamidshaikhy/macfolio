import { spawnSync } from 'node:child_process';
import { cp, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const sources = JSON.parse(await readFile(new URL('../integrations/sources.json', import.meta.url)));
const installOnly = process.argv.includes('--install');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
for (const app of sources) {
  const cwd = new URL(`../integrations/${app.id}/`, import.meta.url);
  if (installOnly) {
    const result = spawnSync(npm, ['ci', '--include=dev', '--no-audit', '--no-fund'], {cwd, stdio:'inherit', shell:process.platform === 'win32'});
    if (result.status !== 0) throw new Error(`${app.id}: dependency installation failed (${result.status})`);
    continue;
  }
  console.log(`\nBuilding ${app.id} (${app.commit.slice(0,7)})…`);
  const result = spawnSync(npm, ['run', 'build'], {cwd, stdio:'inherit', shell:process.platform === 'win32'});
  if (result.status !== 0) throw new Error(`${app.id}: build failed (${result.status}). Run npm run apps:install first.`);
  const out = new URL('dist/', cwd);
  const walk = async (dir, prefix='') => {
    const entries = await readdir(dir, {withFileTypes:true}); const files = [];
    for (const entry of entries) {
      const path = prefix+entry.name;
      if (entry.isDirectory()) files.push(...await walk(new URL(entry.name+'/',dir), path+'/'));
      else files.push(path);
    }
    return files;
  };
  const manifestPath = new URL('manifest.webmanifest',out);
  try {
    const manifest = JSON.parse(await readFile(manifestPath));
    manifest.id = manifest.start_url = manifest.scope = app.path;
    manifest.icons?.forEach(icon => { icon.src = icon.src.startsWith(app.path) ? icon.src : app.path+icon.src.replace(/^\//,''); });
    await writeFile(manifestPath, JSON.stringify(manifest,null,2)+'\n');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (app.id === 'todo') {
    const file = new URL('downloads/android.json',out);
    const release = JSON.parse(await readFile(file));
    release.parts = release.parts.map(path=>path.startsWith(app.path)?path:app.path+path.replace(/^\//,''));
    await writeFile(file,JSON.stringify(release)+'\n');
  }
  if (app.id !== 'barg') {
    // Only this child's small shell. APK, media and unrelated origins never enter this cache.
    const candidates = (await walk(out)).filter(f => f !== 'sw.js' && !f.startsWith('downloads/') && !(app.id === 'koja-berim' && f.startsWith('photos/')) && !/\.(mp3|mp4|apk|part|map)$/i.test(f));
    const files = [];
    const hash = createHash('sha256');
    for (const file of candidates) {
      const url = new URL(file,out);
      if ((await stat(url)).size > 2*1024*1024) continue;
      hash.update(await readFile(url)); files.push(app.path+file);
    }
    const namespace = `macfolio-${app.id}-shell-`;
    const cache = namespace+hash.digest('hex').slice(0,12);
    await writeFile(new URL('sw.js',out), `const PREFIX=${JSON.stringify(app.path)},NAMESPACE=${JSON.stringify(namespace)},CACHE=${JSON.stringify(cache)},FILES=${JSON.stringify(files)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(NAMESPACE)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||!u.pathname.startsWith(PREFIX))return;
if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.open(CACHE).then(c=>c.match(PREFIX+'index.html'))));return;}
if(FILES.includes(u.pathname))e.respondWith(caches.open(CACHE).then(c=>c.match(u.pathname).then(hit=>hit||fetch(e.request))));});\n`);
  }
  await cp(out,new URL(`../dist/apps/${app.id}/`,import.meta.url),{recursive:true});
}
