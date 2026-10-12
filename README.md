<div align="center">

# macfolio

**پورتفولیوی حمید شیخی؛ یک دسکتاپ تعاملی در مرورگر.**

<a href="https://macfolio-delta-one.vercel.app/"><img src="https://img.shields.io/badge/LIVE_DEMO-OPEN_MACFOLIO-32875e?style=for-the-badge&logo=vercel&logoColor=white" alt="مشاهدهٔ دمو آنلاین macfolio"></a>

[پورتفولیوی مستقل](https://macfolio-delta-one.vercel.app/portfolio) · [اجرای محلی](#start) · [مستندات](#docs)

![React](https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/Code-MIT-32875e?style=flat-square)

</div>

[![macfolio و پورتفولیوی حمید در پنجرهٔ About](docs/screenshots/portfolio-about.png)](docs/screenshots/portfolio-about.png)

پورتفولیو در **About Hamid** باز می‌شود؛ با **Open full portfolio** می‌توانید نسخهٔ مستقل را در تب جدید ببینید.

| پرترهٔ تعاملی | محیط گوشی |
| :---: | :---: |
| [<img src="docs/screenshots/portfolio-electronic.png" alt="پرترهٔ الکترونیکی پورتفولیو" width="700">](docs/screenshots/portfolio-electronic.png) | [<img src="docs/screenshots/mobile-home.png" alt="صفحهٔ خانهٔ macfolio در گوشی" width="220">](docs/screenshots/mobile-home.png) |

## امکانات

- پنجره‌های قابل جابه‌جایی و تغییر اندازه، Dock، Spotlight و تم روشن و تیره.
- پورتفولیوی تعاملی، پروژه‌ها، رزومه و تماس؛ چیدمان جداگانه برای گوشی و تبلت.
- GitHub داخلی، نمایش PDF، یادداشت، ویرایشگر کد و فایل‌های محلی.
- تقویم، ماشین‌حساب، شطرنج و پخش موسیقی.

| GitHub داخلی | تقویم |
| :---: | :---: |
| [<img src="docs/screenshots/github-desktop.png" alt="GitHub داخلی macfolio" width="700">](docs/screenshots/github-desktop.png) | [<img src="docs/screenshots/calendar-light.png" alt="تقویم macfolio" width="700">](docs/screenshots/calendar-light.png) |

<a id="start"></a>

## اجرای محلی

Node.js نسخهٔ ۲۲٫۱۳ یا جدیدتر:

```bash
npm ci
npm run dev
```

برنامه در [localhost:4173](http://localhost:4173) باز می‌شود. بک‌اند یا کلید API لازم ندارد.

```bash
npm run build    # خروجی در dist/
npm run preview
npm test
npm run test:browser:install
npm run test:browser
```

<a id="docs"></a>

## مستندات و تغییر محتوا

| موضوع | فایل |
| :--- | :--- |
| هویت و پروژه‌های محیط | [src/lib/content.ts](src/lib/content.ts) |
| متن و پروژه‌های پورتفولیو | [src/portfolio/content.ts](src/portfolio/content.ts) |
| پورتفولیو و تنظیم انتشار | [docs/PORTFOLIO.md](docs/PORTFOLIO.md) |
| معماری پروژه | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| بررسی‌ها و محدودیت تست | [docs/QA.md](docs/QA.md) |

یادداشت‌ها، فایل‌ها و تنظیمات در مرورگر همان دستگاه ذخیره می‌شوند. تصاویر README از خود برنامه ثبت شده‌اند؛ برای بازتولیدشان از `npm run screenshots` و `npm run screenshots:portfolio` استفاده کنید.

## سازنده و مجوز

**حمید شیخی** · [GitHub](https://github.com/hamidshaikhy) · [LinkedIn](https://www.linkedin.com/in/hamid-shaikhy/) · [Email](mailto:hamidshaikhy1382@gmail.com)

کد با مجوز [MIT](LICENSE) ارائه شده است. اعتبارها و مجوزهای تصاویر، موسیقی و برندها در [ATTRIBUTIONS.md](ATTRIBUTIONS.md) آمده‌اند.
