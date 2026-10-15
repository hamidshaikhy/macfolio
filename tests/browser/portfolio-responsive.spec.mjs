import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const sizes=[[320,568],[375,667],[390,844],[430,932],[600,960],[768,1024],[820,1180],[1024,1366],[1024,768],[844,390],[1366,768],[1440,1000]];
const titles=['Flow Studio','Barg','Tanpoosh','Dika Asia','Financial Panel','To Do List','Hamnava','Personal Finance','Macfolio'];
const journeyTitles=['App Developer','Front-End Developer','B.Sc. in Computer Engineering','Building Personal Products'];
async function scene(page,id,fraction=0){
 await page.locator('.pf-scroll').evaluate((el,{id,fraction})=>{const section=el.querySelector(`#${id}`),start=section.offsetTop-96;el.scrollTop=start+(section.offsetHeight-el.clientHeight+96)*fraction;},{id,fraction});
}
for(const [width,height] of sizes)test.describe(`${width} × ${height}`,()=>{
 test.use({viewport:{width,height},hasTouch:width<=1100});
 test('menu, alternating arrivals, all scroll projects and journey nodes, and footer fit',async({page},info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/portfolio');await expect(page.locator('.pf-scenes')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  const compact=width<=1100||height<640;
  if(compact){
   await expect(page.getByRole('button',{name:'Open navigation',exact:true})).toBeVisible();
   await expect(page.locator('.pf-nav > nav')).toBeHidden();
   await page.getByRole('button',{name:'Open navigation',exact:true}).click();
   await expect(page.locator('.pf-nav > nav')).toBeVisible();await expect(page.locator('.pf-scroll')).toHaveAttribute('inert');
   await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Open navigation',exact:true})).toBeFocused();
   if(width<=600)await expect(page.locator('.pf-connect-label')).toBeHidden();
   await page.getByRole('button',{name:'Open navigation',exact:true}).click();
   await page.locator('.pf-nav > nav').getByRole('link',{name:'Profile',exact:true}).click();
   await expect(page.locator('.pf-nav > nav')).toBeHidden();await expect(page.locator('.pf-scroll')).not.toHaveAttribute('inert');
   const directions=await page.locator('.pf-stat-card').evaluateAll(cards=>cards.map(card=>getComputedStyle(card).getPropertyValue('--from-side').trim()));
   expect(directions).toEqual(['1','-1','1','-1']);
   for(let i=0;i<4;i++){
    const card=page.locator('.pf-stat-card').nth(i);
    await card.evaluate(el=>{const port=el.closest('.pf-scroll');port.scrollTop+=el.getBoundingClientRect().top-port.getBoundingClientRect().top-port.clientHeight*.5;});
    await expect.poll(()=>card.evaluate(el=>Number(el.style.getPropertyValue('--card-reveal')))).toBeGreaterThan(.95);
    expect(await card.evaluate(el=>el.getBoundingClientRect().width)).toBeLessThan(width);
   }
  }else{
   await expect(page.getByRole('button',{name:'Open navigation',exact:true})).toBeHidden();
   const connect=page.locator('.pf-nav-actions a').first(),macfolio=page.locator('.pf-nav-actions .pf-macfolio-link');
   expect((await connect.boundingBox()).x).toBeLessThan((await macfolio.boundingBox()).x);
   await connect.click();await expect(page.locator('.pf-experience')).toHaveAttribute('data-scene','contact');
  }
  for(let i=0;i<titles.length;i++){
   await scene(page,'work',(i+.25)/titles.length);await expect(page.locator('.pf-project-copy h3')).toHaveText(titles[i]);
   await page.waitForTimeout(100);
  }
  const work=await page.locator('.pf-project-scene').boundingBox();expect(work.x).toBeGreaterThanOrEqual(0);expect(work.x+work.width).toBeLessThanOrEqual(width+1);
  await page.getByRole('button',{name:'Read case study',exact:true}).click();await expect(page.locator('.pf-case h2')).toContainText('Macfolio');
  await expect(page.getByRole('button',{name:'Close case study',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.locator('.pf-case')).toHaveCount(0);
  for(const [index,title] of journeyTitles.entries()){
   await scene(page,'journey',(index+.25)/journeyTitles.length);await expect(page.locator('.pf-journey-card.is-active h3')).toHaveText(title);
   await expect(page.locator('.pf-journey-card:not(.is-active)')).toHaveCount(journeyTitles.length-1);
   expect(await page.locator('.pf-journey-card:not(.is-active)').evaluateAll(cards=>cards.every(card=>card.inert))).toBe(true);
   await expect(page.locator('.pf-node-in')).toHaveText(`0${index+1}`);
   await expect(page.locator('.pf-node-in')).toHaveCSS('animation-name','pf-node-in');
   const entry=page.locator('.pf-journey-card.is-active');
   expect(await entry.evaluate(el=>el.scrollHeight<=el.clientHeight+2),`${title} overflows at ${width} × ${height}`).toBe(true);
  }
  const card=page.locator('.pf-journey-card.is-active');
  expect(await card.evaluate(el=>el.scrollHeight<=el.clientHeight+2)).toBe(true);
  await page.locator('.pf-scroll').evaluate(el=>el.scrollTop=el.querySelector('#contact').offsetTop);await expect(page.locator('.pf-experience')).toHaveAttribute('data-scene','contact');
  await expect(page.getByRole('link',{name:"Let's talk"})).toHaveCount(0);
  await expect(page.getByRole('link',{name:'Telegram',exact:true})).toHaveAttribute('href','https://t.me/hamid_2_sh');
  await expect(page.getByRole('link',{name:'WhatsApp',exact:true})).toHaveAttribute('href','https://wa.me/hamid_2_sh');
  const cta=page.locator('.pf-contact-action .pf-macfolio-link');await expect(cta).toHaveAttribute('target','_blank');
  const popupPromise=page.waitForEvent('popup');await cta.click();const popup=await popupPromise;await expect(popup).toHaveURL(/\?view=desktop$/);await expect(popup.locator('.os-root')).toBeVisible();await expect(popup.locator('.app-safari')).toHaveCount(0);await popup.close();
  if(compact){
   const layout=await page.evaluate(()=>Object.fromEntries(['pf-contact-marquee','pf-contact-pages','pf-contact-social','pf-contact h2','pf-contact-person','pf-contact-action'].map(name=>[name,document.querySelector('.'+name).getBoundingClientRect().top])));
   expect(layout['pf-contact-marquee']).toBeLessThan(layout['pf-contact-pages']);expect(layout['pf-contact-pages']).toBeLessThan(layout['pf-contact h2']);expect(layout['pf-contact-social']).toBeLessThan(layout['pf-contact h2']);expect(layout['pf-contact h2']).toBeLessThan(layout['pf-contact-person']);
  }
  expect(await page.locator('.pf-scroll').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);expect(errors).toEqual([]);
  await fs.mkdir('artifacts/responsive-tests',{recursive:true});await page.screenshot({path:`artifacts/responsive-tests/${info.project.name}-${width}-${height}.png`});
 });
});
test('a native phone swipe scrolls the project scene without selecting a number',async({browser,browserName,baseURL})=>{
 test.skip(browserName!=='chromium','Native input dispatch uses the Chromium protocol; WebKit scroll scenes are covered by the size matrix.');
 const context=await browser.newContext({baseURL,viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
 await page.goto('/portfolio#work');await expect(page.locator('.pf-project-copy h3')).toHaveText('Flow Studio');
 const start=await page.locator('.pf-scroll').evaluate(el=>el.scrollTop),session=await context.newCDPSession(page);
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:710,id:1}]});
 for(let i=1;i<=25;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y:710-i*20,id:1}]});await page.waitForTimeout(12);}
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect.poll(()=>page.locator('.pf-scroll').evaluate(el=>el.scrollTop)).toBeGreaterThan(start+300);
 await expect(page.locator('.pf-project-copy h3')).not.toHaveText('Flow Studio');await expect(page.locator('.pf-case')).toHaveCount(0);await context.close();
});
for(const [width,height] of [[390,844],[768,1024],[1024,768],[1440,1000]])test(`About portfolio is the only startup app at ${width} × ${height}`,async({page},info)=>{
 await page.setViewportSize({width,height});await page.goto('/');
 const about=page.locator('.app-about');await expect(about.locator('.pf-experience')).toHaveAttribute('data-measured','true');
 await expect(page.locator('.app-safari')).toHaveCount(0);await expect(page.locator('.about-portfolio')).toHaveCount(1);await expect(page.locator('.welcome-hero')).toHaveCount(0);
 await expect(page.locator('.pf-macfolio-link svg')).toHaveCount(0);
 const menu=about.getByRole('button',{name:'Open navigation',exact:true});if(await menu.isVisible())await menu.click();
 await about.locator('.pf-nav > nav').getByRole('link',{name:'Work',exact:true}).click();await expect(about.locator('.pf-experience')).toHaveAttribute('data-scene','work');await expect(page).toHaveURL(/\/$/);
 const popupPromise=page.waitForEvent('popup');await about.getByRole('link',{name:'OPEN FULL PORTFOLIO',exact:true}).click();const popup=await popupPromise;await expect(popup).toHaveURL(/\/portfolio$/);await expect(popup.locator('.pf-standalone')).toBeVisible();await popup.close();
 await scene(page,'journey',.5);await expect(about.locator('.pf-journey-card.is-active h3')).toHaveText('B.Sc. in Computer Engineering');
 await page.screenshot({path:`artifacts/responsive-tests/${info.project.name}-about-${width}-${height}.png`});
});
