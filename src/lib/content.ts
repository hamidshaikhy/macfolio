export const profile = {
  name: "Hamid Shaikhy",
  nameFa: "حمید شیخی",
  title: "Front-End Developer",
  github: "https://github.com/hamidshaikhy",
  linkedin: "https://www.linkedin.com/in/hamid-shaikhy/",
  email: "hamidshaikhy1382@gmail.com",
  phone: "+989373891553",
  phoneDisplay: "+98 937 389 1553",
  location: "Tehran, Iran",
  timezone: "Asia/Tehran",
  bio: "توسعه‌دهندهٔ فرانت‌اند با تمرکز بر React و ساخت رابط‌های کاربردی، سریع و دقیق. تجربهٔ من از وب‌سایت شرکتی تا داشبوردهای مالی و ابزارهای تعاملی، حول تبدیل نیاز واقعی به تجربه‌ای قابل استفاده شکل گرفته است.",
  skills: [
    "React",
    "TypeScript",
    "JavaScript",
    "Next.js",
    "Tailwind CSS",
    "Vite",
    "Three.js",
    "REST APIs",
    "Git",
    "Figma",
  ],
};
export const projects = [
  {
    id: "dika",
    title: "Dika Asia",
    category: "Production website",
    monogram: "DA",
    color: "#be7734",
    summary: "وب‌سایت رسمی دیکا آسیا",
    description:
      "وب‌سایت کامل شرکت دیکا آسیا به پایان رسیده و در اختیار مجموعه است. طراحی و پیاده‌سازی رابط معرفی محصولات، پروژه‌ها، مطالب و گالری با پشتیبانی از فارسی و کردی سورانی.",
    role: "توسعهٔ فرانت‌اند، کامپوننت‌های قابل استفادهٔ مجدد، رابط واکنش‌گرا و اتصال به APIهای Django.",
    challenge:
      "مدیریت محتوای متنوع در یک رابط چندزبانه، حفظ خوانایی RTL و هماهنگی تجربه در موبایل و دسکتاپ.",
    result:
      "نسخهٔ اصلی آنلاین است و معرفی محصولات، پروژه‌ها و مطالب شرکت را با پشتیبانی چندزبانه ارائه می‌کند.",
    tags: ["React", "REST APIs", "RTL", "Three.js"],
    website: "https://dikaasia.com/",
    repo: "https://github.com/hamidshaikhy",
  },
  {
    id: "finance",
    title: "Financial Panel",
    category: "Financial workspace",
    monogram: "FP",
    color: "#4179cf",
    summary: "پنل مدیریت مالی و عملیات",
    description:
      "داشبوردی برای مرور وضعیت مالی و عملیات؛ حساب‌ها، هزینه‌ها، گزارش سود و زیان، پروژه‌ها، تأمین‌کنندگان و موجودی در یک محیط RTL.",
    role: "ساخت رابط با React و Vite، جدول‌های داده، گزارش‌گیری، خروجی اکسل و تم روشن و تاریک.",
    challenge:
      "نمایش اطلاعات متراکم و فرم‌های مختلف بدون از دست رفتن مسیر کار کاربر.",
    result:
      "ساختار رابط برای توسعهٔ بخش‌های مختلف و اتصال به API طراحی شده است.",
    tags: ["React", "Vite", "Data tables", "RTL"],
    repo: "https://github.com/hamidshaikhy/financial-management-panel",
  },
  {
    id: "flow",
    title: "Flow Studio",
    category: "Workflow builder",
    monogram: "FS",
    color: "#8555c5",
    summary: "سازندهٔ جریان‌های کاری",
    description:
      "نمونه‌کار تعاملی ساخت و ویرایش جریان‌های کاری با الهام از ابزارهایی مثل n8n؛ تمرکز بر تجربهٔ کار با گراف و اتصال مرحله‌ها.",
    role: "طراحی و پیاده‌سازی تجربهٔ بصری و تعاملی جریان‌های کاری.",
    challenge: "قابل فهم نگه داشتن رابطهٔ مرحله‌ها هنگام کار با یک بوم تعاملی.",
    result: "کد پروژه در گیت‌هاب برای بررسی و اجرای محلی در دسترس است.",
    tags: ["React", "Workflow", "Interactive UI"],
    repo: "https://github.com/hamidshaikhy/flow-studio",
  },
  {
    id: "barg",
    title: "Barg",
    category: "Résumé builder",
    monogram: "BG",
    color: "#3d8a5a",
    summary: "رزومه‌ساز فارسی برگ",
    description:
      "رزومه‌ساز فارسی و راست‌به‌چپ که کاملاً در مرورگر اجرا می‌شود؛ نوشتن با پیش‌نمایش زنده، ده قالب رسمی و خروجی PDF و Word، بدون ثبت‌نام و بدون سرور.",
    role: "طراحی و توسعهٔ کامل با React، TypeScript و Tailwind CSS؛ موتور صفحه‌بندی A4، قالب‌ها، خروجی‌ها و صفحهٔ معرفی اسکرولی.",
    challenge:
      "صفحه‌بندی دقیق روی برگهٔ A4 و درست نگه‌داشتن ترتیب متن فارسی و لاتین در پیش‌نمایش، PDF و Word.",
    result:
      "کد پروژه در گیت‌هاب برای بررسی و اجرای محلی در دسترس است.",
    tags: ["React", "TypeScript", "Tailwind CSS", "RTL"],
    repo: "https://github.com/hamidshaikhy/barg-resume-builder",
  },
  {
    id: "tanpoosh",
    title: "Tanpoosh",
    category: "Menswear store & style studio",
    monogram: "TP",
    color: "#8b7355",
    summary: "فروشگاه پوشاک مردانه و استودیوی استایل تن‌پوش",
    description:
      "فروشگاه کامل پوشاک مردانه با رابط فارسی و راست‌چین؛ کاتالوگ و انتخاب رنگ و سایز، سبد خرید و سفارش، استودیوی ساخت استایل و پنل اختصاصی مدیریت فروشگاه.",
    role: "طراحی و توسعهٔ فروشگاه و استودیوی استایل با Next.js، React و TypeScript، پنل مدیریت و APIهای Django.",
    challenge:
      "هماهنگی انتخاب محصول، رنگ، سایز و موجودی با پیش‌نمایش استایل و مسیر خرید، در یک تجربهٔ واکنش‌گرا و فارسی.",
    result:
      "کد و تصاویر اجرای واقعی پروژه در گیت‌هاب در دسترس‌اند؛ نسخهٔ محلی با داده‌های نمایشی و پرداخت آزمایشی اجرا می‌شود.",
    tags: ["Next.js", "TypeScript", "Django", "PostgreSQL", "RTL"],
    repo: "https://github.com/hamidshaikhy/tanpoosh",
  },
];
export type Project = (typeof projects)[number];
