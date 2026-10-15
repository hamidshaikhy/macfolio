import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
const browser = await chromium.launch({executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined)});
const results = {};
for (const path of ['/', '/portfolio']) {
  const context = await browser.newContext({viewport:{width:1440,height:900}});
  const page = await context.newPage();
  await page.route('**/_vercel/insights/**', route => route.fulfill({status:204}));
  const responses = [];
  page.on('response', response => { if (response.url().startsWith(process.env.MEASURE_URL || 'http://127.0.0.1:5190')) responses.push(response); });
  await page.goto((process.env.MEASURE_URL || 'http://127.0.0.1:5190')+path);
  await page.locator('.pf-hero').waitFor();
  await page.waitForTimeout(2500);
  const rows = await Promise.all(responses.map(async r => ({url:new URL(r.url()).pathname, bytes:(await r.body().catch(()=>Buffer.alloc(0))).length})));
  results[path] = {requests:rows.length, jsBytes:rows.filter(r=>r.url.endsWith('.js')).reduce((n,r)=>n+r.bytes,0), cssBytes:rows.filter(r=>r.url.endsWith('.css')).reduce((n,r)=>n+r.bytes,0), childRequests:rows.filter(r=>r.url.startsWith('/apps/')).length, iframes:await page.locator('iframe').count(), resources:rows};
  await context.close();
}
await browser.close();
await mkdir('artifacts/integration-measurements',{recursive:true});
await writeFile(`artifacts/integration-measurements/${process.env.MEASURE_LABEL || 'before'}.json`, JSON.stringify(results,null,2));
console.log(JSON.stringify(Object.fromEntries(Object.entries(results).map(([k,{resources,...v}])=>[k,v])),null,2));
