import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const names={barg:'Barg',todo:'To Do List',hamnava:'Hamnava','personal-finance':'Personal Finance'};
// These UI tests mock the provider. Worker/offline behavior has its own unmocked suite.
test.use({serviceWorkers:'block'});
test.beforeEach(async({page})=>{await page.route('**/_vercel/insights/**',r=>r.fulfill({status:204}));});
async function app(page,id,embedded){
  if(!embedded){await page.goto(`/apps/${id}/`);return page;}
  await page.goto('/?view=desktop');await page.getByRole('navigation',{name:'Dock',exact:true}).getByRole('button',{name:names[id],exact:true}).click();
  await expect(page.locator(`.embedded-app[data-app-id="${id}"]`)).toHaveAttribute('data-status','ready');return page.frameLocator(`iframe[title="${names[id]} application"]`);
}
async function download(page,click){const pending=page.waitForEvent('download');await click();const file=await pending;expect(await file.failure()).toBeNull();const bytes=await readFile(await file.path());expect(bytes.length).toBeGreaterThan(20);return {file,bytes};}
for(const embedded of [false,true]){
  const mode=embedded?'embedded':'standalone';
  test(`Hamnava ${mode} searches, decodes audio without autoplay and preserves user playback`,async({page,context,browserName})=>{
    await context.addInitScript(({nativeMediaFixture})=>{
      const Original=window.Audio;
      // WebKit native media requests bypass Playwright routing. Redirect only its fixture source;
      // play(), events, decoding, currentTime and lifecycle remain the real browser implementation.
      window.Audio=class extends Original{
        constructor(...args){super(...args);window.__qaAudio=this;this.addEventListener('timeupdate',()=>{if(window.parent!==window)window.parent.postMessage({channel:'qa-audio-time',seconds:this.currentTime},location.origin);});}
        get src(){return super.src;}
        set src(value){super.src=nativeMediaFixture&&value.includes('/stream?')?location.origin+'/assets/audio/drowning-in-vertigo.mp3':value;}
      };
    },{nativeMediaFixture:browserName==='webkit'});
    const audio=await readFile('public/assets/audio/drowning-in-vertigo.mp3');
    const catalog=[{id:'Track01',title:'Integration Track',duration:180,genre:'House',user:{name:'Fixture Artist',handle:'fixture'}}];
    const requests=[];
    await context.route('**/v1/**',r=>{
      requests.push(r.request().url());
      if(r.request().url().includes('/stream')){
        const range=/bytes=(\d+)-(\d*)/.exec(r.request().headers().range||'');
        const start=range?Number(range[1]):0,end=range&&range[2]?Math.min(Number(range[2]),audio.length-1):audio.length-1;
        return r.fulfill({status:range?206:200,contentType:'audio/mpeg',headers:{'accept-ranges':'bytes',...(range?{'content-range':`bytes ${start}-${end}/${audio.length}`}:{})},body:audio.subarray(start,end+1)});
      }
      return r.fulfill({json:{data:r.request().url().includes('/playlists')?[]:catalog}});
    });
    await page.addInitScript(()=>{window.__audioUpdates=[];window.addEventListener('message',e=>{if(e.data?.channel==='qa-audio-time')window.__audioUpdates.push(e.data.seconds);});});
    const ui=await app(page,'hamnava',embedded);
    await expect(ui.locator('.track-row').first()).toBeVisible();
    const doc=embedded?await (await page.locator('iframe').elementHandle()).contentFrame():page;
    expect(await doc.evaluate(()=>window.__qaAudio.paused)).toBe(true);expect(requests.some(url=>url.includes('/stream'))).toBe(false);
    await ui.locator('.track-row .row-play').first().click();
    await expect.poll(()=>doc.evaluate(()=>window.__qaAudio.currentTime)).toBeGreaterThan(.1);
    if(embedded){await page.getByRole('button',{name:'Minimize Hamnava'}).click();const before=await doc.evaluate(()=>window.__qaAudio.currentTime);await expect.poll(()=>doc.evaluate(()=>window.__qaAudio.currentTime)).toBeGreaterThan(before+.1);await page.getByRole('navigation',{name:'Dock',exact:true}).getByRole('button',{name:'Hamnava',exact:true}).click();}
    await ui.getByRole('textbox',{name:'جست‌وجوی سریع موسیقی'}).fill('integration');await ui.getByRole('textbox',{name:'جست‌وجوی سریع موسیقی'}).press('Enter');await expect(ui.locator('.search-page .track-row')).toHaveCount(1);expect(requests.some(url=>url.includes('/tracks/search'))).toBe(true);
    if(embedded){await page.getByRole('button',{name:'Close Hamnava'}).click();await expect(page.locator('iframe')).toHaveCount(0);const updates=await page.evaluate(()=>window.__audioUpdates.length);await page.waitForTimeout(600);expect(await page.evaluate(()=>window.__audioUpdates.length)).toBe(updates);}
  });
  test(`Barg ${mode} keeps autosave, real Word/PDF downloads and printable font layout`,async({page})=>{
    const ui=await app(page,'barg',embedded);
    if(embedded){const handle=await page.locator('iframe').elementHandle();const doc=await handle.contentFrame();await doc.goto(new URL('/apps/barg/builder'+new URL(doc.url()).search,doc.url()).href);}
    else await page.goto('/apps/barg/builder');
    await ui.getByLabel('نام و نام خانوادگی',{exact:true}).fill('Integration Resume');
    await expect(ui.locator('.r-name').first()).toHaveText('Integration Resume');
    const doc=embedded?await (await page.locator('iframe').elementHandle()).contentFrame():page;
    expect(await doc.evaluate(()=>JSON.parse(localStorage.getItem('barg:resume')).state.resume.basics.fullName)).toBe('Integration Resume');
    await ui.getByRole('button',{name:'دریافت خروجی'}).click();
    const word=await download(page,()=>ui.getByRole('menuitem',{name:/Word/}).click());expect(word.file.suggestedFilename()).toMatch(/\.docx$/);expect(word.bytes.subarray(0,2).toString()).toBe('PK');
    await ui.getByRole('button',{name:'دریافت خروجی'}).click();
    const pdf=await download(page,()=>ui.getByRole('menuitem',{name:/PDF تصویری/}).click());expect(pdf.bytes.subarray(0,4).toString()).toBe('%PDF');
    // Headless print-dialog interaction is unavailable; inspect the actual print stylesheet and fonts.
    await page.emulateMedia({media:'print'});await doc.evaluate(()=>document.fonts.ready);
    expect(await doc.locator('#export-root .r-page').count()).toBeGreaterThan(0);
    expect(await doc.evaluate(()=>document.fonts.check('16px Vazirmatn'))).toBe(true);
    await page.emulateMedia({media:'screen'});
  });
  test(`To Do List ${mode} saves tasks, exports backup and reconciles hidden timers`,async({page,context})=>{
    await page.clock.install({time:new Date('2026-10-14T10:00:00Z')});
    const ui=await app(page,'todo',embedded);await ui.getByRole('textbox',{name:'نام کار جدید'}).fill('Saved integration task');await ui.getByRole('textbox',{name:'نام کار جدید'}).press('Enter');
    await expect(ui.getByRole('heading',{name:'Saved integration task',exact:true})).toBeVisible();
    const task=ui.locator('.task').filter({has:ui.getByRole('heading',{name:'یک قدم برای یادگیری',exact:true})});await task.getByRole('button',{name:'شروع',exact:true}).click();
    if(embedded)await page.getByRole('button',{name:'Minimize To Do List'}).click();
    await page.clock.fastForward(91*60*1000);
    if(embedded)await page.getByRole('navigation',{name:'Dock',exact:true}).getByRole('button',{name:'To Do List',exact:true}).click();
    await expect(task).toHaveClass(/done/);
    await ui.getByRole('button',{name:'تنظیمات',exact:true}).click();const backup=await download(page,()=>ui.getByRole('button',{name:'دریافت فایل پشتیبان',exact:true}).click());
    const json=JSON.parse(backup.bytes);expect(json.tasks.some(t=>t.title==='Saved integration task')).toBe(true);expect(json.tasks.find(t=>t.title==='یک قدم برای یادگیری').completedAt).not.toBeNull();
    const independent=await context.newPage();await independent.goto('/apps/todo/');await expect(independent.getByRole('heading',{name:'Saved integration task',exact:true})).toBeVisible();await independent.close();
  });
  test(`Personal Finance ${mode} exports real CSV and encrypted backup`,async({page})=>{
    const ui=await app(page,'personal-finance',embedded);await ui.getByRole('button',{name:'ورود به نسخهٔ دمو'}).click();
    await ui.locator('.desktop-nav').getByRole('button',{name:'گزارش‌ها',exact:true}).click();
    const csv=await download(page,()=>ui.getByRole('button',{name:'دریافت تراکنش‌های این بازه',exact:true}).click());expect(csv.file.suggestedFilename()).toMatch(/\.csv$/);
    await ui.getByRole('button',{name:'تنظیمات',exact:true}).click();await ui.getByRole('button',{name:/پشتیبان رمزگذاری‌شده/}).click();
    const modal=ui.getByRole('dialog',{name:'دریافت پشتیبان امن'});await modal.locator('input[name="password"]').fill('BackupPass123!');await modal.locator('input[name="repeat"]').fill('BackupPass123!');
    const backup=await download(page,()=>modal.getByRole('button',{name:'ساخت فایل پشتیبان',exact:true}).click());const json=JSON.parse(backup.bytes);
    expect(JSON.stringify(json)).not.toContain('BackupPass123!');expect(JSON.stringify(json)).not.toContain('transactions');
  });
}
test('finance window and full tab share persisted data but reject stale writes and isolate another user',async({page,context})=>{
  const a=await app(page,'personal-finance',true);
  await a.getByRole('button',{name:'ساخت حساب جدید',exact:true}).click();await a.locator('input[name="name"]').fill('Alpha Private');await a.locator('input[name="username"]').fill('alpha-test');await a.locator('input[name="password"]').fill('AccountPass123!');await a.getByRole('button',{name:'ساخت حساب',exact:true}).click();
  await a.getByRole('button',{name:'تنظیمات',exact:true}).click();
  const tab=await context.newPage();await tab.goto('/apps/personal-finance/');await tab.locator('input[name="username"]').fill('alpha-test');await tab.locator('input[name="password"]').fill('AccountPass123!');await tab.getByRole('button',{name:'ورود به حساب',exact:true}).first().click();
  await tab.getByRole('button',{name:'تنظیمات',exact:true}).click();await tab.getByRole('button',{name:/Alpha Private/}).click();
  await a.getByRole('button',{name:/Alpha Private/}).click();await a.getByLabel('نام نمایشی',{exact:true}).fill('Alpha Newest');await a.getByRole('button',{name:'ذخیره نام',exact:true}).click();
  await tab.getByLabel('نام نمایشی',{exact:true}).fill('Stale overwrite');await tab.getByRole('button',{name:'ذخیره نام',exact:true}).click();await expect(tab.getByRole('alert')).toContainText(/تب دیگری/);
  await tab.reload();await tab.locator('input[name="username"]').fill('alpha-test');await tab.locator('input[name="password"]').fill('AccountPass123!');await tab.getByRole('button',{name:'ورود به حساب',exact:true}).first().click();await expect(tab.getByText('Alpha Newest',{exact:true}).first()).toBeVisible();
  await tab.getByRole('button',{name:'حساب کاربری',exact:true}).click();await tab.getByRole('button',{name:'خروج و قفل‌کردن',exact:true}).click();await tab.getByRole('button',{name:'ساخت حساب جدید',exact:true}).click();await tab.locator('input[name="name"]').fill('Beta Private');await tab.locator('input[name="username"]').fill('beta-test');await tab.locator('input[name="password"]').fill('AccountPass123!');await tab.getByRole('button',{name:'ساخت حساب',exact:true}).click();
  await expect(tab.getByText('Beta Private',{exact:true}).first()).toBeVisible();expect(await tab.locator('body').innerText()).not.toContain('Alpha');await tab.close();
});
