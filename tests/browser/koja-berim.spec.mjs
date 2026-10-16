import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
  await page.route('**/_vercel/insights/**',r=>r.fulfill({status:204}));
});

test('city places persist across window restore and standalone; location stays opt-in',async({page,context})=>{
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({latitude:35.6892,longitude:51.389});
  await context.addInitScript(()=>{
    window.__geoRequests=0;
    const original=navigator.geolocation.watchPosition.bind(navigator.geolocation);
    navigator.geolocation.watchPosition=(...args)=>{window.__geoRequests++;return original(...args);};
  });
  await page.goto('/?view=desktop');
  await expect(page.locator('iframe')).toHaveCount(0);
  const dock=page.getByRole('navigation',{name:'Dock',exact:true});
  await dock.getByRole('button',{name:'Koja Berim',exact:true}).click();
  const wrapper=page.locator('.embedded-app[data-app-id="koja-berim"]');
  await expect(wrapper).toHaveAttribute('data-status','ready');
  const frame=page.frameLocator('iframe[title="Koja Berim application"]');
  const child=await (await page.locator('iframe[title="Koja Berim application"]').elementHandle()).contentFrame();
  await expect(frame.locator('.leaflet-container')).toBeVisible();
  await expect(frame.locator('.card-save').first()).toBeEnabled();
  expect(await child.evaluate(()=>window.__geoRequests)).toBe(0);
  expect(await child.evaluate(()=>navigator.serviceWorker.getRegistrations().then(r=>r.length))).toBe(0);
  const save=frame.locator('.card-save').first();
  const savedName=(await save.getAttribute('aria-label')).replace(/^ذخیره /,'');
  await save.click();await expect(save).toHaveAttribute('aria-label',`برداشتن ${savedName} از ذخیره‌ها`);
  await frame.getByRole('textbox',{name:'جست‌وجوی مکان'}).fill('آرگو');
  const win=page.getByRole('dialog',{name:'Koja Berim',exact:true});
  await win.getByRole('button',{name:'Minimize Koja Berim'}).click();
  await expect.poll(()=>child.evaluate(()=>document.documentElement.dataset.macfolioHidden)).toBe('true');
  await dock.getByRole('button',{name:'Koja Berim',exact:true}).click();
  await expect(frame.getByRole('textbox',{name:'جست‌وجوی مکان'})).toHaveValue('آرگو');
  await frame.getByRole('textbox',{name:'جست‌وجوی مکان'}).clear();
  await frame.getByRole('button',{name:'فعال‌کردن موقعیت زنده من',exact:true}).click();
  await expect.poll(()=>child.evaluate(()=>window.__geoRequests)).toBe(1);
  const popupPromise=context.waitForEvent('page');
  await win.getByRole('link',{name:'OPEN FULL',exact:true}).click();
  const popup=await popupPromise;await popup.waitForLoadState();
  await popup.locator('.desktop-nav').getByRole('button',{name:/ذخیره‌شده‌ها/}).click();
  await expect(popup.getByRole('button',{name:`برداشتن ${savedName} از ذخیره‌ها`,exact:true})).toBeVisible();
  await popup.close();
  await win.getByRole('button',{name:'Close Koja Berim'}).click();
  await expect(page.locator('iframe')).toHaveCount(0);
});

test('city explorer fits phone, tablet and desktop inside the OS and standalone',async({page})=>{
  for(const width of [320,390,430,768,1024,1440]){
    await page.setViewportSize({width,height:width<768?844:960});
    await page.goto('/apps/koja-berim/');
    await expect(page.getByRole('textbox',{name:'جست‌وجوی مکان'})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.goto('/?view=desktop');
    const launcher=width<768?page.locator('.ios-home'):page.getByRole('navigation',{name:'Dock',exact:true});
    await launcher.getByRole('button',{name:'Koja Berim',exact:true}).click();
    await expect(page.locator('.embedded-app[data-app-id="koja-berim"]')).toHaveAttribute('data-status','ready');
    const child=await (await page.locator('iframe[title="Koja Berim application"]').elementHandle()).contentFrame();
    await expect(page.frameLocator('iframe[title="Koja Berim application"]').locator('.leaflet-container')).toBeVisible();
    expect(await child.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    if(width>=768){const box=await launcher.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width+1);}
    else {await page.getByRole('button',{name:'Back to home'}).click();await expect(page.locator('.ios-home')).toBeVisible();}
  }
});

test('city worker owns only its prefix and does not precache place photographs',async({page,context,browserName})=>{
  await page.goto('/apps/koja-berim/');
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>navigator.serviceWorker.getRegistration().then(r=>r?.active?.state))).toBe('activated');
  const info=await page.evaluate(async()=>{
    const r=await navigator.serviceWorker.getRegistration();
    const manifest=await fetch(document.querySelector('link[rel="manifest"]').href).then(r=>r.json());
    const keys=(await caches.keys()).filter(k=>k.startsWith('macfolio-koja-berim-shell-'));
    const files=(await Promise.all(keys.map(async k=>(await (await caches.open(k)).keys()).map(r=>new URL(r.url).pathname)))).flat();
    return {scope:new URL(r.scope).pathname,manifest,files};
  });
  expect(info.scope).toBe('/apps/koja-berim/');
  expect(info.manifest.start_url).toBe(info.scope);expect(info.manifest.scope).toBe(info.scope);
  expect(info.files.length).toBeGreaterThan(0);
  expect(info.files.every(f=>f.startsWith(info.scope)&&!f.includes('/photos/'))).toBe(true);
  if(browserName==='chromium'){
    await expect.poll(()=>page.evaluate(()=>navigator.serviceWorker.controller?.scriptURL)).toContain('/apps/koja-berim/sw.js');
    await context.setOffline(true);await page.reload();
    await expect(page.getByRole('textbox',{name:'جست‌وجوی مکان'})).toBeVisible();
    await context.setOffline(false);
  }
  await page.goto('/portfolio');expect(await page.evaluate(()=>navigator.serviceWorker.controller)).toBeNull();
});
