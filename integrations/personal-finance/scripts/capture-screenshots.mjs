import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const baseURL = process.env.SCREENSHOT_BASE_URL || "http://localhost:5173";
const output = new URL("../docs/screenshots/", import.meta.url);
const date = process.env.SCREENSHOT_DATE || "2026-10-14T12:00:00+03:30";
await mkdir(output, { recursive: true });
let browser;
if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) {
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
    headless: true,
  });
} else {
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }
}
const errors = [], captures = [];
async function prepare(context) {
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install({ time: new Date(date) });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}
async function capture(page, name, fullPage = true) {
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Horizontal overflow: ${name}`);
  await page.screenshot({
    path: fileURLToPath(new URL(name, output)),
    fullPage,
    animations: "disabled",
    caret: "hide",
  });
  captures.push(name);
  console.log(`Captured ${name}`);
}
async function enterDemo(page) {
  await page.getByRole("button", { name: "ورود به نسخهٔ دمو" }).click();
  await page.getByRole("heading", { name: "نمای کلی", exact: true }).waitFor();
}
async function navigate(page, name) {
  await page.locator(".desktop-nav").getByRole("button", { name, exact: true }).click();
  await page.getByRole("heading", { name, exact: true }).waitFor();
}
try {
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 1160 }, deviceScaleFactor: 2,
    timezoneId: "Asia/Tehran", reducedMotion: "reduce",
  });
  const desktop = await prepare(desktopContext);
  await capture(desktop, "login-desktop.png");
  await enterDemo(desktop);
  const bars = await desktop.locator(".bars-chart svg g > rect").evaluateAll((nodes) => nodes.map((n) => Number(n.getAttribute("height"))));
  assert.equal(new Set(bars.filter((_, i) => i % 2 === 0)).size, 6);
  assert.equal(new Set(bars.filter((_, i) => i % 2 === 1)).size, 6);
  await capture(desktop, "overview-desktop.png");
  await navigate(desktop, "گزارش‌ها");
  await capture(desktop, "reports-desktop.png");
  await navigate(desktop, "حساب‌ها");
  await capture(desktop, "accounts-desktop.png");
  await navigate(desktop, "بودجه");
  await capture(desktop, "budgets-desktop.png");
  await navigate(desktop, "برنامه‌ریزی");
  await capture(desktop, "scheduled-desktop.png");
  await desktop.getByRole("button", { name: "هدف‌های پس‌انداز", exact: true }).click();
  await capture(desktop, "goals-desktop.png");
  await navigate(desktop, "تراکنش‌ها");
  await capture(desktop, "transactions-desktop.png");
  await desktop.locator(".desktop-add").click();
  await desktop.getByRole("dialog").waitFor();
  await desktop.locator('input[name="amount"]').fill("۱۲۵۰۰۰۰");
  await desktop.locator('select[name="categoryId"]').selectOption("shopping");
  await desktop.locator('input[name="note"]').fill("خرید ابزار کار");
  await desktop.locator('input[name="note"]').blur();
  await capture(desktop, "transaction-editor-desktop.png", false);
  await desktop.keyboard.press("Escape");
  await desktop.getByRole("button", { name: "تنظیمات", exact: true }).click();
  await capture(desktop, "settings-desktop.png");

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 1000 }, deviceScaleFactor: 2,
    timezoneId: "Asia/Tehran", isMobile: true, hasTouch: true,
    reducedMotion: "reduce",
  });
  const mobile = await prepare(mobileContext);
  await enterDemo(mobile);
  await mobile.locator(".mobile-sankey").waitFor({ state: "visible" });
  await capture(mobile, "overview-mobile.png", false);
  await mobile.locator(".mobile-nav").getByRole("button", { name: "تراکنش‌ها", exact: true }).click();
  await capture(mobile, "transactions-mobile.png", false);
  await mobile.locator(".mobile-add").click();
  await mobile.getByRole("dialog").waitFor();
  await mobile.locator('input[name="amount"]').fill("۱۲۵۰۰۰۰");
  await mobile.locator('select[name="categoryId"]').selectOption("shopping");
  await mobile.locator('input[name="note"]').fill("خرید ابزار کار");
  await mobile.locator('input[name="note"]').blur();
  await capture(mobile, "transaction-editor-mobile.png", false);
  assert.deepEqual(errors, [], "Browser runtime errors during capture");
  await writeFile(new URL("capture.json", output), JSON.stringify({
    appDate: date, timezone: "Asia/Tehran", browser: browser.version(),
    desktop: { width: 1440, height: 1160, scale: 2 },
    mobile: { width: 390, height: 1000, scale: 2 },
    source: "Rendered application with isolated demo accounts; no real user records",
    captures, runtimeErrors: errors,
  }, null, 2) + "\n");
} finally {
  await browser.close();
}
