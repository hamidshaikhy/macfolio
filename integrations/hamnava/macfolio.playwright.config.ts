import {defineConfig} from '@playwright/test';
import {existsSync} from 'node:fs';
const chrome=process.env.PLAYWRIGHT_CHROME_EXECUTABLE || (process.platform==='win32' && existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
export default defineConfig({
 testDir:'tests/ui',workers:1,fullyParallel:false,timeout:90000,expect:{timeout:20000},reporter:'list',
 outputDir:'../../artifacts/hamnava-browser-results',
 use:{baseURL:process.env.MACFOLIO_TEST_URL||'http://127.0.0.1:5180/',viewport:{width:1440,height:900},serviceWorkers:'block',trace:'retain-on-failure'},
 projects:[{name:'chrome',use:{browserName:'chromium',launchOptions:chrome?{executablePath:chrome}:{}}},{name:'webkit',use:{browserName:'webkit'}}],
 webServer:process.env.MACFOLIO_TEST_URL?undefined:{command:'npm --prefix ../.. run preview -- --port 5180',url:'http://127.0.0.1:5180/',reuseExistingServer:true},
});
