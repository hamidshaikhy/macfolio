import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.route('**/_vercel/insights/**',r=>r.fulfill({status:204}));
// Exclude variable provider traffic; this measures only same-origin child runtime payloads.
await page.route('**/v1/**',r=>r.fulfill({json:{data:[]}}));
const responses=[];page.on('response',r=>{if(new URL(r.url()).pathname.startsWith('/apps/'))responses.push(r);});
await page.goto('http://127.0.0.1:5180/?view=desktop');
for(const name of ['Barg','Hamnava','Personal Finance','To Do List']){await page.getByRole('navigation',{name:'Dock',exact:true}).getByRole('button',{name,exact:true}).click();await page.locator(`iframe[title="${name} application"]`).waitFor();}
await page.waitForTimeout(2000);
const resources=await Promise.all(responses.map(async response=>({url:new URL(response.url()).pathname,bytes:(await response.body()).length})));
const result={};
for(const id of ['barg','hamnava','personal-finance','todo']){const rows=resources.filter(r=>r.url.startsWith(`/apps/${id}/`));result[id]={requests:rows.length,jsBytes:rows.filter(r=>r.url.endsWith('.js')).reduce((n,r)=>n+r.bytes,0),cssBytes:rows.filter(r=>r.url.endsWith('.css')).reduce((n,r)=>n+r.bytes,0),allBytes:rows.reduce((n,r)=>n+r.bytes,0)};}
result.openIframes=await page.locator('iframe').count();await browser.close();await mkdir('artifacts/integration-measurements',{recursive:true});await writeFile('artifacts/integration-measurements/open-apps.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
