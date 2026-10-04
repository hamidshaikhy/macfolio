import { test, expect } from '@playwright/test';

test('compact calculator, informational notifications and a themed calendar', async ({ page }) => {
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  const dock=page.getByRole('navigation',{name:'Dock',exact:true});
  await dock.getByRole('button',{name:'Calculator',exact:true}).click();
  const calculator=page.getByRole('dialog',{name:'Calculator',exact:true});
  await expect.poll(async ()=>(await calculator.boundingBox()).width).toBe(320);
  const bounds=await calculator.boundingBox();
  expect(bounds.width).toBe(320); expect(bounds.height).toBe(510);
  expect(bounds.y+bounds.height).toBeLessThan(810);
  expect(await calculator.locator('.window-titlebar').innerText()).toBe('');
  expect(await calculator.locator('.window-content').evaluate(el=>el.scrollHeight<=el.clientHeight)).toBe(true);
  const keyBounds=await calculator.getByRole('button',{name:'=',exact:true}).boundingBox();
  expect(keyBounds.y+keyBounds.height).toBeLessThan(bounds.y+bounds.height);
  await page.keyboard.type('12*3=');
  await expect(page.getByLabel('Calculator display')).toHaveText('36');
  await page.getByRole('button',{name:'Notification Center',exact:true}).click();
  const notifications=page.locator('.notification-center');
  await expect(notifications.locator('article')).toHaveCount(4);
  await expect(notifications).toContainText('A new collaboration');
  await expect(notifications.locator('button,a,[role="button"]')).toHaveCount(0);
  await notifications.locator('article').first().click();
  await expect(notifications).toBeVisible();
  await expect(page.locator('.calendar-popover')).toHaveCount(0);
  await expect(page.locator('.battery-fill')).toHaveAttribute('fill','#34c759');
  await expect(page.locator('.battery-bolt')).toBeVisible();
  await page.keyboard.press('Escape');
  await dock.getByRole('button',{name:'Calendar',exact:true}).click();
  expect(await page.locator('.calendar-app').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)');
  await page.getByRole('button',{name:'New Event',exact:true}).click();
  const form=page.locator('.calendar-event-form');
  const formColor=await form.evaluate(el=>getComputedStyle(el).backgroundColor);
  expect(formColor.match(/\d+/g).map(Number).every(channel=>channel>=245)).toBe(true);
  await page.getByRole('button',{name:'Cancel event',exact:true}).click();
  await page.getByRole('button',{name:'Control Center',exact:true}).click();
  await page.getByRole('button',{name:'Toggle dark mode',exact:true}).click();
  await page.keyboard.press('Escape');
  expect(await page.locator('.calendar-app').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(28, 28, 30)');
  expect(errors).toEqual([]);
});

for (const size of [{width:390,height:844},{width:375,height:667},{width:320,height:568},{width:667,height:375}]) {
  test(`mobile home ${size.width}×${size.height} shows every desktop app without hidden pages`, async ({ page }) => {
    await page.setViewportSize(size); await page.goto('/');
    const home=page.locator('.ios-home');
    await expect(home).toBeVisible();
    for(const name of ['Finder','Terminal','Code','Notes','Calendar','Safari','GitHub','LinkedIn','Contacts','Chess','Calculator','Settings','Trash']) {
      const button=home.getByRole('button',{name,exact:true});
      await expect(button).toHaveCount(1);
      const rect=await button.boundingBox();
      expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.x+rect.width).toBeLessThanOrEqual(size.width);
      expect(rect.y).toBeGreaterThanOrEqual(0); expect(rect.y+rect.height,`${name} outside the home screen`).toBeLessThanOrEqual(size.height-20);
    }
    await expect(home.getByRole('button',{name:'Projects',exact:true})).toHaveCount(0);
    await expect(home.getByRole('button',{name:'Preview',exact:true})).toHaveCount(0);
    await expect(home.locator('.ios-app-grid').getByRole('button',{name:'About',exact:true})).toHaveCount(0);
    expect(await home.evaluate(el=>el.scrollHeight<=el.clientHeight)).toBe(true);
    await home.getByRole('button',{name:'Calculator',exact:true}).click();
    await expect(page.getByLabel('Calculator display')).toBeVisible();
    const equal=await page.locator('.calculator-keys').getByRole('button',{name:'=',exact:true}).boundingBox();
    expect(equal.y+equal.height).toBeLessThanOrEqual(size.height-20);
    await page.getByRole('button',{name:'Back to home',exact:true}).click();
    await home.getByRole('button',{name:'Selected work',exact:true}).click();
    await expect(page.locator('.projects-app')).toBeVisible();
    await page.getByRole('button',{name:'Back to home',exact:true}).click();
    await home.getByRole('button',{name:'My résumé',exact:true}).click();
    await expect(page.locator('.pdf-workspace .pdf-page[data-rendered="true"]')).toHaveCount(2);
  });
}
