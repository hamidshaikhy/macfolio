import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

const names = ['Flow Studio', 'Barg', 'Tanpoosh', 'Dika Asia', 'Financial Panel', 'Macfolio'];
const problems = new WeakMap();
test.beforeEach(async ({ page }) => {
  await page.context().route('**/_vercel/insights/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
  const found = []; problems.set(page, found);
  page.on('pageerror', error => found.push(error.message));
  page.on('response', response => { if (response.url().includes('127.0.0.1') && response.status() >= 400) found.push(`${response.status()} ${response.url()}`); });
});
test.afterEach(async ({ page }) => { expect(problems.get(page)).toEqual([]); });
async function navigate(page, section) {
  await expect(page.locator('.pf-experience')).toHaveAttribute('data-measured','true');
  const menu=page.getByRole('button',{name:'Open navigation',exact:true});
  if(await menu.isVisible())await menu.click();
  const navigation=page.locator('.pf-nav > nav');
  await navigation.getByRole('link', { name: section, exact: true }).click();
  await expect(navigation.getByRole('link', { name: section, exact: true,includeHidden:true })).toHaveAttribute('aria-current', 'location');
}
async function screenshot(page, info, name) {
  await fs.mkdir('artifacts/portfolio-tests', { recursive: true });
  await page.screenshot({ path: `artifacts/portfolio-tests/${info.project.name}-${name}.png` });
}

test('standalone production route, section history, real English PDF and isolated shell', async ({ page, request }) => {
  const response = await page.goto('/portfolio#work');
  expect(response.status()).toBe(200);
  await expect(page).toHaveTitle('Hamid Shaikhy — Front-End Developer');
  await expect(page.locator('.os-root, .ios-shell, audio')).toHaveCount(0);
  await expect(page.locator('.pf-project-copy h3')).toHaveText('Flow Studio');
  await expect(page.locator('#work')).toBeInViewport();
  await page.reload();
  await expect(page.locator('#work')).toBeInViewport();
  await navigate(page, 'Stack');
  await navigate(page, 'Profile');
  await page.goBack();
  await expect(page).toHaveURL(/#stack$/);
  await expect(page.locator('#stack')).toBeInViewport();
  await page.goForward();
  await expect(page).toHaveURL(/#profile$/);
  const pdf = await request.get('/assets/portfolio/resume-Hamid-Shaikhy.pdf');
  expect(pdf.status()).toBe(200);
  const original = await fs.readFile('public/assets/portfolio/resume-Hamid-Shaikhy.pdf');
  expect(createHash('sha256').update(await pdf.body()).digest('hex')).toBe(createHash('sha256').update(original).digest('hex'));
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download résumé', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('Hamid-Shaikhy-Resume.pdf');
  expect(await page.locator('.pf-experience').innerText()).not.toMatch(/[\u0600-\u06ff]/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/assets\/portfolio\/portrait.webp$/);
});

test('About opens automatically and Safari keeps its own history when opened manually', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.locator('.app-about .pf-hero h1')).toContainText('HAMID');
  await expect(page.locator('.os-window')).toHaveCount(1);await expect(page.locator('.app-safari')).toHaveCount(0);
  const detached=page.waitForEvent('popup');await page.getByRole('link',{name:'OPEN FULL PORTFOLIO',exact:true}).click();const portfolio=await detached;await expect(portfolio.locator('.pf-standalone')).toBeVisible();await portfolio.close();
  await page.getByRole('button',{name:'Close About Hamid',exact:true}).click();
  await page.getByRole('navigation',{name:'Dock',exact:true}).getByRole('button',{name:'Safari',exact:true}).click();
  const safari = page.getByRole('dialog', { name: 'Safari', exact: true });
  await expect(safari.getByRole('heading',{name:'Favorites',exact:true})).toBeVisible();
  await expect(safari.getByRole('button',{name:'Go back',exact:true})).toBeDisabled();
  await safari.locator('.safari-favorites').getByRole('button',{name:'Portfolio',exact:true}).click();
  await expect(safari.locator('.pf-hero h1')).toContainText('HAMID');
  const address = safari.getByRole('textbox', { name: 'Website address' });
  await expect(address).toHaveValue(/\/portfolio$/);
  await expect(safari.getByRole('button', { name: 'Go back', exact: true })).toBeEnabled();
  await navigate(page, 'Profile');
  await expect(address).toHaveValue(/#profile$/);
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await safari.getByRole('button', { name: 'Reload page', exact: true }).click();
  await expect(safari.locator('#profile')).toBeInViewport();
  await safari.getByRole('button', { name: 'Go back', exact: true }).click();
  await expect(address).toHaveValue(/\/portfolio$/);
  await expect.poll(() => safari.locator('.pf-scroll').evaluate(el => el.scrollTop)).toBe(0);
  await safari.getByRole('button', { name: 'Go forward', exact: true }).click();
  await expect(address).toHaveValue(/#profile$/);
  await safari.getByRole('navigation', { name: 'Safari bookmarks' }).getByRole('button', { name: 'Start Page', exact: true }).click();
  await expect(safari.getByRole('heading', { name: 'Favorites', exact: true })).toBeVisible();
  await safari.getByRole('button', { name: 'Go back', exact: true }).click();
  await expect(safari.locator('#profile')).toBeInViewport();
  await safari.getByRole('button', { name: 'Safari homepage', exact: true }).click();
  await expect(safari.getByRole('heading',{name:'Favorites',exact:true})).toBeVisible();
  await screenshot(page, info, 'automatic-safari');
  const popup = page.waitForEvent('popup');
  await safari.getByRole('navigation', { name: 'Safari bookmarks' }).getByRole('link', { name: 'Open full portfolio', exact: true }).click();
  const full = await popup; await full.waitForLoadState();
  await expect(full.locator('.pf-standalone')).toBeVisible();
  await full.close();
  await page.getByRole('navigation', { name: 'Dock', exact: true }).getByRole('button', { name: 'Calculator', exact: true }).click();
  await expect(page.getByLabel('Calculator display')).toBeVisible();
  await page.keyboard.type('12*3=');
  await expect(page.getByLabel('Calculator display')).toHaveText('36');
});

test('scroll scenes, every case study, bounded focus and screenshot gallery', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/portfolio#work');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.pf-work-pinned')).toBeVisible();
  for (let i=0;i<names.length;i++) {
    await page.getByRole('button', { name: `Show ${names[i]}`, exact: true }).click();
    await expect(page.locator('.pf-project-copy h3')).toHaveText(names[i]);
    const trigger = page.getByRole('button', { name: 'Read case study', exact: true });
    // Chromium's automated scroll-to-element can move a sticky ancestor.
    // Measure the position after that navigation, at the actual click location.
    await trigger.scrollIntoViewIfNeeded();
    const before = await page.locator('.pf-scroll').evaluate(el => el.scrollTop);
    await trigger.click();
    const dialog = page.locator('.pf-case');
    await expect(dialog.getByRole('heading', { level: 2 })).toContainText(names[i]);
    await expect(dialog.getByRole('button', { name: 'Close case study' })).toBeFocused();
    await expect(page.locator('.pf-scroll')).toHaveAttribute('inert','');
    await page.keyboard.press('Shift+Tab');
    await expect(dialog.getByRole('button', { name: 'Back to selected work' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Close case study' })).toBeFocused();
    if(i<5) {
      await dialog.getByRole('button', { name: 'Next screenshot' }).click();
      await expect(dialog.locator('.pf-shot-controls')).toContainText('2 / 3');
      await expect.poll(() => dialog.locator('.pf-case-figure > img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    }
    await dialog.locator('.pf-case-scroll').evaluate(el => el.scrollTop = el.scrollHeight);
    await expect(dialog.getByRole('heading', { name: 'Details that make it work.' })).toBeVisible();
    if(i===1) await screenshot(page, info, 'case-study');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect.poll(() => page.locator('.pf-scroll').evaluate(el=>el.scrollTop)).toBe(before);
  }
  await page.reload();
  await expect(page.locator('.pf-project-copy h3')).toHaveText('Flow Studio');
  await expect(page.locator('#work')).toBeInViewport();
  await page.locator('.pf-scroll').evaluate(el => {
    const work=el.querySelector('#work');
    const start=work.getBoundingClientRect().top-el.getBoundingClientRect().top+el.scrollTop;
    el.scrollTop=start-90+(work.offsetHeight-el.clientHeight+90)*.37;
  });
  await expect(page.locator('.pf-project-copy h3')).toHaveText('Tanpoosh');
  await page.locator('.pf-project-scene').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.pf-project-copy h3')).toHaveText('Dika Asia');
  await expect(page.locator('.pf-project-links').getByRole('link', { name: 'Live website' })).toHaveAttribute('href','https://dikaasia.com/');
  await screenshot(page, info, 'project-scene');
});

test('narrow Safari container, resize, maximize, minimize and reopen', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('.app-about .pf-hero h1')).toBeVisible();
  await page.getByRole('button',{name:'Close About Hamid',exact:true}).click();
  await page.getByRole('navigation',{name:'Dock',exact:true}).getByRole('button',{name:'Safari',exact:true}).click();
  const safari = page.getByRole('dialog', { name: 'Safari', exact: true });
  await expect(safari.getByRole('heading',{name:'Favorites',exact:true})).toBeVisible();
  await safari.getByRole('navigation',{name:'Safari bookmarks'}).getByRole('button',{name:'Portfolio',exact:true}).click();
  await expect(safari.locator('.pf-hero h1')).toBeVisible();
  const original = await safari.boundingBox();
  const handle = await safari.getByRole('separator', { name: 'Resize window' }).boundingBox();
  await page.mouse.move(handle.x+5,handle.y+5); await page.mouse.down();
  await page.mouse.move(handle.x+5+640-original.width,handle.y+5+605-original.height,{steps:10}); await page.mouse.up();
  await expect.poll(async () => Math.round((await safari.boundingBox()).width)).toBe(640);
  await navigate(page,'Work');
  await expect(safari.locator('.pf-work-pinned')).toHaveCount(1);
  const short=await safari.locator('.pf-experience').evaluate(el=>el.classList.contains('pf-short'));
  expect(await safari.locator('.pf-project-scene').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(short?2:1);
  expect(await safari.locator('.pf-scroll').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await page.getByRole('button',{name:'Show Barg',exact:true}).click();
  await page.getByRole('button',{name:'Read case study',exact:true}).click();
  const modal=await page.locator('.pf-case').boundingBox(), container=await safari.locator('.safari-content').boundingBox();
  expect(modal.x).toBeGreaterThanOrEqual(container.x); expect(modal.y).toBeGreaterThanOrEqual(container.y);
  expect(modal.x+modal.width).toBeLessThanOrEqual(container.x+container.width);
  expect(modal.y+modal.height).toBeLessThanOrEqual(container.y+container.height);
  await screenshot(page,info,'small-safari-case');
  await page.keyboard.press('Escape');
  const position=await safari.locator('.pf-scroll').evaluate(el=>el.scrollTop);
  await page.getByRole('button',{name:'Minimize Safari',exact:true}).click(); await expect(safari).toBeHidden();
  await page.getByRole('navigation',{name:'Dock',exact:true}).getByRole('button',{name:'Safari',exact:true}).click();
  expect(await safari.locator('.pf-scroll').evaluate(el=>el.scrollTop)).toBe(position);
  await page.getByRole('button',{name:'Maximize Safari',exact:true}).click();
  await expect(safari.locator('.pf-work-pinned')).toHaveCount(1);
  await page.getByRole('button',{name:'Maximize Safari',exact:true}).click();
  await expect(safari.locator('.pf-work-pinned')).toHaveCount(1);
  await page.getByRole('button',{name:'Close Safari',exact:true}).click();
  await page.getByRole('navigation',{name:'Dock',exact:true}).getByRole('button',{name:'Safari',exact:true}).click();
  await expect(safari.getByRole('heading',{name:'Favorites',exact:true})).toBeVisible();
});

test('touch-sized standalone and mobile shell keep every section usable', async ({ page }, info) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/portfolio');
  await page.getByRole('button',{name:'Inspect portrait',exact:true}).click();
  await expect(page.getByRole('button',{name:'Close inspection',exact:true})).toHaveAttribute('aria-pressed','true');
  await navigate(page,'Stack');
  await page.getByRole('button',{name:/TypeScript.*TYPE SYSTEM/}).click();
  await expect(page.locator('.pf-module-description h3')).toHaveText('TypeScript');
  await navigate(page,'Work');
  await page.getByRole('button',{name:'Show Tanpoosh',exact:true}).click();
  await expect(page.locator('.pf-project-copy h3')).toHaveText('Tanpoosh');
  await screenshot(page,info,'mobile-work');
  await navigate(page,'Contact');
  await expect(page.locator('.pf-contact-action a')).toHaveAttribute('href','/?view=desktop');
  for(const width of [320,390,640]) {
    await page.setViewportSize({width,height:844});
    expect(await page.locator('.pf-scroll').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.locator('.ios-app.app-about .pf-hero h1')).toBeVisible();
  await navigate(page,'Work');
  await page.getByRole('button',{name:'Show Barg',exact:true}).click();
  await page.getByRole('button',{name:'Read case study',exact:true}).click();
  await expect(page.locator('.pf-case h2')).toContainText('Barg');
  await page.getByRole('button',{name:'Close case study'}).click();
  await page.getByRole('button',{name:'Back to home',exact:true}).click();
  await expect(page.locator('.ios-home')).toBeVisible();
});

test('reduced motion and unavailable canvas have useful fallbacks with a fixed reference palette', async ({ page }, info) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
  await page.goto('/portfolio#profile');
  await expect(page.locator('.pf-reduced-motion')).toBeVisible();
  await expect(page.locator('.pf-work-pinned')).toHaveCount(0);
  await expect(page.locator('.pf-bio-card')).toHaveCSS('opacity','1');
  await expect(page.getByRole('button',{name:/Switch portfolio/})).toHaveCount(0);
  await expect(page.locator('.pf-experience')).toHaveAttribute('data-theme','light');
  await screenshot(page,info,'fixed-profile');
  await page.reload();
  await expect(page.locator('.pf-experience')).toHaveAttribute('data-theme','light');
  await navigate(page,'Home');
  await expect(page.locator('.pf-photo')).toBeVisible();
  await page.getByRole('button',{name:'Inspect portrait',exact:true}).click();
  await expect(page.locator('.pf-circuit')).toHaveCSS('opacity','1');
  await expect(page.locator('.pf-circuit > img')).toBeVisible();
  await page.goto('/');
  await expect(page.locator('.pf-experience')).toHaveAttribute('data-theme','light');
});

test('portrait pointer reveal and real copy-email feedback', async ({ page, context, browserName }) => {
  if(browserName==='chromium') await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/portfolio');
  await expect(page.locator('.pf-portrait-canvas')).toHaveAttribute('data-ready','true');
  const portrait=await page.locator('.pf-portrait').boundingBox();
  await page.mouse.move(portrait.x+portrait.width*.5,portrait.y+portrait.width*.3);
  await expect.poll(()=>page.locator('.pf-portrait').evaluate(el=>Number(el.style.getPropertyValue('--reveal-opacity')))).toBeGreaterThan(.95);
  expect(await page.locator('.pf-portrait').evaluate(el=>el.style.getPropertyValue('--reveal-x'))).not.toBe('');
  await navigate(page,'Contact');
  await page.getByRole('button',{name:'Copy email address'}).click();
  if(browserName==='chromium') {
    await expect(page.getByRole('status')).toHaveText('Email copied.');
    expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('hamidshaikhy1382@gmail.com');
  } else await expect(page.getByRole('status')).toHaveText(/Email copied\.|Select the address/);
});

test('profile assembles on scroll, counters count up and journey changes with scrolling', async ({ page }, info) => {
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/portfolio');
  await expect(page.locator('.pf-scenes')).toBeVisible();
  await expect(page.locator('[data-counter-target]').first()).toHaveText('0');
  const before=await page.locator('.pf-bio-card').evaluate(el=>getComputedStyle(el).transform);
  await navigate(page,'Profile');
  await expect.poll(()=>page.locator('.pf-bio-card').evaluate(el=>getComputedStyle(el).transform)).not.toBe(before);
  for(const target of [6,12,2,99])await expect(page.locator(`[data-counter-target="${target}"]`)).toHaveText(String(target));
  await screenshot(page,info,'assembled-profile');
  await navigate(page,'Journey');
  await expect(page.locator('.pf-journey-card.is-active h3')).toHaveText('Front-End Developer');
  await page.locator('.pf-scroll').evaluate(el=>{
    const scene=el.querySelector('#journey'),start=scene.getBoundingClientRect().top-el.getBoundingClientRect().top+el.scrollTop;
    el.scrollTop=start-96+(scene.offsetHeight-el.clientHeight+96)*.45;
  });
  await expect(page.locator('.pf-journey-card.is-active h3')).toHaveText('B.Sc. in Computer Engineering');
  await expect(page.locator('.pf-journey-card.is-active')).not.toHaveAttribute('inert');
  await page.getByRole('button',{name:'Next journey entry'}).click();
  await expect(page.locator('.pf-journey-card.is-active h3')).toHaveText('Building Personal Products');
  await expect(page.locator('.pf-node-in')).toHaveText('03');
  await expect(page.locator('.pf-node-in')).toHaveCSS('animation-name','pf-node-in');
  await expect(page.locator('.pf-node-out')).toHaveCSS('animation-name','pf-node-out');
  await expect(page.locator('.pf-journey-card.is-active h3')).toHaveCSS('font-weight','700');
});

test('desktop hero fills its viewport and keeps the approved arm chips below the header', async ({ page }) => {
  for (const [width,height,route] of [[1366,768,'/portfolio'],[1900,900,'/portfolio'],[1920,600,'/portfolio'],[2560,1440,'/portfolio'],[1440,1000,'/']]) {
    await page.setViewportSize({width,height});
    await page.goto(route);
    await expect(page.locator('.pf-experience')).toHaveAttribute('data-measured','true');
    await page.evaluate(()=>document.fonts.ready);
    const box=await page.evaluate(()=>{
      const r=selector=>document.querySelector(selector).getBoundingClientRect().toJSON();
      return {port:r('.pf-experience'),hero:r('.pf-hero'),nav:r('.pf-nav'),portrait:r('.pf-portrait'),caption:r('.pf-portrait-caption'),copy:r('.pf-hero-copy'),systems:r('.pf-hero-systems'),profile:r('.pf-profile')};
    });
    expect(box.hero.height).toBeCloseTo(box.port.height,1);
    expect(box.profile.top).toBeCloseTo(box.hero.bottom,1);
    // Landmarks in the approved 2:3 texture: hair begins at 2%, both arm chips end by 62%.
    expect(box.portrait.top+box.portrait.height*.02).toBeGreaterThan(box.nav.bottom+12);
    const chipBottom=box.portrait.top+box.portrait.height*.62;
    expect(chipBottom).toBeLessThan(box.hero.bottom-25);
    expect(chipBottom).toBeLessThan(box.caption.top);
    expect(box.caption.bottom).toBeLessThan(box.hero.bottom);
    expect(box.copy.bottom).toBeLessThan(box.hero.bottom-30);
    expect(box.systems.bottom).toBeLessThan(box.hero.bottom-5);
    expect(box.portrait.width).toBeGreaterThan(Math.min(box.port.width*.38,box.port.height*.7));
    // Keyboard inspection must remain reachable after the image is repositioned.
    await page.getByRole('button',{name:'Inspect portrait',exact:true}).click();
    await expect.poll(()=>page.locator('.pf-portrait').evaluate(el=>Number(el.style.getPropertyValue('--lock-reveal')))).toBe(1);
  }
});

test('mechanical portrait includes a real body texture and survives graphics context loss', async ({ page }) => {
  await page.goto('/portfolio');
  const canvas=page.locator('.pf-portrait-canvas');
  await expect(canvas).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Inspect portrait',exact:true}).click();
  await expect.poll(()=>page.locator('.pf-portrait').evaluate(el=>Number(el.style.getPropertyValue('--lock-reveal')))).toBeGreaterThan(.1);
  expect(await page.locator('.pf-portrait').evaluate(el=>Number(el.style.getPropertyValue('--lock-reveal')))).toBeLessThan(.99);
  await expect.poll(()=>page.locator('.pf-portrait').evaluate(el=>Number(el.style.getPropertyValue('--lock-reveal')))).toBe(1);
  await expect(page.locator('.pf-portrait')).toHaveClass(/is-inspected/);
  await canvas.evaluate(el=>el.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
  await expect(page.locator('.pf-portrait')).not.toHaveClass(/is-webgl/);
  await expect(page.locator('.pf-circuit > img')).toBeVisible();
  await expect(page.locator('.pf-circuit > img')).toHaveAttribute('src',/hamid-hardware-1024-v6.webp$/);
  await expect.poll(()=>page.locator('.pf-circuit > img').evaluate(img=>img.complete&&img.naturalHeight/img.naturalWidth)).toBeCloseTo(1.5,2);
  await page.getByRole('button',{name:'Close inspection',exact:true}).click();
  await expect(page.locator('.pf-photo')).toBeVisible();
});

test('whole project card opens, bracket cursor replaces the native cursor and external links stay usable',async({page})=>{
  await page.setViewportSize({width:1180,height:694});await page.goto('/portfolio#work');
  const button=page.getByRole('button',{name:'Read case study',exact:true});
  await expect(button).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  const card=await page.locator('.pf-project-scene').boundingBox();
  await page.mouse.move(card.x+card.width*.65,card.y+card.height*.28);
  await expect(page.locator('.pf-cursor')).toHaveClass(/is-project/);
  await expect(button).toHaveCSS('cursor','none');
  await expect.poll(()=>page.locator('.pf-cursor').evaluate(el=>getComputedStyle(el,'::before').width)).toBe('84px');
  expect(await page.locator('.pf-project-copy h3').evaluate(el=>Number.parseFloat(getComputedStyle(el).fontSize))).toBeCloseTo(44.84,1);
  await page.mouse.click(card.x+card.width*.2,card.y+card.height*.3);
  await expect(page.locator('.pf-case h2')).toContainText('Flow Studio');await page.keyboard.press('Escape');
  await expect(button).toBeFocused();await expect(page.locator('.pf-case-button svg')).toHaveCount(0);
  const github=page.locator('.pf-project-links a').first();
  expect(await github.evaluate(el=>{const box=el.getBoundingClientRect();return el.contains(document.elementFromPoint(box.x+box.width/2,box.y+box.height/2));})).toBe(true);
});

test('rail measures the complete scroll, resume downloads only on click and cards begin outside the frame',async({page})=>{
  const downloads=[];page.on('download',download=>downloads.push(download));
  await page.goto('/portfolio');await expect(page.locator('.pf-scenes')).toBeVisible();
  await expect.poll(()=>page.locator('.pf-experience').evaluate(el=>Number(el.style.getPropertyValue('--page-fraction')))).toBe(0);
  expect(await page.locator('.pf-bio-card').evaluate(el=>el.getBoundingClientRect().right)).toBeLessThan(0);
  await navigate(page,'Profile');await expect(page.locator('[data-counter-target="99"]')).toHaveText('99');
  await expect(page.locator('.pf-stat-value strong small')).toHaveText(['+','+','+','%']);
  await expect(page.locator('.pf-hud')).toHaveCSS('opacity','1');
  const label=await page.locator('.pf-stat-value > span').first().evaluate(el=>({right:el.getBoundingClientRect().right,parentRight:el.parentElement.getBoundingClientRect().right}));
  expect(label.right).toBeCloseTo(label.parentRight,0);
  expect(downloads).toHaveLength(0);
  const download=page.waitForEvent('download');await page.getByRole('link',{name:'Download résumé',exact:true}).click();
  expect((await download).suggestedFilename()).toBe('Hamid-Shaikhy-Resume.pdf');expect(downloads).toHaveLength(1);
  await page.locator('.pf-scroll').evaluate(el=>el.scrollTop=el.scrollHeight);
  await expect.poll(()=>page.locator('.pf-experience').evaluate(el=>Number(el.style.getPropertyValue('--page-fraction')))).toBe(1);
  const geometry=await page.locator('.pf-section-rail > i').evaluate(el=>({end:el.getBoundingClientRect().bottom,dot:el.firstElementChild.getBoundingClientRect().top+3}));
  expect(geometry.dot).toBeCloseTo(geometry.end,0);
  const gradient=await page.locator('.pf-page-progress').evaluate(el=>getComputedStyle(el).backgroundImage);
  await expect(page.locator('.pf-hud')).toHaveCSS('opacity','0');
  expect(gradient).toContain('rgb(98, 245, 183)');expect(gradient).toContain('rgb(84, 217, 255)');
});

test('footer preserves signature, correct logo shapes, rolling links and an unbroken repeating track',async({page})=>{
  await page.setViewportSize({width:1180,height:694});await page.goto('/portfolio#contact');
  await expect(page.locator('.pf-signature')).toHaveAttribute('src',/hamid-signature-v3.webp$/);
  await expect.poll(()=>page.locator('.pf-signature').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  await expect(page.locator('.pf-contact h2')).toHaveText('YOU IMAGINE,I DELIVER.');
  await expect(page.locator('.pf-contact h2 > span')).toHaveCSS('color','rgb(174, 203, 37)');
  await expect(page.getByRole('link',{name:'Telegram',exact:true})).toHaveAttribute('href','https://t.me/hamid_2_sh');
  await expect(page.getByRole('link',{name:'WhatsApp',exact:true})).toHaveAttribute('href','https://wa.me/hamid_2_sh');
  await expect(page.locator('.pf-contact-shape-wide path')).toHaveAttribute('d',/H450C475 42 477 0 500 0H700/);
  const signature=await page.locator('.pf-signature').boundingBox(),title=await page.locator('.pf-contact h2').boundingBox();
  expect(signature.y+signature.height).toBeLessThan(title.y+12);
  await expect(page.locator('.pf-contact-pages a').first()).toHaveCSS('color','rgb(246, 247, 242)');
  expect(await page.locator('.pf-contact-person').evaluate(el=>Number(getComputedStyle(el).zIndex))).toBeGreaterThan(await page.locator('.pf-contact-marquee').evaluate(el=>Number(getComputedStyle(el).zIndex)));
  await expect(page.locator('.pf-marquee-set')).toHaveCount(4);
  await expect(page.locator('.pf-marquee-set').first().locator('svg text')).toHaveText(['TS','JS']);
  const track=page.locator('.pf-contact-marquee > div');
  expect(await track.evaluate(el=>el.scrollWidth)).toBeGreaterThan(1180*3);
  const samples=await track.evaluate(el=>{const animation=el.getAnimations()[0];animation.pause();const sample=time=>{animation.currentTime=time;return [...el.querySelectorAll('.pf-marquee-set > span')].map(item=>({name:item.textContent,x:item.getBoundingClientRect().x})).filter(item=>item.x>20&&item.x<1180).sort((a,b)=>a.x-b.x)[0];};return[sample(23999),sample(24001)];});
  expect(samples[0].name).toBe(samples[1].name);expect(Math.abs(samples[0].x-samples[1].x)).toBeLessThan(2);
  const home=page.getByRole('navigation',{name:'Footer sections'}).getByRole('link',{name:'Home',exact:true});await home.hover();
  await expect.poll(()=>home.locator('.pf-roll-letter > span').first().evaluate(el=>getComputedStyle(el).transform)).not.toBe('none');
});

test('ten-second idle zigzag is exclusive to the hero and pointer movement immediately takes control',async({page})=>{
  await page.goto('/portfolio');await expect(page.locator('.pf-portrait-canvas')).toHaveAttribute('data-ready','true');
  await expect(page.locator('.pf-hud')).toHaveCSS('opacity','0');
  await expect(page.locator('.pf-hero-actions,.pf-hero-scroll')).toHaveCount(0);
  await expect(page.locator('.pf-liquid-trail')).toHaveAttribute('data-idle-sweep','true',{timeout:16000});
  await expect(page.locator('.pf-portrait')).toHaveClass(/is-ambient/);
  const portrait=await page.locator('.pf-portrait').boundingBox();
  await page.mouse.move(portrait.x+portrait.width*.5,portrait.y+portrait.width*.25);
  await expect(page.locator('.pf-liquid-trail')).not.toHaveAttribute('data-idle-sweep','true');
  await expect(page.locator('.pf-portrait')).not.toHaveClass(/is-ambient/);
  await expect.poll(()=>page.locator('.pf-portrait').evaluate(el=>Number(el.style.getPropertyValue('--reveal-opacity')))).toBeGreaterThan(.9);
  await navigate(page,'Profile');
  await page.waitForTimeout(11000);
  await expect(page.locator('.pf-liquid-trail')).not.toHaveAttribute('data-idle-sweep','true');
});

test('hero labels follow proximity independently and line particles have distinct repeating phases',async({page})=>{
  await page.setViewportSize({width:1180,height:694});await page.goto('/portfolio');
  const rows=page.locator('.pf-system');await expect(rows).toHaveCount(5);
  const top=await rows.first().boundingBox(),bottom=await rows.last().boundingBox();
  const opacities=()=>rows.evaluateAll(els=>els.map(el=>Number(getComputedStyle(el).opacity)));
  await page.mouse.move(top.x+top.width*.5,top.y+top.height*.5);
  await expect.poll(async()=>{const o=await opacities();return o[0]-o[4];}).toBeGreaterThan(.8);
  await page.mouse.move(bottom.x+bottom.width*.5,bottom.y+bottom.height*.5);
  await expect.poll(async()=>{const o=await opacities();return o[4]-o[0];}).toBeGreaterThan(.8);
  const motions=await rows.locator('animateMotion').evaluateAll(els=>els.map(el=>({begin:el.getAttribute('begin'),duration:el.getAttribute('dur'),repeat:el.getAttribute('repeatCount')})));
  expect(new Set(motions.map(m=>m.begin)).size).toBe(5);expect(new Set(motions.map(m=>m.duration)).size).toBe(5);
  expect(motions.every(m=>m.repeat==='indefinite')).toBe(true);
  await navigate(page,'Journey');
  expect(await page.locator('.pf-journey-card.is-active h3').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeCloseTo(37.76,1);
});

test('profile cards arrive while the bottom half of the hero is still visible',async({page})=>{
  await page.setViewportSize({width:1900,height:900});await page.goto('/portfolio');
  await expect(page.locator('.pf-scenes')).toBeVisible();
  await page.locator('.pf-scroll').evaluate(el=>{const section=el.querySelector('#profile');el.scrollTop=section.offsetTop-el.clientHeight*.54;});
  await expect.poll(()=>page.locator('.pf-stat-card').evaluateAll(els=>els.some(el=>{const r=el.getBoundingClientRect();return r.top<900&&r.bottom>486&&r.right>0&&r.left<1900;}))).toBe(true);
  expect(await page.locator('.pf-bio-card').evaluate(el=>el.getBoundingClientRect().top)).toBeLessThan(900);
  await expect(page.locator('.pf-system strong').first()).toHaveCSS('font-size','16.15px');
});
