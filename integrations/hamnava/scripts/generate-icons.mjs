import {chromium} from 'playwright';
import {readFile} from 'node:fs/promises';

// Render the same vector mark used by the header and favicon.
const svg=await readFile(new URL('../public/icon.svg',import.meta.url),'utf8');
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
try{
 const page=await browser.newPage();
 for(const size of [192,512]){
  await page.setViewportSize({width:size,height:size});
  await page.setContent(`<style>body{margin:0}svg{display:block;width:100vw;height:100vh}</style>${svg}`);
  await page.screenshot({path:`public/icon-${size}.png`,omitBackground:true});
 }
 const maskable=svg.replace(/<rect[^>]+\/>/,'<rect width="64" height="64" fill="#1b2115"/>').replace('<path','<g transform="translate(8 8) scale(.75)"><path').replace('</svg>','</g></svg>');
 await page.setContent(`<style>body{margin:0}svg{display:block;width:512px;height:512px}</style>${maskable}`);
 await page.screenshot({path:'public/icon-maskable.png'});
}finally{await browser.close();}
