import { test, expect } from '@playwright/test';

test('macfolio restores preferences, notes, events and chess from the previous release', async ({ page }) => {
  await page.addInitScript(() => {
    const persist = (section, state, version = 0) => localStorage.setItem(`hamidos.${section}.v1`, JSON.stringify({ state, version }));
    persist('preferences', { theme: 'dark', wallpaper: 'aurora', wifi: false });
    persist('files', { files: [{ path: '/Users/hamid/Notes/saved-note.md', content: 'A note kept from the previous release.', modified: '2026-10-05' }] });
    persist('calendar', { events: [{ id: 'saved-event', title: 'A plan kept from the previous release', date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tehran' }), time: '09:00', color: '#ff4562' }] });
    localStorage.setItem('hamidos.chess.v1', JSON.stringify({ pgn: '1. e4', mode: 'local' }));
  });
  await page.goto('/');
  await expect(page).toHaveTitle('macfolio — Hamid Shaikhy');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.wallpaper-dark')).toHaveAttribute('style', /aurora.jpg/);
  const dock = page.getByRole('navigation', { name: 'Dock', exact: true });
  await dock.getByRole('button', { name: 'Notes', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Note content' })).toHaveValue('A note kept from the previous release.');
  await dock.getByRole('button', { name: 'Calendar', exact: true }).click();
  await expect(page.locator('.calendar-event')).toContainText('A plan kept from the previous release');
  await dock.getByRole('button', { name: 'Chess', exact: true }).click();
  await expect(page.locator('.move-list')).toContainText('e4');
  await expect(page.locator('.chess-status')).toContainText('Black to move');
  const keys = await page.evaluate(() => ['preferences', 'files', 'calendar', 'chess'].map(section => ({
    previous: localStorage.getItem(`hamidos.${section}.v1`),
    current: localStorage.getItem(`macfolio.${section}.v1`),
  })));
  expect(keys.every(value => value.previous !== null && value.current !== null)).toBe(true);
});
