import { chromium } from '@playwright/test';
import { writeFile,mkdir } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined});
const results=[];
for(const embedded of [false,true]){
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 await context.addInitScript(()=>{const AudioOriginal=window.Audio;window.Audio=class extends AudioOriginal{constructor(...args){super(...args);window.__liveAudio=this;}};});
 const page=await context.newPage();await page.route('**/_vercel/insights/**',r=>r.fulfill({status:204}));
 const result={mode:embedded?'embedded':'standalone'};
 try{
  await page.goto('http://127.0.0.1:5180/'+(embedded?'?view=desktop':'apps/hamnava/'));
  let doc=page;
  if(embedded){await page.getByRole('navigation',{name:'Dock',exact:true}).getByRole('button',{name:'Hamnava',exact:true}).click();await page.locator('iframe[title="Hamnava application"]').waitFor();doc=await (await page.locator('iframe').elementHandle()).contentFrame();}
  await doc.locator('.track-row').first().waitFor({timeout:45000});
  result.title=await doc.locator('.track-row .track-title').first().innerText();
  await doc.locator('.track-row .row-play').first().click();
  await doc.waitForFunction(()=>window.__liveAudio?.currentTime>0.1&&!window.__liveAudio.paused,null,{timeout:45000});
  result.playing=true;result.seconds=await doc.evaluate(()=>window.__liveAudio.currentTime);
  if(embedded){await page.getByRole('button',{name:'Minimize Hamnava'}).click();await page.waitForTimeout(1000);result.continuesMinimized=await doc.evaluate(()=>!window.__liveAudio.paused&&window.__liveAudio.currentTime>0.1);await page.getByRole('navigation',{name:'Dock',exact:true}).getByRole('button',{name:'Hamnava',exact:true}).click();}
  await doc.getByRole('textbox',{name:'جست‌وجوی سریع موسیقی'}).fill('house');await doc.getByRole('textbox',{name:'جست‌وجوی سریع موسیقی'}).press('Enter');await doc.locator('.search-page .track-row').first().waitFor({timeout:30000});result.search=true;
  if(embedded){await page.getByRole('button',{name:'Close Hamnava'}).click();result.closed=(await page.locator('iframe').count())===0;}
 }catch(error){result.error=String(error.message).slice(0,350);}
 results.push(result);console.log(result);await context.close();
}
await browser.close();await mkdir('artifacts/integration-measurements',{recursive:true});await writeFile('artifacts/integration-measurements/hamnava-live.json',JSON.stringify(results,null,2));
