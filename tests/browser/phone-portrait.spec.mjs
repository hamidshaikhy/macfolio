import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';

test.beforeEach(async({context})=>{
  await context.route('**/_vercel/insights/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
});

test('first visit is dark while an existing light preference survives',async({page})=>{
  await page.goto('/');
  await expect(page.locator('.about-portfolio')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.getByRole('button',{name:'Control Center',exact:true}).click();
  await page.getByRole('button',{name:'Toggle dark mode',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.reload();
  await expect(page.locator('.about-portfolio')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});

test.describe('high density touch display',()=>{
  test.use({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  test('native portrait compositing preserves the shutter wipe in About and standalone',async({page},info)=>{
    await fs.mkdir('artifacts/phone-portrait',{recursive:true});
    for(const route of ['/', '/portfolio']){
      await page.goto(route);
      await expect(page.locator('.pf-experience')).toHaveAttribute('data-measured','true');
      await expect(page.locator('.pf-portrait')).toHaveAttribute('data-renderer','image');
      await expect(page.locator('.pf-photo')).toBeVisible();
      await expect.poll(()=>page.locator('.pf-photo').evaluate(img=>img.complete&&img.currentSrc)).toMatch(/hamid-natural-1024-v2\.webp$/);
      expect(await page.locator('.pf-portrait-canvas').evaluate(canvas=>canvas.getAttribute('data-ready'))).toBeNull();
      if(route==='/')await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
      await page.screenshot({path:`artifacts/phone-portrait/${info.project.name}-${route==='/'?'about':'standalone'}-natural.png`});
      await page.getByRole('button',{name:'Inspect portrait',exact:true}).click();
      await expect.poll(()=>page.locator('.pf-portrait').evaluate(el=>Number(el.style.getPropertyValue('--lock-reveal')))).toBeGreaterThan(.1);
      expect(await page.locator('.pf-portrait').evaluate(el=>Number(el.style.getPropertyValue('--lock-reveal')))).toBeLessThan(.99);
      await expect.poll(()=>page.locator('.pf-portrait').evaluate(el=>Number(el.style.getPropertyValue('--lock-reveal')))).toBeCloseTo(1,6);
      await expect(page.locator('.pf-circuit > img')).toBeVisible();
      await expect.poll(()=>page.locator('.pf-circuit > img').evaluate(img=>img.complete&&img.currentSrc)).toMatch(/hamid-hardware-1024-v6\.webp$/);
      const clip=await page.locator('.pf-circuit').evaluate(el=>getComputedStyle(el).clipPath);
      expect(clip).toContain('inset(');
      expect(clip.match(/-?\d+(?:\.\d+)?/g).every(value=>Number(value)===0)).toBe(true);
      await page.screenshot({path:`artifacts/phone-portrait/${info.project.name}-${route==='/'?'about':'standalone'}-electronic.png`});
      await page.getByRole('button',{name:'Close inspection',exact:true}).click();
      await expect.poll(()=>page.locator('.pf-portrait').evaluate(el=>Number(el.style.getPropertyValue('--lock-reveal')))).toBe(0);
    }
  });
});
