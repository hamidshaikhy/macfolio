import {test,expect,type Page} from '@playwright/test';

const cover='https://covers.example/original.svg';
const tracks=[{id:'Track01',title:'Original Song',duration:185,genre:'House',user:{name:'Original Artist',handle:'artist'},artwork:{'480x480':cover}}];
const playlists=[{id:'List01',playlist_name:'Night Drive / Vol. 2 🌙',description:'Original description https://audius.co/artist',track_count:1,user:{name:'Original Curator'},artwork:{'480x480':cover}}];

async function mockCatalog(page:Page){
 await page.route('https://covers.example/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480"><rect width="480" height="480" fill="#344c58"/></svg>'}));
 await page.route('**/v1/**',route=>{
  const path=new URL(route.request().url()).pathname;
  return route.fulfill({json:{data:path.includes('/playlists/')&&!path.endsWith('/tracks')?playlists:tracks}});
 });
 await page.goto('/apps/hamnava/');
 await expect(page.locator('.playlist-card').first().locator('bdi').first()).toHaveText(playlists[0].playlist_name);
 await expect(page.locator('.hero h1')).toHaveText('رانندگی شبانه');
 await expect(page.locator('.hero')).toHaveCSS('background-image',/hero-night\.webp/);
}

async function contrast(page:Page,selector:string){
 return page.locator(selector).evaluate(el=>{
  const rgb=(s:string)=>s.match(/[\d.]+/g)!.slice(0,3).map(Number);
  const luminance=(v:number[])=>v.map(n=>{const s=n/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;}).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0);
  const blend=(fg:number[],bg:number[],a:number)=>fg.map((v,i)=>v*a+bg[i]*(1-a));
  const layers:Element[]=[];for(let n:Element|null=el;n;n=n.parentElement)layers.unshift(n);
  let backgrounds=[[20,22,19]];
  for(const layer of layers){
   const style=getComputedStyle(layer),values=style.backgroundColor.match(/[\d.]+/g)!.map(Number);
   backgrounds=backgrounds.map(bg=>blend(values.slice(0,3),bg,values[3]??1));
   const stops=style.backgroundImage.match(/rgba?\([^)]+\)/g);
   if(stops)backgrounds=backgrounds.flatMap(bg=>stops.map(stop=>{const v=stop.match(/[\d.]+/g)!.map(Number);return blend(v.slice(0,3),bg,v[3]??1);}));
  }
  const text=luminance(rgb(getComputedStyle(el).color));
  return Math.min(...backgrounds.map(bg=>{const surface=luminance(bg);return (Math.max(text,surface)+.05)/(Math.min(text,surface)+.05);}));
 });
}

test('API playlist names, covers, descriptions and owners survive home, details and saving',async({page})=>{
 await mockCatalog(page);
 const card=page.locator('.playlist-card').first();
 await expect(card.locator('bdi').first()).toHaveText(playlists[0].playlist_name);
 await expect(card.locator('img')).toHaveAttribute('src',cover);
 await expect(card.locator('small')).toHaveText('Original Curator');
 await expect(page.getByText('صبح آرام',{exact:true})).toHaveCount(0);
 await card.locator('.playlist-open').click();
 await expect(page.locator('.detail-hero h1')).toHaveText(playlists[0].playlist_name);
 await expect(page.locator('.detail-hero p')).toHaveText(playlists[0].description);
 await expect(page.locator('.detail-hero img')).toHaveAttribute('src',cover);
 await page.getByRole('button',{name:'ذخیره',exact:true}).click();
 await page.locator('.desktop-nav').getByRole('link',{name:'کتابخانهٔ من'}).click();
 await expect(page.locator('.playlist-card bdi').first()).toHaveText(playlists[0].playlist_name);
});

test('signup opens a readable profile and persists the account and guest favorites',async({page})=>{
 await mockCatalog(page);
 await expect(page.locator('.liked').first()).toHaveCount(0);
 await page.locator('.track-row').first().getByRole('button',{name:'افزودن به پسندیده‌ها'}).click();
 await page.getByRole('button',{name:'ورود یا ثبت‌نام'}).click();
 await page.getByRole('button',{name:'ثبت‌نام',exact:true}).click();
 await page.getByLabel('ایمیل',{exact:true}).fill('listener@example.com');
 await page.getByLabel('رمز عبور',{exact:true}).fill('hamnava-test-password');
 await page.getByRole('button',{name:'ساخت حساب محلی'}).click();
 const account=page.getByRole('button',{name:'حساب listener@example.com'});
 await expect(account).toBeVisible();
 expect(await contrast(page,'.account-button')).toBeGreaterThan(4.5);
 await account.click();
 await expect(page.locator('.profile-card h3')).toHaveText('listener@example.com');
 expect(await contrast(page,'.profile-avatar')).toBeGreaterThan(4.5);
 await expect(page.locator('.profile-stats strong').first()).toHaveText('۱');
 await page.getByRole('button',{name:'بستن',exact:true}).click();
 await page.reload();
 await expect(account).toBeVisible();
 await account.click();
 await expect(page.locator('.profile-stats strong').first()).toHaveText('۱');
 await page.getByRole('button',{name:'خروج از حساب',exact:true}).click();
 await expect(page.getByRole('button',{name:'ورود یا ثبت‌نام'})).toBeVisible();
});

test('active track text and favorite collection use readable dark surfaces',async({page})=>{
 await mockCatalog(page);
 await expect(page.locator('.track-row.active')).toHaveCount(1);
 expect(await contrast(page,'.track-row.active .track-title')).toBeGreaterThan(4.5);
 expect(await contrast(page,'.track-row.active .track-artist')).toBeGreaterThan(4.5);
 expect(await contrast(page,'.track-row.active .track-duration')).toBeGreaterThan(4.5);
 await page.locator('.desktop-nav').getByRole('link',{name:'کتابخانهٔ من'}).click();
 expect(await contrast(page,'.liked-collection h2')).toBeGreaterThan(4.5);
 expect(await contrast(page,'.liked-collection p')).toBeGreaterThan(4.5);
});

test('mobile brand, navigation, mixed language titles and account dialog fit small screens',async({page})=>{
 await page.setViewportSize({width:360,height:800});
 await mockCatalog(page);
 await expect(page.getByRole('link',{name:'hamnava · صفحهٔ اصلی'})).toBeVisible();
 await expect(page.locator('.brand-name')).toHaveText('hamnava');
 await expect(page.locator('.bottom-nav')).toBeVisible();
 for(const screen of ['کتابخانهٔ من','جست‌وجو','خانه']){
  await page.locator('.bottom-nav').getByRole('link',{name:screen,exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.getByRole('button',{name:'ورود یا ثبت‌نام'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
