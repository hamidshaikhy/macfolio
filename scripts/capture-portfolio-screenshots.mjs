import { chromium } from '@playwright/test';
import { preview } from 'vite';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const directory=fileURLToPath(new URL('../docs/screenshots/',import.meta.url));
const chrome=process.env.PLAYWRIGHT_CHROME_EXECUTABLE || (process.platform==='win32' && existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
const server=process.env.MACFOLIO_SCREENSHOT_URL ? null : await preview({preview:{host:'127.0.0.1',port:5183,strictPort:true,open:false}});
const url=process.env.MACFOLIO_SCREENSHOT_URL || 'http://127.0.0.1:5183/';
const errors=[];
let browser;
async function ready(page){
  await page.locator('.pf-experience[data-measured="true"]').waitFor();
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>{const image=document.querySelector('.pf-photo');return image?.complete&&image.naturalWidth>0;});
  await page.waitForTimeout(1000);
}
async function capture(page,name){
  await page.evaluate(async()=>{
    await document.fonts.ready;
    await Promise.all([...document.images].filter(img=>img.complete&&img.naturalWidth).map(img=>img.decode()));
    document.activeElement?.blur();
  });
  await page.mouse.move(0,0);
  await page.waitForTimeout(350);
  await page.screenshot({path:`${directory}/${name}.png`,style:'.pf-cursor { visibility:hidden; }'});
  console.log(`Captured ${name}`);
}
async function section(page,name){
  const menu=page.getByRole('button',{name:'Open navigation',exact:true});
  if(await menu.isVisible())await menu.click();
  await page.locator('.pf-nav > nav').getByRole('link',{name,exact:true}).click();
  await page.waitForTimeout(1200);
}
try{
  await mkdir(directory,{recursive:true});
  browser=await chromium.launch({executablePath:chrome});
  const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await page.clock.setFixedTime(new Date('2026-10-13T09:00:00Z'));
  await page.goto(url);await ready(page);
  await page.getByRole('button',{name:'Control Center',exact:true}).click();
  await page.getByRole('button',{name:'Toggle dark mode',exact:true}).click();
  await page.getByRole('button',{name:'Control Center',exact:true}).click();
  await capture(page,'portfolio-about');
  await page.getByRole('button',{name:'Control Center',exact:true}).click();
  await page.getByRole('button',{name:'Toggle dark mode',exact:true}).click();
  await page.getByRole('button',{name:'Control Center',exact:true}).click();
  await capture(page,'portfolio-about-dark');
  await page.getByRole('button',{name:'Inspect portrait',exact:true}).click();
  await page.waitForTimeout(1100);await capture(page,'portfolio-electronic-about');
  await page.getByRole('button',{name:'Close About Hamid',exact:true}).click();
  await page.getByRole('navigation',{name:'Dock',exact:true}).getByRole('button',{name:'Safari',exact:true}).click();
  await page.getByRole('heading',{name:'Favorites',exact:true}).waitFor();
  await capture(page,'safari-favorites');
  await page.locator('.safari-favorites').getByRole('button',{name:'Portfolio',exact:true}).click();
  await ready(page);await capture(page,'portfolio-safari');

  await page.setViewportSize({width:1600,height:900});
  await page.goto(new URL('portfolio',url).href);await ready(page);
  await capture(page,'portfolio-hero');
  await page.getByRole('button',{name:'Inspect portrait',exact:true}).click();
  await page.waitForTimeout(1100);await capture(page,'portfolio-electronic');
  await page.getByRole('button',{name:'Close inspection',exact:true}).click();
  await section(page,'Profile');await capture(page,'portfolio-profile');
  await section(page,'Stack');await capture(page,'portfolio-stack');
  await section(page,'Work');await capture(page,'portfolio-work');
  await section(page,'Journey');await capture(page,'portfolio-journey');
  await section(page,'Contact');await capture(page,'portfolio-contact');

  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const phone=await mobile.newPage();
  phone.on('pageerror',error=>errors.push(error.message));
  await phone.clock.setFixedTime(new Date('2026-10-13T09:00:00Z'));
  await phone.goto(url);await ready(phone);await capture(phone,'portfolio-about-mobile');
  await phone.goto(new URL('portfolio',url).href);await ready(phone);
  await section(phone,'Work');await capture(phone,'portfolio-mobile-work');
  await section(phone,'Journey');await capture(phone,'portfolio-mobile-journey');
  await section(phone,'Contact');await capture(phone,'portfolio-mobile-contact');
  await phone.setViewportSize({width:820,height:1180});
  await phone.goto(new URL('portfolio',url).href);await ready(phone);
  await section(phone,'Work');await capture(phone,'portfolio-tablet-work');
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('Portfolio gallery captured without browser errors.');
}finally{
  await browser?.close();
  if(server)await new Promise((resolve,reject)=>server.httpServer.close(error=>error?reject(error):resolve()));
}
