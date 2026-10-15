# بازتولید اسکرین‌شات‌ها

گالری از رابط واقعی و با Playwright ثبت می‌شود. context تازهٔ دسکتاپ و موبایل از حساب‌های دمو و storage جدا استفاده می‌کنند؛ نشست یا دفتر شخصی وارد تصاویر نمی‌شود.

## اجرا

```bash
npm ci
# اگر Chrome نصب نیست:
npx playwright install chromium
```

در ترمینال اول `npm run dev` و در ترمینال دوم اجرا کنید:

```bash
npm run capture:screenshots
```

اسکریپت Chrome نصب‌شده و سپس Chromium مربوط به Playwright را امتحان می‌کند. مسیر اجرایی دلخواه نیز قابل تعیین است.

| متغیر | پیش‌فرض | کاربرد |
| :--- | :--- | :--- |
| `SCREENSHOT_BASE_URL` | `http://localhost:5173` | نشانی dev یا preview |
| `SCREENSHOT_DATE` | `2026-10-14T12:00:00+03:30` | تاریخ ثابت برای دمو و تقویم |
| `PLAYWRIGHT_EXECUTABLE_PATH` | خودکار | مسیر Chrome/Chromium |

در PowerShell:

```powershell
$env:SCREENSHOT_BASE_URL = 'http://localhost:5174'
npm run capture:screenshots
```

در bash:

```bash
SCREENSHOT_BASE_URL=http://localhost:5174 npm run capture:screenshots
```

## خروجی و کنترل‌ها

در `docs/screenshots/` ده تصویر دسکتاپ و سه تصویر موبایل نوشته می‌شود. `capture.json` مرورگر، viewport، تاریخ ثابت و نام تصاویر را ثبت می‌کند.

دسکتاپ `1440 × 1160` و موبایل `390 × 1000` پیکسل CSS، هر دو با ضریب تراکم ۲ هستند. بیشتر نماهای دسکتاپ full page و تصاویر موبایل و فرم ثبت به اندازهٔ viewport هستند.

فونت پیش از ثبت بارگذاری و caret و انیمیشن هنگام capture غیرفعال می‌شوند. فرم نمونه ذخیره نمی‌شود. تاریخ ثابت ۲۲ مهر ۱۴۰۵ است و تاریخ سیستم یا دفتر کاربر تغییر نمی‌کند.

اسکریپت ورود و بازشدن صفحه‌ها را کنترل می‌کند و با خطای اجرایی، اسکرول افقی یا یکسان‌شدن ستون‌های ماه‌ها شکست می‌خورد. این کنترل‌ها smoke check هستند؛ آزمون روی گوشی واقعی، صفحه‌کلید، نصب PWA و Safari/Firefox جداگانه لازم است.
