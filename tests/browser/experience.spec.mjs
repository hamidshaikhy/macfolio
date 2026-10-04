import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

const labels = { about: 'About Hamid', projects: 'Projects', notes: 'Notes', editor: 'Code', terminal: 'Terminal', resume: 'Preview', chess: 'Chess', settings: 'Settings', trash: 'Trash', finder: 'Finder', calculator: 'Calculator', linkedin: 'LinkedIn', safari: 'Safari', github: 'GitHub', calendar: 'Calendar', contacts: 'Contacts' };
async function open(page, id, mobile = false) {
  if (mobile) {
    const back = page.getByRole('button', { name: 'Back to home', exact: true });
    if (await back.isVisible()) await back.click();
    const name = id === 'projects' ? 'Selected work' : id === 'resume' ? 'My résumé' : labels[id];
    const button = page.locator('.ios-home').getByRole('button', { name, exact: true });
    if (await button.isVisible()) await button.click();
    else {
      await page.locator('.ios-home').getByRole('button', { name: 'Search', exact: true }).click();
      await page.getByRole('textbox', { name: 'Search apps' }).fill(labels[id]);
      await page.keyboard.press('Enter');
    }
  }
  else if (id === 'resume' || id === 'projects') { await page.getByRole('button', { name: 'Launchpad', exact: true }).click(); await page.locator('.launchpad-grid').getByRole('button', { name: labels[id], exact: true }).click(); }
  else await page.getByRole('navigation', { name: 'Dock', exact: true }).getByRole('button', { name: labels[id], exact: true }).click();
  await expect(page.locator(`.${id === 'resume' ? 'preview' : id === 'editor' ? 'editor' : id === 'linkedin' ? 'linkedin' : id}-app`).last()).toBeVisible();
  await expect(page.locator('.app-loading:visible')).toHaveCount(0);
}
async function screenshot(page, testInfo, name) { await fs.mkdir('artifacts/qa', { recursive: true }); await page.screenshot({ path: `artifacts/qa/${testInfo.project.name}-${name}.png` }); }
async function cleanStart(page) { await page.goto('./'); await expect(page.getByRole('heading', { name: /ایده‌های خوب/ })).toBeVisible(); }
const runtimeProblems = new WeakMap();
test.beforeEach(async ({ page }) => {
  const problems=[]; runtimeProblems.set(page,problems);
  page.on('pageerror',error=>problems.push(error.message));
  page.on('response',response=>{if(response.status()>=400 && response.url().startsWith(new URL(page.url()).origin)) problems.push(`${response.status()} ${response.url()}`);});
  await page.addInitScript(() => {
    // Inspect actual decoded audio through an analyser, without mocking play.
    const Original = window.AudioContext || window.webkitAudioContext;
    if (Original) window.AudioContext = class extends Original {
      createGain() { const gain = super.createGain(); if (!window.__qaAnalyser) { const analyser = this.createAnalyser(); const silent = super.createGain(); silent.gain.value = 0; gain.connect(analyser); analyser.connect(silent).connect(this.destination); window.__qaAnalyser = analyser; window.__qaGain = gain; } return gain; }
    };
  });
});
test.afterEach(async ({ page }) => { expect(runtimeProblems.get(page) || [], 'page errors and failed first-party resources').toEqual([]); });

test('desktop appearance, window lifecycle, magnification and viewport bounds', async ({ page }, info) => {
  await cleanStart(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const dock = page.getByRole('navigation', { name: 'Dock', exact: true });
  await dock.getByRole('button', { name: 'Calculator', exact: true }).hover();
  await page.waitForTimeout(350);
  const transform = await dock.getByRole('button', { name: 'Calculator', exact: true }).evaluate(el => getComputedStyle(el).transform);
  expect(transform).not.toBe('matrix(1, 0, 0, 1, 0, 0)');
  expect(await dock.getByRole('button', { name: 'LinkedIn', exact: true }).evaluate(el => Number(getComputedStyle(el).transform.match(/matrix\(([^,]+)/)?.[1]))).toBeGreaterThan(1);
  await screenshot(page, info, 'dock-hover');
  await page.mouse.move(100, 200); await page.waitForTimeout(250);
  await open(page, 'calculator');
  const win = page.getByRole('dialog', { name: 'Calculator', exact: true });
  const before = await win.boundingBox();
  await page.getByRole('button', { name: 'Maximize Calculator', exact: true }).click();
  expect((await win.boundingBox()).width).toBeGreaterThan(before.width);
  await page.getByRole('button', { name: 'Maximize Calculator', exact: true }).click();
  expect((await win.boundingBox()).width).toBeCloseTo(before.width, 0);
  await page.getByRole('button', { name: 'Minimize Calculator', exact: true }).click(); await expect(win).toBeHidden();
  await open(page, 'calculator'); await expect(win).toBeVisible();
  const title = win.locator('.window-titlebar'); const rect = await title.boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + 20); await page.mouse.down(); await page.mouse.move(rect.x + rect.width / 2 - 70, rect.y + 75, { steps: 8 }); await page.mouse.up();
  expect((await win.boundingBox()).y).toBeGreaterThan(before.y);
  await page.getByRole('button', { name: 'Close Calculator', exact: true }).click();
  await page.getByRole('button', { name: 'Control Center', exact: true }).click();
  await page.getByRole('button', { name: 'Toggle dark mode', exact: true }).click(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await screenshot(page, info, 'desktop-dark'); await page.keyboard.press('Escape');
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.setViewportSize({ width: 800, height: 650 });
  const narrowDock = await dock.boundingBox(); expect(narrowDock.x).toBeGreaterThanOrEqual(0); expect(narrowDock.x + narrowDock.width).toBeLessThanOrEqual(800);
  await dock.getByRole('button', { name: 'Calculator', exact: true }).hover(); await page.waitForTimeout(250);
  const large = await dock.boundingBox(); expect(large.x).toBeGreaterThanOrEqual(0); expect(large.x + large.width).toBeLessThanOrEqual(800);
  await screenshot(page, info, 'narrow-desktop');
});

test('Finder, Notes, Code, Terminal and Trash share file content', async ({ page }, info) => {
  await cleanStart(page); await open(page, 'finder');
  const finder = page.getByRole('dialog', { name: 'Finder', exact: true });
  await finder.getByRole('button', { name: 'Documents', exact: true }).click();
  await finder.getByRole('option', { name: 'Hamid-CV.pdf', exact: true }).click();
  await expect(finder.getByRole('button', { name: 'Move selected file to Trash' })).toBeDisabled();
  await finder.getByRole('button', { name: 'Back', exact: true }).click(); await finder.getByRole('button', { name: 'Forward', exact: true }).click();
  await finder.getByRole('button', { name: 'Notes', exact: true }).click();
  await finder.getByRole('button', { name: 'List view' }).click(); await finder.getByRole('combobox', { name: 'Sort files' }).selectOption('modified');
  await finder.getByRole('button', { name: 'New Note', exact: true }).click();
  const note = page.getByRole('textbox', { name: 'Note content' }); await expect(note).toHaveValue('');
  await page.getByRole('textbox', { name: 'Note title' }).fill('یادداشت آزمایش'); await note.fill('متن مشترک');
  await note.selectText(); await page.getByRole('button', { name: 'Bold text' }).click(); await expect(note).toHaveValue('**متن مشترک**');
  await page.getByRole('button', { name: 'Preview formatted note' }).click(); await expect(page.locator('.note-preview strong')).toHaveText('متن مشترک');
  await screenshot(page, info, 'notes');
  await page.getByRole('button', { name: 'Open note in Code', exact: true }).click();
  const code = page.getByRole('textbox', { name: 'Code editor' }); await expect(code).toContainText('**متن مشترک**');
  await code.fill('sharedCode = 42;'); await code.press('End'); await code.press('Tab'); await code.press('a'); await expect(code).toHaveText('  sharedCode = 42;a');
  await screenshot(page, info, 'code');
  await open(page, 'finder'); await finder.getByRole('textbox', { name: 'Search files' }).fill('یادداشت آزمایش');
  const entry = finder.locator('.finder-files [role="option"]').first(); await entry.click();
  const filePath = await entry.getAttribute('title');
  await open(page, 'terminal'); const input = page.getByRole('textbox', { name: 'Terminal command' });
  await input.fill(`cat "${filePath}"`); await input.press('Enter'); await expect(page.locator('.terminal-scroll pre').last()).toHaveText('  sharedCode = 42;a');
  await input.fill(`rm "${filePath}"`); await input.press('Enter'); await expect(page.locator('.terminal-scroll pre').last()).toHaveText('Moved to Trash.');
  await open(page, 'trash'); await page.getByRole('button', { name: 'Put Back', exact: true }).click(); await expect(page.getByText('Trash is empty', { exact: true })).toBeVisible();
  await open(page, 'finder'); await expect(finder.locator('.finder-files [role="option"]').first()).toBeVisible();
  await screenshot(page, info, 'finder');
});

test('Calculator keyboard arithmetic and personal LinkedIn actions', async ({ page }, info) => {
  await cleanStart(page); await open(page, 'calculator'); await page.keyboard.type('0.1+0.2=');
  await expect(page.getByLabel('Calculator display')).toHaveText('0.3'); await page.keyboard.press('Escape'); await page.keyboard.type('5*2=='); await expect(page.getByLabel('Calculator display')).toHaveText('20');
  await screenshot(page, info, 'calculator'); await open(page, 'linkedin');
  const profile = page.getByRole('dialog', { name: 'LinkedIn', exact: true });
  await expect(profile.getByRole('heading', { name: 'Hamid Shaikhy', exact: true })).toBeVisible();
  await expect(profile.getByRole('link', { name: 'View on LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/hamid-shaikhy/');
  await expect(profile.getByRole('link', { name: 'Contact', exact: true })).toHaveAttribute('href', 'mailto:hamidshaikhy1382@gmail.com');
  await screenshot(page, info, 'linkedin');
});

test('PDF renders every supplied page, text layers, zoom, fit, thumbnails and download', async ({ page }, info) => {
  const errors=[]; page.on('pageerror', e => errors.push(e.message));
  await cleanStart(page); await open(page, 'resume');
  await expect(page.locator('.pdf-workspace .pdf-page[data-rendered="true"]')).toHaveCount(2);
  for (let i=1; i<=2; i++) {
    const sheet = page.locator(`.pdf-workspace .pdf-page[data-page="${i}"]`);
    expect(await sheet.locator('.textLayer').textContent()).toContain(i === 1 ? 'Front-End' : 'Online');
    expect(await sheet.locator('canvas').evaluate(c => { const values=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let count=0; for(let n=0;n<values.length;n+=400) if(values[n]<200) count++; return count; })).toBeGreaterThan(30);
  }
  await page.getByRole('button', { name: 'Next page', exact: true }).click(); await expect(page.locator('.pdf-page-count')).toHaveText('2 / 2');
  await page.getByRole('button', { name: 'Go to page 1', exact: true }).click(); await expect(page.locator('.pdf-page-count')).toHaveText('1 / 2');
  const before = await page.locator('.pdf-workspace .pdf-page').first().boundingBox(); await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(page.locator('.pdf-workspace .pdf-page[data-rendered="true"]')).toHaveCount(2);
  expect((await page.locator('.pdf-workspace .pdf-page').first().boundingBox()).width).toBeGreaterThan(before.width);
  await page.getByRole('button', { name: 'Fit page', exact: true }).click(); await page.getByRole('button', { name: 'Fit width', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Download original PDF' })).toHaveAttribute('download', 'Hamid-Shaikhy-CV.pdf');
  const original=await page.request.get('./assets/resume.pdf'); const data=await page.request.get('./assets/resume-data.txt'); expect(await data.body()).toEqual(await original.body());
  await screenshot(page, info, 'preview');
  await page.getByRole('button', { name: 'Close Preview', exact: true }).click(); await open(page, 'resume');
  await expect(page.locator('.pdf-workspace .pdf-page[data-rendered="true"]')).toHaveCount(2); expect(errors).toEqual([]);
});

test('supplied audio decodes after manual Play and remains shared across apps and lock', async ({ page }, info) => {
  await cleanStart(page); const audio=page.locator('#hamidos-audio'); await expect(audio).toHaveJSProperty('paused', true);
  const original=await page.request.get('./assets/audio/drowning-in-vertigo.mp3'); const data=await page.request.get('./assets/audio/track-data.txt');
  expect(createHash('sha256').update(await original.body()).digest('hex')).toBe(createHash('sha256').update(await data.body()).digest('hex'));
  await page.getByRole('button', { name: 'Control Center', exact: true }).click(); await page.getByRole('button', { name: 'Play music', exact: true }).click();
  await expect(audio).toHaveJSProperty('paused', false); await expect.poll(() => audio.evaluate(a=>a.currentTime)).toBeGreaterThan(1);
  if (await page.evaluate(() => typeof (window.AudioContext || window.webkitAudioContext) === 'function')) {
    await expect.poll(() => page.evaluate(() => { const analyser=window.__qaAnalyser; if(!analyser) return 0; const data=new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(data); return Math.max(...data.map(Math.abs)); })).toBeGreaterThan(.00001);
  } else info.annotations.push({ type: 'environment', description: 'This Windows WebKit binary has no Web Audio API. Native MP3 decoding, progressing playback, seeking and duration are verified.' });
  expect(await audio.evaluate(a=>a.error?.message || null)).toBeNull(); expect(await audio.evaluate(a=>a.duration)).toBeCloseTo(283.48,0);
  await page.getByRole('button', { name: 'Mute music' }).click(); await expect(audio).toHaveJSProperty('muted', true); await page.getByRole('button', { name: 'Unmute music' }).click(); await expect(audio).toHaveJSProperty('muted', false);
  await page.getByRole('slider', { name: 'Track position' }).evaluate(input=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'90');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});
  await expect.poll(() => audio.evaluate(a=>a.currentTime)).toBeGreaterThan(89);
  await page.keyboard.press('Escape'); await open(page,'chess'); await expect(page.getByRole('button',{name:'Pause game music'})).toBeVisible();
  await page.getByRole('button',{name:'Apple menu',exact:true}).click(); await page.getByRole('menuitem',{name:/Lock Screen/}).click(); await expect(audio).toHaveJSProperty('paused',false);
  await page.getByRole('button',{name:/Enter HamidOS/}).click();
  await page.getByRole('button', { name: 'Control Center', exact: true }).click(); await page.getByRole('button',{name:'Stop music'}).click(); await expect(audio).toHaveJSProperty('paused',true); await expect.poll(() => audio.evaluate(a=>a.currentTime)).toBeLessThan(.1);
  await screenshot(page,info,'music');
});

for (const size of [{ width:390,height:844 }, { width:375,height:667 }, { width:320,height:568 }, { width:667,height:375 }]) {
  test(`phone ${size.width}×${size.height}: every app fits, PDF and controls remain usable`, async ({ page }, info) => {
    await page.setViewportSize(size); await page.goto('./'); await expect(page.locator('.ios-home')).toBeVisible();
    expect(await page.locator('.ios-dock button').count()).toBe(4);
    await screenshot(page,info,`phone-${size.width}-home`);
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    for (const id of Object.keys(labels)) {
      await open(page,id,true);
      if(id==='calculator') { await page.getByRole('button',{name:'7',exact:true}).click(); await page.getByRole('button',{name:'+',exact:true}).click(); await page.getByRole('button',{name:'2',exact:true}).click(); await page.getByRole('button',{name:'=',exact:true}).click(); await expect(page.getByLabel('Calculator display')).toHaveText('9'); }
      if(id==='resume') { await expect(page.locator('.pdf-workspace .pdf-page[data-rendered="true"]')).toHaveCount(2); await page.getByRole('button',{name:'Next page',exact:true}).click(); await expect(page.locator('.pdf-page-count')).toHaveText('2 / 2'); }
      if(id==='chess') { await page.getByRole('button',{name:'2 players',exact:true}).click(); await page.getByRole('button',{name:'e2 white pawn',exact:true}).click(); await page.getByRole('button',{name:'e4 legal move',exact:true}).click(); await expect(page.locator('.chess-status')).toContainText('Black to move'); }
      await screenshot(page,info,`phone-${size.width}-${id}`);
      const content = await page.locator('.ios-app-content').evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth}));
      expect(content.scroll,`${id} outer horizontal overflow`).toBeLessThanOrEqual(content.width+1);
      await expect(page.getByRole('button',{name:'Back to home',exact:true})).toBeVisible();
    }
    await page.getByRole('button',{name:'Back to home',exact:true}).click();
    await page.getByRole('button',{name:'Open Control Center',exact:true}).click(); await screenshot(page,info,`phone-${size.width}-control`);
    await page.getByRole('button',{name:'Play music',exact:true}).click(); await expect.poll(() => page.locator('audio').evaluate(a=>a.currentTime)).toBeGreaterThan(.2);
    await page.getByRole('button',{name:'Done',exact:true}).click(); await page.getByRole('button',{name:'Lock screen',exact:true}).click(); await expect(page.getByRole('button',{name:'Pause music',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Pause music',exact:true}).click(); await expect(page.locator('audio')).toHaveJSProperty('paused',true);
    await page.getByRole('button',{name:'Unlock',exact:true}).click(); await expect(page.locator('.ios-home')).toBeVisible(); expect(errors).toEqual([]);
  });
}

test('Safari history, Spotlight, Launchpad and saved Settings actions', async ({ page }, info) => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await cleanStart(page); const dock=page.getByRole('navigation',{name:'Dock',exact:true});
  await dock.getByRole('button',{name:'Safari',exact:true}).click();
  const safari=page.getByRole('dialog',{name:'Safari',exact:true});
  await safari.getByRole('navigation',{name:'Safari bookmarks'}).getByRole('button',{name:'About',exact:true}).click();
  await expect(safari.getByRole('heading',{name:/ایده‌های خوب/})).toBeVisible();
  await safari.getByRole('button',{name:'Go back',exact:true}).click();await expect(safari.getByRole('heading',{name:'Favorites',exact:true})).toBeVisible();
  await safari.getByRole('button',{name:'Go forward',exact:true}).click();
  const address=safari.getByRole('textbox',{name:'Website address'});
  await address.fill('javascript:alert(1)');await address.press('Enter');await expect(safari.getByRole('alert')).toBeVisible();
  await address.fill('https://dikaasia.com/');await address.press('Enter');await expect(safari.getByRole('link',{name:'Open Website',exact:true})).toHaveAttribute('href','https://dikaasia.com/');
  await screenshot(page,info,'safari');
  await page.getByRole('button',{name:'Spotlight',exact:true}).click();
  await page.getByRole('textbox',{name:'Search apps'}).fill('LinkedIn');await page.keyboard.press('Enter');await expect(page.getByRole('dialog',{name:'LinkedIn',exact:true})).toBeVisible();
  await dock.getByRole('button',{name:'Launchpad',exact:true}).click();await page.getByRole('textbox',{name:'Search Launchpad'}).fill('Calculator');await page.getByRole('dialog',{name:'Launchpad'}).getByRole('button',{name:'Calculator',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Calculator',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'File',exact:true}).click();await page.getByRole('menuitem',{name:/^New Note/}).click();await expect(page.getByRole('textbox',{name:'Note content'})).toHaveValue('');
  await open(page,'settings');const settings=page.getByRole('dialog',{name:'Settings',exact:true});
  await settings.getByRole('button',{name:'Dark',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await settings.getByRole('checkbox',{name:'Focus',exact:true}).check();
  await settings.getByRole('button',{name:'Dock & Motion',exact:true}).click();await settings.getByRole('checkbox',{name:'Magnification',exact:true}).uncheck();await settings.getByRole('checkbox',{name:'Reduce Motion',exact:true}).check();
  await expect(page.getByTestId('os-root')).toHaveClass(/reduce-motion/);await screenshot(page,info,'settings-dark');
  await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await expect(page.getByTestId('os-root')).toHaveClass(/focus-mode/);await expect(page.getByTestId('os-root')).toHaveClass(/reduce-motion/);
  await open(page,'settings');await settings.getByRole('button',{name:'Wallpaper',exact:true}).click();await settings.getByRole('button',{name:'Catalina · Dynamic',exact:true}).click();await expect(settings.getByRole('button',{name:'Catalina · Dynamic',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await settings.getByRole('button',{name:'Appearance',exact:true}).click();await settings.getByRole('button',{name:'Light',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');expect(errors).toEqual([]);
});

test('touch phone preserves the phone shell when rotated to 844×390', async ({ browser }, info) => {
  const context=await browser.newContext({baseURL:info.project.use.baseURL || process.env.HAMIDOS_TEST_URL || 'http://127.0.0.1:5180/',hasTouch:true,isMobile:true,viewport:{width:390,height:844}});
  const page=await context.newPage();
  await page.goto('./');await expect(page.locator('.ios-home')).toBeVisible();await page.setViewportSize({width:844,height:390});
  await expect(page.getByTestId('os-root')).toHaveClass(/mobile/);await expect(page.locator('.ios-dock button')).toHaveCount(4);
  const dock=await page.locator('.ios-dock').boundingBox();expect(dock.y+dock.height).toBeLessThanOrEqual(390);
  await screenshot(page,info,'phone-844-home');await open(page,'calculator',true);await page.keyboard.type('2+3=');await expect(page.getByLabel('Calculator display')).toHaveText('5');await screenshot(page,info,'phone-844-calculator');
  await page.setViewportSize({width:390,height:844});await expect(page.getByLabel('Calculator display')).toHaveText('5');await page.getByRole('button',{name:'Back to home',exact:true}).click();await expect(page.locator('.ios-home')).toBeVisible();
  await context.close();
});

test('phone Safari navigation, addresses and resume actions in all target sizes', async ({ page }, info) => {
  for(const size of [{width:390,height:844},{width:375,height:667},{width:320,height:568},{width:667,height:375}]) {
    await page.setViewportSize(size);await page.goto('./');await open(page,'safari',true);
    const safari=page.locator('.safari-app');
    await safari.getByRole('navigation',{name:'Safari bookmarks'}).getByRole('button',{name:'About',exact:true}).click();await expect(safari.getByRole('heading',{name:/ایده‌های خوب/})).toBeVisible();
    await safari.getByRole('button',{name:'Go back',exact:true}).click();await expect(safari.getByRole('heading',{name:'Favorites',exact:true})).toBeVisible();
    const address=safari.getByRole('textbox',{name:'Website address'});await address.fill('https://dikaasia.com/');await address.press('Enter');await expect(safari.getByRole('link',{name:'Open Website',exact:true})).toHaveAttribute('href','https://dikaasia.com/');
    const bounds=await page.locator('.ios-app-content').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));expect(bounds.scroll).toBeLessThanOrEqual(bounds.width+1);
    await screenshot(page,info,`phone-${size.width}-safari`);
    await safari.getByRole('navigation',{name:'Safari bookmarks'}).getByRole('button',{name:'Résumé',exact:true}).click();await safari.getByRole('button',{name:'Read in Preview',exact:true}).click();await expect(page.locator('.pdf-workspace .pdf-page[data-rendered="true"]')).toHaveCount(2);
  }
});

