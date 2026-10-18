import {test,expect} from '@playwright/test';

test.use({isMobile:true,hasTouch:true});
async function visibleViewport(page,height=650){
  await page.addInitScript(({height})=>{
    if(window.top!==window)return;
    const viewport=Object.assign(new EventTarget(),{height,width:innerWidth,offsetTop:0,offsetLeft:0,scale:1});
    Object.defineProperty(window,'visualViewport',{configurable:true,value:viewport});
    window.__resizeVisibleViewport=(height,offsetTop=0,scale=1)=>{
      Object.assign(viewport,{height,offsetTop,scale,width:innerWidth});
      viewport.dispatchEvent(new Event('resize'));viewport.dispatchEvent(new Event('scroll'));
    };
  },{height});
}
async function resizeVisible(page,height,top=0){
  await page.evaluate(({height,top})=>window.__resizeVisibleViewport(height,top),{height,top});
  await expect.poll(async()=>Math.round((await page.locator('#root').boundingBox()).height)).toBe(height);
}
test.beforeEach(async({page})=>{
  await page.route('**/_vercel/insights/**',r=>r.fulfill({status:204}));
});

test('browser bars resize the phone home without a second simulated phone frame',async({page})=>{
  await page.setViewportSize({width:390,height:844});await visibleViewport(page);
  await page.goto('/?view=desktop');await expect(page.locator('.ios-home')).toBeVisible();
  for(const height of [650,744,844,568,450,650]){
    await resizeVisible(page,height);
    const root=await page.locator('#root').boundingBox(),dock=await page.locator('.ios-dock').boundingBox();
    expect(root.y).toBe(0);expect(dock.y+dock.height).toBeCloseTo(height-12,0);
    await expect(page.locator('.dynamic-island, .home-indicator')).toHaveCount(0);
    if(height>=568){
      const search=await page.locator('.ios-search').boundingBox();
      expect(dock.y-search.y-search.height).toBeGreaterThanOrEqual(0);
      expect(dock.y-search.y-search.height).toBeLessThanOrEqual(20);
    }
    await page.locator('.ios-home-scroll').evaluate(el=>el.scrollTop=el.scrollHeight);
    expect(await page.locator('.ios-dock').boundingBox()).toEqual(dock);
    await expect(page.locator('.ios-dock button')).toHaveCount(4);
  }
});

test('safe areas and keyboard resize keep native and embedded app controls visible',async({page})=>{
  await page.setViewportSize({width:390,height:844});await visibleViewport(page);
  await page.goto('/?view=desktop');await expect(page.locator('.ios-home')).toBeVisible();
  await page.locator('#root').evaluate(el=>{
    el.style.setProperty('--mobile-safe-top','47px');el.style.setProperty('--mobile-safe-bottom','34px');
    el.style.setProperty('--mobile-safe-left','7px');el.style.setProperty('--mobile-safe-right','7px');
  });
  const dock=await page.locator('.ios-dock').boundingBox();
  expect(dock.y+dock.height).toBeCloseTo(650-34,0);
  const status=await page.locator('.ios-status').boundingBox();expect(status.y).toBe(47);expect(status.height).toBe(44);
  await page.locator('.ios-home-scroll').getByRole('button',{name:'To Do List',exact:true}).click();
  await expect(page.locator('.embedded-app[data-app-id="todo"]')).toHaveAttribute('data-status','ready');
  const input=page.frameLocator('iframe[title="To Do List application"]').getByRole('textbox',{name:'نام کار جدید'});
  await input.fill('Keep this draft');
  for(const [height,top]of [[350,90],[620,0],[744,0]]){
    await resizeVisible(page,height,top);
    const root=await page.locator('#root').boundingBox();expect(root.y).toBe(top);
    const header=await page.locator('.ios-app-header').boundingBox();
    const iframe=await page.locator('iframe[title="To Do List application"]').boundingBox();
    expect(iframe.y).toBeCloseTo(header.y+header.height,0);
    expect(header.y).toBe(top+47);
    expect(iframe.y+iframe.height).toBeCloseTo(top+height-34,0);
    await expect(page.locator('.ios-status')).toBeHidden();
    expect(iframe.x).toBe(7);expect(iframe.x+iframe.width).toBe(383);
    await expect(input).toHaveValue('Keep this draft');
  }
  await page.getByRole('button',{name:'Back to home',exact:true}).click();
  await page.getByRole('button',{name:'Open Control Center',exact:true}).click();
  await resizeVisible(page,400);
  const panel=await page.locator('.ios-control').boundingBox();expect(panel.y+panel.height).toBeLessThanOrEqual(366);
  await page.getByRole('button',{name:'Done',exact:true}).click();
  await page.getByRole('button',{name:'Search',exact:true}).click();await resizeVisible(page,350,90);
  await page.getByRole('textbox',{name:'Search apps'}).fill('a');
  const search=await page.locator('.spotlight').boundingBox();expect(search.y+search.height).toBeLessThanOrEqual(406);
  await page.locator('.spotlight-results button').last().scrollIntoViewIfNeeded();
  expect((await page.locator('.spotlight-results button').last().boundingBox()).y+1).toBeLessThan(search.y+search.height);
});

test('phone rotations respect side insets and standalone portfolio fills the same visible height',async({page})=>{
  for(const [width,height]of [[320,568],[375,667],[430,932],[844,390]]){
    await page.setViewportSize({width,height});await page.goto('/?view=desktop');
    await expect(page.locator('.ios-home')).toBeVisible();
    const root=await page.locator('#root').boundingBox();expect(root.height).toBe(height);
    await page.locator('#root').evaluate(el=>{
      el.style.setProperty('--mobile-safe-left','24px');el.style.setProperty('--mobile-safe-right','24px');
    });
    if(width===320){
      await page.locator('#root').evaluate(el=>{el.style.setProperty('--mobile-safe-top','20px');el.style.setProperty('--mobile-safe-bottom','34px');});
      const content=await page.locator('.ios-home-scroll').boundingBox();
      const search=await page.locator('.ios-search').boundingBox();
      expect(search.y+search.height).toBeLessThanOrEqual(content.y+content.height+1);
    }
    const dock=await page.locator('.ios-dock').boundingBox();
    expect(dock.x).toBeGreaterThanOrEqual(24);expect(dock.x+dock.width).toBeLessThanOrEqual(width-24);
    expect(dock.y+dock.height).toBeLessThanOrEqual(height-12);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
  }
  await page.setViewportSize({width:390,height:844});await visibleViewport(page,650);
  await page.goto('/portfolio');await expect(page.locator('.pf-experience[data-measured="true"]')).toBeVisible();
  await resizeVisible(page,720);
  expect((await page.locator('.pf-experience').boundingBox()).height).toBe(720);
});

test('iPhone home-screen launch keeps the full layout height when visualViewport excludes safe areas',async({page})=>{
  // iPhone 11 Pro CSS dimensions; iOS reports standalone through navigator.
  await page.setViewportSize({width:375,height:812});
  await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{configurable:true,value:true}));
  await visibleViewport(page,734);
  await page.goto('/?view=desktop');await expect(page.locator('.ios-home')).toBeVisible();
  await expect(page.locator('#root')).toHaveAttribute('data-mobile-display','standalone');
  await page.locator('#root').evaluate(el=>{
    el.style.setProperty('--mobile-safe-top','44px');el.style.setProperty('--mobile-safe-bottom','34px');
  });
  await page.evaluate(()=>window.__resizeVisibleViewport(734,44));
  await expect.poll(async()=>await page.locator('#root').boundingBox()).toMatchObject({x:0,y:0,width:375,height:812});
  const dock=await page.locator('.ios-dock').boundingBox();expect(dock.y+dock.height).toBeCloseTo(812-34,0);
  await expect(page.locator('.dynamic-island, .home-indicator')).toHaveCount(0);
  await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveCount(0);
  await page.getByRole('button',{name:'Search',exact:true}).click();
  const input=page.getByRole('textbox',{name:'Search apps'});await input.fill('Contacts');
  await resizeVisible(page,350,90);await expect(input).toHaveValue('Contacts');
  await input.blur();await page.evaluate(()=>window.__resizeVisibleViewport(734));
  await expect.poll(async()=>Math.round((await page.locator('#root').boundingBox()).height)).toBe(812);
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'About Hamid',exact:true}).click();
  await expect.poll(async()=>Math.round((await page.locator('.ios-app-header').boundingBox()).y)).toBe(44);
  const content=await page.locator('.ios-app-content').boundingBox();expect(content.y+content.height).toBeCloseTo(812-34,0);
  await page.getByRole('button',{name:'Open Control Center',exact:true}).click();await expect(page.getByRole('dialog',{name:'Control Center',exact:true})).toBeVisible();
});

test('desktop layout ignores the phone viewport override and user zoom does not reflow the page',async({page})=>{
  await page.setViewportSize({width:1440,height:900});await visibleViewport(page,500);
  await page.goto('/?view=desktop');await expect(page.locator('.desktop-surface')).toBeVisible();
  const desktop=await page.locator('.os-root').boundingBox();expect(desktop.width).toBe(1440);expect(desktop.height).toBe(900);
  expect(await page.locator('#root').evaluate(el=>el.style.getPropertyValue('--mobile-viewport-height'))).toBe('');
  await page.setViewportSize({width:390,height:844});await expect(page.locator('.ios-home')).toBeVisible();
  await resizeVisible(page,650);
  await page.evaluate(()=>window.__resizeVisibleViewport(325,0,2));
  await page.waitForTimeout(100);
  expect((await page.locator('#root').boundingBox()).height).toBe(650);
});

test('home-screen launch declares app display mode without installing a root service worker',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/?view=desktop');
  await expect(page.locator('.ios-home')).toBeVisible();
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content','yes');
  const data=await page.evaluate(async()=>{
    const url=document.querySelector('link[rel="manifest"]').href;
    return {url,manifest:await fetch(url).then(r=>r.json()),workers:(await navigator.serviceWorker.getRegistrations()).length};
  });
  expect(data.manifest.display).toBe('standalone');expect(data.workers).toBe(0);
  expect(new URL(data.manifest.start_url,data.url).pathname).toBe('/');
  for(const icon of data.manifest.icons){
    const response=await page.request.get(new URL(icon.src,data.url).href);
    expect(response.ok()).toBe(true);expect(response.headers()['content-type']).toContain('image/png');
    expect((await response.body()).subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
  }
});
