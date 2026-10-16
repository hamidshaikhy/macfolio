import { test, expect } from '@playwright/test';
const appNames = {barg:'Barg',hamnava:'Hamnava','personal-finance':'Personal Finance',todo:'To Do List','koja-berim':'Koja Berim'};
test.beforeEach(async({page})=>{
  await page.route('**/_vercel/insights/**',route=>route.fulfill({status:204}));
});
async function open(page,id) {
  await page.getByRole('navigation',{name:'Dock',exact:true}).getByRole('button',{name:appNames[id],exact:true}).click();
  await expect(page.locator(`.embedded-app[data-app-id="${id}"]`)).toHaveAttribute('data-status','ready');
  return page.frameLocator(`iframe[title="${appNames[id]} application"]`);
}
test('cold root and portfolio load no child runtime; only clicked apps load and remain mounted',async({page})=>{
  const requests=[];page.on('request',r=>requests.push(r.url()));
  await page.goto('/');await expect(page.locator('.about-portfolio .pf-hero h1')).toBeVisible();
  expect(requests.filter(url=>new URL(url).pathname.startsWith('/apps/'))).toEqual([]);
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.goto('/portfolio');await expect(page.locator('.pf-hero')).toBeVisible();await expect(page.locator('iframe')).toHaveCount(0);
  expect(requests.filter(url=>new URL(url).pathname.startsWith('/apps/'))).toEqual([]);
  await page.goto('/?view=desktop');requests.length=0;
  const todo=await open(page,'todo');await expect(todo.getByRole('textbox',{name:'نام کار جدید'})).toBeVisible();
  expect(requests.some(url=>/\/apps\/(barg|hamnava|personal-finance)\//.test(url))).toBe(false);
  const iframe=page.locator('iframe[title="To Do List application"]');const src=await iframe.getAttribute('src');
  await todo.getByRole('textbox',{name:'نام کار جدید'}).fill('unsaved draft');
  const marker=await (await iframe.elementHandle()).contentFrame();await marker.evaluate(()=>window.__instanceCheck=crypto.randomUUID());
  const token=await marker.evaluate(()=>window.__instanceCheck);
  await open(page,'personal-finance');
  // The windows overlap. Dispatch inside the child document to exercise its focus bridge.
  await marker.evaluate(()=>document.querySelector('input').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})));
  await expect(page.getByRole('dialog',{name:'To Do List',exact:true})).toHaveClass(/active/);
  const win=page.getByRole('dialog',{name:'To Do List',exact:true});
  const title=await win.locator('.window-titlebar').boundingBox();
  await page.mouse.move(title.x+title.width/2,title.y+20);await page.mouse.down();await page.mouse.move(title.x+title.width/2+20,title.y+45);await page.mouse.up();
  const handle=await win.getByRole('separator',{name:'Resize window'}).boundingBox();
  await page.mouse.move(handle.x+3,handle.y+3);await page.mouse.down();await page.mouse.move(handle.x-40,handle.y-30);await page.mouse.up();
  await win.getByRole('button',{name:'Minimize To Do List'}).click();await expect(win).toBeHidden();
  await expect.poll(()=>marker.evaluate(()=>document.documentElement.dataset.macfolioHidden)).toBe('true');
  await open(page,'todo');await expect(todo.getByRole('textbox',{name:'نام کار جدید'})).toHaveValue('unsaved draft');
  expect(await marker.evaluate(()=>window.__instanceCheck)).toBe(token);expect(await iframe.getAttribute('src')).toBe(src);
  expect(requests.filter(url=>/\/apps\/todo\/\?embed=/.test(url))).toHaveLength(1);
  expect(await page.evaluate(()=>navigator.serviceWorker.getRegistrations().then(rows=>rows.length))).toBe(0);
  await win.getByRole('button',{name:'Close To Do List'}).click();await expect(iframe).toHaveCount(0);
  await page.getByRole('dialog',{name:'Personal Finance',exact:true}).getByRole('button',{name:'Close Personal Finance'}).click();
  await expect(page.locator('iframe')).toHaveCount(0);
});
for (const [id,name] of Object.entries(appNames)) test(`${name} opens independently with prefix assets, full link and refresh`,async({page,context})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?view=desktop');await open(page,id);
  const link=page.getByRole('dialog',{name,exact:true}).getByRole('link',{name:'OPEN FULL',exact:true});
  await expect(link).toHaveAttribute('href',`/apps/${id}/`);await expect(link).toHaveAttribute('rel','noopener noreferrer');
  const popupPromise=context.waitForEvent('page');await link.click();const popup=await popupPromise;
  await popup.waitForLoadState();await expect(popup.locator('#root')).not.toBeEmpty();
  await expect(popup.locator('.os-root')).toHaveCount(0);
  const paths=await popup.evaluate(()=>performance.getEntriesByType('resource').map(r=>new URL(r.name).pathname));
  expect(paths.filter(p=>/\.(js|css|woff2?)$/.test(p)).every(p=>p.startsWith(`/apps/${id}/`))).toBe(true);
  await popup.reload();await expect(popup.locator('#root')).not.toBeEmpty();
  await popup.goto(`/apps/${id}`);await expect(popup.locator('#root')).not.toBeEmpty();
  await popup.close();expect(errors).toEqual([]);
});
test('Barg builder deep link survives refresh, edits, and keeps parent LTR',async({page})=>{
  await page.goto('/apps/barg/builder');await expect(page.getByRole('button',{name:/خروجی/}).first()).toBeVisible();
  await page.reload();await expect(page.getByRole('button',{name:/خروجی/}).first()).toBeVisible();
  await expect(page.locator('.os-root')).toHaveCount(0);
  await page.goto('/?view=desktop');await open(page,'barg');
  expect(await page.evaluate(()=>document.documentElement.dir)).not.toBe('rtl');
});
test('PWA workers only own their prefix and cache; embedded use never registers a worker',async({page,browserName})=>{
  if(browserName==='webkit') test.info().annotations.push({type:'limitation',description:'Playwright WebKit offline navigation returns an internal engine error; cache/scope/controller checks still run. Offline reloads run in Chrome.'});
  for(const id of ['todo','hamnava','personal-finance']){
    await page.goto(`/apps/${id}/`);await expect(page.locator('#root')).not.toBeEmpty();
    await expect.poll(()=>page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return r?.active?.state;})).toBe('activated');
    const manifest=await page.evaluate(async()=>{const link=document.querySelector('link[rel="manifest"]');return fetch(link.href).then(r=>r.json());});
    expect(manifest.scope).toBe(`/apps/${id}/`);expect(manifest.id).toBe(`/apps/${id}/`);
  }
  const info=await page.evaluate(async()=>({scopes:(await navigator.serviceWorker.getRegistrations()).map(r=>new URL(r.scope).pathname),caches:await caches.keys(),files:await Promise.all((await caches.keys()).map(async key=>({key,urls:(await (await caches.open(key)).keys()).map(r=>new URL(r.url).pathname)})))}));
  expect(info.scopes.sort()).toEqual(['/apps/hamnava/','/apps/personal-finance/','/apps/todo/']);
  for(const row of info.files){const id=row.key.replace('macfolio-','').split('-shell-')[0];expect(row.urls.every(p=>p.startsWith(`/apps/${id}/`)&&!p.includes('/downloads/'))).toBe(true);}
  for(const id of browserName==='webkit'?[]:['todo','hamnava','personal-finance']){
    await page.goto(`/apps/${id}/`);
    await expect.poll(()=>page.evaluate(()=>navigator.serviceWorker.controller?.scriptURL)).toContain(`/apps/${id}/sw.js`);
    await page.context().setOffline(true);
    await page.reload();await expect(page.locator('#root')).not.toBeEmpty();
    await page.context().setOffline(false);
  }
  await page.goto('/portfolio');expect(await page.evaluate(()=>navigator.serviceWorker.controller?.scriptURL||null)).toBeNull();
  await page.goto('/');expect(await page.evaluate(()=>navigator.serviceWorker.controller?.scriptURL||null)).toBeNull();
});
for(const width of [320,375,390,430,768,1024,1440]) test(`apps fit ${width}px standalone and embedded`,async({page})=>{
  await page.setViewportSize({width,height:width<=430?844:900});
  for(const [id,name]of Object.entries(appNames)){
    await page.goto(`/apps/${id}/`);await expect(page.locator('#root')).not.toBeEmpty();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${id} standalone overflow`).toBe(true);
  }
  await page.goto('/?view=desktop');
  if(width<768){await expect(page.locator('.ios-home')).toBeVisible();await expect(page.locator('.ios-dock button')).toHaveCount(4);
    for(const [id,name]of Object.entries(appNames)){
      await page.locator('.ios-home').getByRole('button',{name,exact:true}).click();await expect(page.locator(`.embedded-app[data-app-id="${id}"]`)).toHaveAttribute('data-status','ready');
      const frame=page.frameLocator(`iframe[title="${name} application"]`);await expect(frame.locator('#root')).not.toBeEmpty();
      const iframe=await page.locator(`iframe[title="${name} application"]`).elementHandle();const doc=await iframe.contentFrame();expect(await doc.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${id} embedded overflow`).toBe(true);
      const full=page.locator('.ios-app-header').getByRole('link',{name:'OPEN FULL'});const box=await full.boundingBox();expect(box.x+box.width).toBeLessThanOrEqual(width);
      await page.getByRole('button',{name:'Back to home'}).click();
    }
    await expect(page.locator('iframe')).toHaveCount(Object.keys(appNames).length); // Home preserves the opened instances.
  }else{
    for(const id of Object.keys(appNames)){await open(page,id);const iframe=await page.locator(`iframe[title="${appNames[id]} application"]`).elementHandle();const doc=await iframe.contentFrame();expect(await doc.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${id} embedded overflow`).toBe(true);}
    const dock=await page.getByRole('navigation',{name:'Dock',exact:true}).boundingBox();expect(dock.x).toBeGreaterThanOrEqual(0);expect(dock.x+dock.width).toBeLessThanOrEqual(width);
  }
});
