import {chromium} from '@playwright/test';
import {preview} from 'vite';
import {existsSync} from 'node:fs';
import {mkdir,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

// Refresh only the images actually linked by README; do not expand its gallery.
const root=new URL('../',import.meta.url);
const directory=fileURLToPath(new URL('docs/screenshots/',root));
const readme=await readFile(new URL('README.md',root),'utf8');
const mobileOnly=process.argv.includes('--mobile-only');
const expected=new Set([...readme.matchAll(/docs\/screenshots\/([\w-]+)\.png/g)].map(match=>match[1]).filter(name=>!mobileOnly||name.includes('mobile')));
const captured=new Set(),problems=[];
const chrome=process.env.PLAYWRIGHT_CHROME_EXECUTABLE||(process.platform==='win32'&&existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
const server=process.env.MACFOLIO_SCREENSHOT_URL?null:await preview({preview:{host:'127.0.0.1',port:5186,strictPort:true,open:false}});
const base=process.env.MACFOLIO_SCREENSHOT_URL||'http://127.0.0.1:5186/';
let browser;
async function capture(page,name){
  if(!expected.has(name))throw Error(`Unreferenced README image: ${name}`);
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>[...document.images].filter(image=>{
    const box=image.getBoundingClientRect();return box.width&&box.height&&box.bottom>0&&box.top<innerHeight;
  }).every(image=>image.complete&&image.naturalWidth>0));
  await page.evaluate(()=>{document.activeElement?.blur();window.getSelection()?.removeAllRanges();});
  await page.mouse.move(0,0);await page.waitForTimeout(350);
  await page.screenshot({path:`${directory}/${name}.png`,style:'.pf-cursor { visibility:hidden; }'});
  captured.add(name);console.log(`Captured ${name}`);
}
async function readyPortfolio(page){
  await page.locator('.pf-experience[data-measured="true"]').waitFor();
  await page.waitForFunction(()=>document.querySelector('.pf-photo')?.naturalWidth>0);
  await page.waitForTimeout(1000);
}
async function setup(context){
  const page=await context.newPage();page.on('pageerror',error=>problems.push(error.message));
  await page.clock.setFixedTime(new Date('2026-10-18T09:00:00Z'));
  await page.route('**/_vercel/insights/**',route=>route.fulfill({status:204}));
  return page;
}
async function closeWindows(page){
  const buttons=page.locator('.os-window:not([hidden]) .traffic-lights .close');
  while(await buttons.count())await buttons.last().click();
}
async function open(page,name){await page.getByRole('navigation',{name:'Dock',exact:true}).getByRole('button',{name,exact:true}).click();}
async function theme(page,value){
  if(await page.locator('html').getAttribute('data-theme')===value)return;
  await page.getByRole('button',{name:'Control Center',exact:true}).click();
  await page.getByRole('button',{name:'Toggle dark mode',exact:true}).click();
  await page.keyboard.press('Escape');
}
async function section(page,name){
  const menu=page.getByRole('button',{name:'Open navigation',exact:true});
  if(await menu.isVisible())await menu.click();
  await page.locator('.pf-nav > nav').getByRole('link',{name,exact:true}).click();
  await page.waitForTimeout(1200);
}
try{
  await mkdir(directory,{recursive:true});browser=await chromium.launch({executablePath:chrome});
  if(!mobileOnly){
  const desktop=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const page=await setup(desktop);await page.goto(base);await readyPortfolio(page);
  await theme(page,'light');await capture(page,'portfolio-about');
  await closeWindows(page);await page.setViewportSize({width:1440,height:900});
  await theme(page,'dark');await open(page,'GitHub');await page.locator('.gh-hero').waitFor();
  await capture(page,'github-desktop');await closeWindows(page);
  await theme(page,'light');await page.getByRole('button',{name:/Selected work \d+ projects/}).click();
  await page.locator('.project-hero').waitFor();await capture(page,'projects-desktop');await closeWindows(page);
  await open(page,'Calendar');await page.getByRole('button',{name:'New Event',exact:true}).click();
  await page.getByLabel('Title',{exact:true}).fill('Portfolio review');await page.getByLabel('Time',{exact:true}).fill('16:00');
  await page.getByRole('button',{name:'Add event',exact:true}).click();await capture(page,'calendar-light');await closeWindows(page);
  await theme(page,'dark');await open(page,'Code');await page.getByRole('textbox',{name:'Code editor'}).waitFor();
  await capture(page,'workspace-desktop');await closeWindows(page);
  await open(page,'Chess');await page.getByRole('button',{name:'2 players',exact:true}).click();
  await page.getByRole('button',{name:'e2 white pawn',exact:true}).click();await page.getByRole('button',{name:'e4 legal move',exact:true}).click();
  await capture(page,'chess-desktop');
  await page.setViewportSize({width:1600,height:900});await page.goto(new URL('portfolio',base).href);await readyPortfolio(page);
  await page.getByRole('button',{name:'Inspect portrait',exact:true}).click();await page.waitForTimeout(1100);
  await capture(page,'portfolio-electronic');await page.getByRole('button',{name:'Close inspection',exact:true}).click();
  await section(page,'Work');await capture(page,'portfolio-work');
  }
  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const phone=await setup(mobile);await phone.goto(base);await readyPortfolio(phone);await capture(phone,'portfolio-about-mobile');
  await phone.getByRole('button',{name:'Back to home',exact:true}).click();await capture(phone,'mobile-home');
  await phone.goto(new URL('portfolio',base).href);await readyPortfolio(phone);await section(phone,'Contact');await capture(phone,'portfolio-mobile-contact');
  const missing=[...expected].filter(name=>!captured.has(name));
  if(missing.length||problems.length)throw Error([...missing.map(name=>`Missing ${name}`),...problems].join('\n'));
  console.log(`Updated all ${captured.size} README images without browser errors.`);
}finally{await browser?.close();await server?.close();}
