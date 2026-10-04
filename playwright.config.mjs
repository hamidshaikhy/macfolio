import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
const chrome = process.env.PLAYWRIGHT_CHROME_EXECUTABLE || (process.platform === 'win32' && existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
const baseURL = process.env.HAMIDOS_TEST_URL || 'http://127.0.0.1:5180/';
export default defineConfig({
  testDir: './tests/browser', timeout: 90000, expect: { timeout: 20000 }, workers: 1, fullyParallel: false,
  reporter: [['list'], ['html', { outputFolder: 'artifacts/browser-report', open: 'never' }]],
  outputDir: 'artifacts/browser-results',
  use: { baseURL, viewport: { width: 1440, height: 900 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [{ name: 'chrome', use: { browserName: 'chromium', launchOptions: chrome ? { executablePath: chrome } : {} } }, { name: 'webkit', use: { browserName: 'webkit' } }],
  webServer: process.env.HAMIDOS_TEST_URL ? undefined : { command: 'npm run preview -- --port 5180', url: baseURL, reuseExistingServer: true, timeout: 90000 },
});
