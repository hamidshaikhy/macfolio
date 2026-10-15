# ساخت و انتشار

```bash
npm ci
npm test
npm run build
npm run preview
```

ساخت، TypeScript را بررسی می‌کند و بعد از Vite، فایل `sw.js` نسخه‌دار را تولید می‌کند. محتویات `dist/` برای میزبان استاتیک با HTTPS آماده‌اند.

| تنظیم میزبان | مقدار |
| :--- | :--- |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variables | لازم ندارد |
| Node.js | ۲۲٫۱۲ یا جدیدتر |

Vercel، Netlify یا میزبانی استاتیک مشابه قابل استفاده است. میزبانی فایل برنامه، دفتر مالی کاربران را به سرور منتقل نمی‌کند؛ داده در همان origin مرورگر می‌ماند.

## ریشهٔ دامنه و زیرمسیر

تنظیم فعلی برای `/` است. برای انتشار زیر `/personal-finance/` این موارد باید base هماهنگ داشته باشند:

1. `base` در Vite.
2. لینک manifest و ثبت service worker.
3. `start_url`، `scope` و مسیر آیکن‌های manifest.
4. URLهای کش و fallback در `scripts/build-sw.mjs`.

صرفاً تغییر Vite کافی نیست. انتشار کد در GitHub به معنی فعال‌بودن GitHub Pages یا داشتن نشانی سایت نیست.

## به‌روزرسانی و آفلاین

service worker در production ثبت می‌شود، نه dev. پس از بارگذاری اولیه و آماده‌شدن کش، پوسته می‌تواند آفلاین باز شود. دفتر مالی همچنان از IndexedDB استفاده می‌کند.

hash فایل‌های build نام کش را مشخص می‌کند. نسخهٔ جدید در چرخهٔ طبیعی service worker و بازشدن برنامه جایگزین می‌شود. برای بررسی آفلاین، build را روی localhost یا HTTPS باز کنید و منتظر آماده‌شدن service worker بمانید.

origin یا دستگاه جدید دفتر قبلی را نمی‌بیند. برای انتقال، پشتیبان رمزگذاری‌شده بگیرید و در حساب محلی مقصد بازیابی کنید؛ رمز حساب و رمز پشتیبان مستقل‌اند.
