import { chromium } from '@playwright/test';
import { preview } from 'vite';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Real application screenshots, kept outside ignored test artifacts for GitHub.
const directory = fileURLToPath(new URL('../docs/screenshots/', import.meta.url));
const chrome = process.env.PLAYWRIGHT_CHROME_EXECUTABLE || (process.platform === 'win32' && existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
const server = process.env.MACFOLIO_SCREENSHOT_URL ? null : await preview({ preview: { host: '127.0.0.1', port: 5183, strictPort: true, open: false } });
const url = process.env.MACFOLIO_SCREENSHOT_URL || 'http://127.0.0.1:5183/';
let browser;
const problems = [];

async function screenshot(page, name) {
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.app-loading:visible').waitFor({ state: 'hidden' });
  await page.waitForFunction(() => [...document.images].every(image => image.complete));
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${directory}/${name}.png`, animations: 'disabled' });
  process.stdout.write(`Captured ${name}\n`);
}

async function setup(context, size) {
  const page = await context.newPage();
  if (size) await page.setViewportSize(size);
  await page.clock.setFixedTime(new Date('2026-10-05T06:00:00Z'));
  page.on('pageerror', error => problems.push(error.message));
  await page.goto(url);
  return page;
}

async function closeWindows(page) {
  const buttons = page.locator('.os-window:not([hidden]) .traffic-lights .close');
  while (await buttons.count()) await buttons.last().click();
}
async function open(page, name) {
  await page.getByRole('navigation', { name: 'Dock', exact: true }).getByRole('button', { name, exact: true }).click();
}
async function theme(page, value) {
  if (await page.locator('html').getAttribute('data-theme') === value) return;
  await page.getByRole('button', { name: 'Control Center', exact: true }).click();
  await page.getByRole('button', { name: 'Toggle dark mode', exact: true }).click();
  await page.keyboard.press('Escape');
}

try {
  await mkdir(directory, { recursive: true });
  browser = await chromium.launch({ executablePath: chrome });
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await setup(desktop);
  await page.locator('.welcome-hero').waitFor();
  await screenshot(page, 'desktop-light');
  await theme(page, 'dark');
  await screenshot(page, 'desktop-dark');
  await closeWindows(page);
  await open(page, 'GitHub');
  await page.locator('.gh-hero').waitFor();
  await screenshot(page, 'github-desktop');
  await closeWindows(page);
  await theme(page, 'light');
  await page.getByRole('button', { name: /Selected work 3 projects/ }).click();
  await page.locator('.project-hero').waitFor();
  await screenshot(page, 'projects-desktop');
  await closeWindows(page);
  await open(page, 'Calendar');
  await page.getByRole('button', { name: 'New Event', exact: true }).click();
  await page.getByLabel('Title', { exact: true }).fill('Portfolio review');
  await page.getByLabel('Time', { exact: true }).fill('16:00');
  await page.getByRole('button', { name: 'Add event', exact: true }).click();
  await screenshot(page, 'calendar-light');
  await theme(page, 'dark');
  await screenshot(page, 'calendar-dark');
  await closeWindows(page);
  await theme(page, 'light');
  await open(page, 'Calculator');
  await page.getByLabel('Calculator display').waitFor();
  await page.keyboard.type('128+64=');
  await screenshot(page, 'calculator-desktop');
  await closeWindows(page);
  await theme(page, 'dark');
  await page.getByRole('button', { name: 'Notification Center', exact: true }).click();
  await screenshot(page, 'notifications-desktop');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Spotlight', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search apps' }).fill('github');
  await screenshot(page, 'spotlight-desktop');
  await page.keyboard.press('Escape');
  await open(page, 'Contacts');
  await page.locator('.contacts-app').waitFor();
  await screenshot(page, 'contacts-desktop');
  await closeWindows(page);
  await open(page, 'Code');
  await page.getByRole('textbox', { name: 'Code editor' }).waitFor();
  await screenshot(page, 'workspace-desktop');
  await closeWindows(page);
  await open(page, 'Chess');
  await page.getByRole('button', { name: '2 players', exact: true }).click();
  await page.getByRole('button', { name: 'e2 white pawn', exact: true }).click();
  await page.getByRole('button', { name: 'e4 legal move', exact: true }).click();
  await screenshot(page, 'chess-desktop');
  await closeWindows(page);
  await open(page, 'Settings');
  await page.locator('.settings-sidebar').getByRole('button', { name: 'Wallpaper', exact: true }).click();
  await screenshot(page, 'settings-desktop');

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const phone = await setup(mobile);
  await screenshot(phone, 'mobile-home');
  await phone.locator('.ios-home').getByRole('button', { name: 'Calculator', exact: true }).click();
  await phone.getByLabel('Calculator display').waitFor();
  await phone.locator('.calculator-keys').getByRole('button', { name: '7', exact: true }).click();
  await screenshot(phone, 'mobile-calculator');
  await phone.getByRole('button', { name: 'Back to home', exact: true }).click();
  await phone.locator('.ios-home').getByRole('button', { name: 'Contacts', exact: true }).click();
  await phone.locator('.contacts-app').waitFor();
  await screenshot(phone, 'mobile-contacts');
  await phone.getByRole('button', { name: 'Back to home', exact: true }).click();
  await phone.setViewportSize({ width: 320, height: 568 });
  await screenshot(phone, 'mobile-home-small');
  if (problems.length) throw new Error(problems.join('\n'));
  process.stdout.write('Screenshots ready in docs/screenshots/\n');
} finally {
  await browser?.close();
  if (server) await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}
