import {test,expect} from '@playwright/test';

test.use({isMobile:true,hasTouch:true});
test.beforeEach(async({page})=>{
  await page.route('**/_vercel/insights/**',route=>route.fulfill({status:204}));
  await page.clock.setFixedTime(new Date('2026-09-30T20:29:00Z'));
});

async function widgets(page){
  return page.locator('.ios-widgets').evaluate(element=>{
    const rect=element=>{const r=element.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
    const cards=[...element.querySelectorAll(':scope > button')].map(card=>({
      bounds:rect(card),
      padding:parseFloat(getComputedStyle(card).paddingBottom),
      fields:[...card.querySelectorAll('img,strong,span,small')].map(field=>({
        text:field.textContent.trim()||field.alt,bounds:rect(field),font:parseFloat(getComputedStyle(field).fontSize),
      })),
    }));
    return {cards,signature:{heights:cards.map(c=>c.bounds.height),fonts:cards.map(c=>c.fields.map(f=>f.font)),photo:rect(element.querySelector('img')).width}};
  });
}
function readable(snapshot){
  expect(snapshot.cards[0].bounds.height).toBeCloseTo(snapshot.cards[1].bounds.height,0);
  expect(snapshot.signature.photo).toBeGreaterThanOrEqual(40);
  expect(snapshot.cards[0].fields[1].font).toBeGreaterThanOrEqual(12);
  expect(snapshot.cards[0].fields[2].font).toBeGreaterThanOrEqual(10);
  expect(snapshot.cards[1].fields[2].font).toBeGreaterThanOrEqual(11);
  for(const card of snapshot.cards){
    for(const field of card.fields){
      expect(field.bounds.left,field.text).toBeGreaterThanOrEqual(card.bounds.left);
      expect(field.bounds.right,field.text).toBeLessThanOrEqual(card.bounds.right);
      expect(field.bounds.top,field.text).toBeGreaterThanOrEqual(card.bounds.top);
      expect(field.bounds.bottom,field.text).toBeLessThanOrEqual(card.bounds.bottom-card.padding+1);
    }
    for(let i=1;i<card.fields.length;i++)expect(card.fields[i].bounds.top,card.fields[i].text).toBeGreaterThanOrEqual(card.fields[i-1].bounds.bottom);
  }
}

for(const [width,browserHeight,appHeight] of [[320,568,568],[375,614,812],[390,650,844],[430,740,932]]){
  test(`profile and date stay readable and the same size in Safari and Home Screen at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:browserHeight});await page.goto('/?view=desktop');
    await expect(page.locator('.ios-home')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
    const browser=await widgets(page);readable(browser);
    await page.evaluate(()=>Object.defineProperty(navigator,'standalone',{configurable:true,value:true}));
    for(const height of width===375?[734,appHeight]:[appHeight]){
      await page.locator('#root').evaluate(el=>{el.style.removeProperty('--mobile-safe-top');el.style.removeProperty('--mobile-safe-bottom');});
      await page.setViewportSize({width,height});await page.evaluate(()=>dispatchEvent(new Event('resize')));
      await expect(page.locator('#root')).toHaveAttribute('data-mobile-display','standalone');
      const app=await widgets(page);readable(app);expect(app.signature).toEqual(browser.signature);
      await page.locator('#root').evaluate(el=>{el.style.setProperty('--mobile-safe-top','44px');el.style.setProperty('--mobile-safe-bottom','34px');});
      const inset=await widgets(page);readable(inset);expect(inset.signature).toEqual(browser.signature);
    }
    const scroll=await page.locator('.ios-home-scroll').boundingBox(),dock=await page.locator('.ios-dock').boundingBox();
    expect(scroll.y+scroll.height).toBeLessThanOrEqual(dock.y);
    if(width>=375){
      const search=await page.locator('.ios-search').boundingBox();expect(search.y+search.height).toBeLessThanOrEqual(dock.y);
    }
  });
}

test('narrow mobile app headers keep Back, title and full-page actions separate',async({page})=>{
  await page.setViewportSize({width:320,height:568});await page.goto('/?view=desktop');
  for(const name of ['About Hamid','Personal Finance','Koja Berim','To Do List','Barg','Hamnava','Calendar','Settings']){
    await page.locator('.ios-home').getByRole('button',{name,exact:true}).click();
    const header=page.locator('.ios-app-header');await expect(header).toBeVisible();
    await expect.poll(async()=>Math.round((await header.boundingBox()).y)).toBe(0);
    const back=await header.getByRole('button',{name:'Back to home',exact:true}).boundingBox();
    const title=await header.locator(':scope > strong').boundingBox();
    const actions=await header.locator('.ios-app-actions').boundingBox();
    expect(back.x+back.width,name).toBeLessThanOrEqual(title.x+1);
    expect(title.x+title.width,name).toBeLessThanOrEqual(actions.x+1);
    expect(actions.x+actions.width,name).toBeLessThanOrEqual(320);
    const titleFits=await header.locator(':scope > strong').evaluate(el=>el.scrollWidth<=el.clientWidth+1);
    expect(titleFits,name).toBe(true);
    await header.getByRole('button',{name:'Back to home',exact:true}).click();
  }
});
