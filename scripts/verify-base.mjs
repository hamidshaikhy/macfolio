import { chromium, webkit, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const verify = expect.configure({ timeout: 20000 });
const base = process.argv[2] || 'http://127.0.0.1:5182/macfolio/';
const chrome=process.env.PLAYWRIGHT_CHROME_EXECUTABLE || (process.platform==='win32'&&existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
for (const [name,engine] of [['chrome',chromium],['webkit',webkit]]) {
 const browser=await engine.launch(name==='chrome'&&chrome?{executablePath:chrome}:{});
 const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];const missing=[];const workers=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400) missing.push(`${r.status()} ${r.url()}`)});page.on('worker',w=>workers.push(w.url()));
 try {
 await page.goto(base);await verify(page.getByRole('heading',{name:/ایده‌های خوب/})).toBeVisible();
 const avatar=page.getByRole('img',{name:'Hamid Shaikhy',exact:true}).first();assert.equal(await avatar.evaluate(i=>i.naturalWidth>0),true);
 await page.reload();await verify(page.getByRole('heading',{name:/ایده‌های خوب/})).toBeVisible();
 await page.getByRole('button',{name:'Launchpad',exact:true}).click();await page.locator('.launchpad-grid').getByRole('button',{name:'Preview',exact:true}).click();await verify(page.locator('.pdf-workspace .pdf-page[data-rendered="true"]')).toHaveCount(2, { timeout: 20000 });
 assert.match(await page.getByRole('link',{name:'Download original PDF'}).getAttribute('href'),/\/macfolio\/assets\/resume.pdf$/);
 await page.getByRole('button',{name:'Control Center',exact:true}).click();await page.getByRole('button',{name:'Play music',exact:true}).click();await verify.poll(()=>page.locator('audio').evaluate(a=>a.currentTime)).toBeGreaterThan(1);
 await page.getByRole('button',{name:'Toggle dark mode',exact:true}).click();await verify(page.locator('audio')).toHaveJSProperty('paused',false);await page.keyboard.press('Escape');
 await page.getByRole('navigation',{name:'Dock',exact:true}).getByRole('button',{name:'Chess',exact:true}).click();await page.getByRole('button',{name:'Computer',exact:true}).click();await page.getByRole('button',{name:'e2 white pawn',exact:true}).click();await page.getByRole('button',{name:'e4 legal move',exact:true}).click();
 await verify(page.locator('.move-list')).toContainText(/e4/);await verify.poll(()=>workers.some(w=>w.includes('/macfolio/assets/chess.worker-'))).toBe(true);await verify(page.locator('.chess-status')).toContainText('White to move');
 await page.getByRole('navigation',{name:'Dock',exact:true}).getByRole('button',{name:'Code',exact:true}).click();await verify(page.getByRole('textbox',{name:'Code editor'})).toBeVisible();
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);assert.ok(workers.some(w=>w.includes('/macfolio/assets/pdf.worker')));
 await page.screenshot({path:`artifacts/qa/${name}-base-path.png`});
 console.log(`${name}: base assets, reload, both PDF pages, worker paths, actual audio, theme, chess engine and Code passed; no page errors or missing first-party responses.`);
 } finally { await browser.close(); }
}


