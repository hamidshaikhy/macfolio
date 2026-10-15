import jalaali from "jalaali-js";
import { palette, displayColor } from "./palette";
export type Account = {
  id: string;
  name: string;
  type: "bank" | "cash" | "savings" | "credit";
  opening: number;
  color: string;
};
export type Category = {
  id: string;
  name: string;
  kind: "income" | "expense";
  color: string;
};
export type Transaction = {
  id: string;
  kind: "income" | "expense" | "transfer";
  amount: number;
  date: string;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  note: string;
  recurringKey?: string;
};
export type Budget = {
  id: string;
  categoryId: string;
  month: string;
  amount: number;
};
export type Scheduled = {
  id: string;
  name: string;
  amount: number;
  kind: "income" | "expense";
  accountId: string;
  categoryId: string;
  startDate: string;
  frequency: "once" | "monthly";
  endDate?: string;
};
export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string;
};
export type Ledger = {
  version: 1;
  name: string;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  scheduled: Scheduled[];
  goals: Goal[];
};
export type Range = { start: string; end: string };
export const colors = palette;
export const uid = () => crypto.randomUUID();
export const fa = (n: number) =>
  new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(n);
export const money = (n: number) => fa(n) + " تومان";
export const digits = (s: string) =>
  s
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)));
export function parseMoney(v: string, allowNegative = false) {
  const s = digits(v).replace(/[,٬\s]/g, "");
  if (!(allowNegative ? /^-?\d+$/ : /^\d+$/).test(s))
    throw Error("مبلغ را به تومان و بدون اعشار وارد کنید.");
  const n = Number(s);
  if (
    !Number.isSafeInteger(n) ||
    Math.abs(n) > 1e12 ||
    (!allowNegative && n <= 0)
  )
    throw Error("مبلغ باید بین ۱ و ۱٬۰۰۰٬۰۰۰٬۰۰۰٬۰۰۰ تومان باشد.");
  return n;
}
export function safeSum(values: number[]) {
  let n = 0;
  for (const v of values) {
    n += v;
    if (!Number.isSafeInteger(n) || Math.abs(n) > 1e15)
      throw Error("مجموع مبالغ از محدودهٔ قابل محاسبه خارج است.");
  }
  return n;
}
export const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
export function today() {
  const d = new Date();
  return iso(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
export function validDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 12);
  return (
    y >= 1900 &&
    y <= 2200 &&
    dt.getFullYear() === y &&
    dt.getMonth() === m - 1 &&
    dt.getDate() === d
  );
}
export function jalaliParts(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return jalaali.toJalaali(y, m, d);
}
export function toJalali(s: string) {
  if (!validDate(s)) return "";
  const j = jalaliParts(s);
  return digits(
    `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`,
  ).replace(/\d/g, (c) => "۰۱۲۳۴۵۶۷۸۹"[+c]);
}
export function fromJalali(s: string) {
  const v = digits(s).trim().replace(/-/g, "/");
  if (!/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(v))
    throw Error("تاریخ را به شکل ۱۴۰۵/۰۷/۲۲ وارد کنید.");
  const [y, m, d] = v.split("/").map(Number);
  if (y < 1280 || y > 1578 || !jalaali.isValidJalaaliDate(y, m, d))
    throw Error("تاریخ شمسی معتبر نیست.");
  const g = jalaali.toGregorian(y, m, d);
  return iso(g.gy, g.gm, g.gd);
}
export const months = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];
export function monthKey(date: string) {
  const j = jalaliParts(date);
  return `${j.jy}-${String(j.jm).padStart(2, "0")}`;
}
export function monthRange(key: string): Range {
  const [y, m] = key.split("-").map(Number);
  const a = jalaali.toGregorian(y, m, 1),
    b = jalaali.toGregorian(y, m, jalaali.jalaaliMonthLength(y, m));
  return { start: iso(a.gy, a.gm, a.gd), end: iso(b.gy, b.gm, b.gd) };
}
export function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  const n = Math.max(
    1280 * 12,
    Math.min(1578 * 12 + 11, y * 12 + m - 1 + delta),
  );
  return `${Math.floor(n / 12)}-${String((((n % 12) + 12) % 12) + 1).padStart(2, "0")}`;
}
export function monthTitle(key: string) {
  const [y, m] = key.split("-").map(Number);
  return `${months[m - 1]} ${fa(y)}`;
}
export const inRange = (date: string, r: Range) =>
  date >= r.start && date <= r.end;
export const blankLedger = (name: string): Ledger => ({
  version: 1,
  name,
  accounts: [],
  categories: defaultCategories(),
  transactions: [],
  budgets: [],
  scheduled: [],
  goals: [],
});
export function defaultCategories(): Category[] {
  return [
    { id: "salary", name: "حقوق", kind: "income", color: colors[0] },
    { id: "freelance", name: "فریلنس", kind: "income", color: colors[4] },
    {
      id: "other-income",
      name: "سایر درآمدها",
      kind: "income",
      color: colors[5],
    },
    { id: "home", name: "خانه", kind: "expense", color: colors[2] },
    { id: "food", name: "خوراک", kind: "expense", color: colors[3] },
    { id: "shopping", name: "خرید", kind: "expense", color: colors[0] },
    { id: "transport", name: "رفت‌وآمد", kind: "expense", color: colors[4] },
    { id: "health", name: "سلامت و ورزش", kind: "expense", color: colors[1] },
    { id: "education", name: "آموزش", kind: "expense", color: colors[5] },
  ];
}
export function accountBalance(l: Ledger, id: string, through = "9999-12-31") {
  const a = l.accounts.find((a) => a.id === id);
  if (!a) throw Error("حساب پیدا نشد.");
  return safeSum([
    a.opening,
    ...l.transactions
      .filter((t) => t.date <= through)
      .flatMap((t) =>
        t.kind === "transfer"
          ? t.accountId === id
            ? [-t.amount]
            : t.toAccountId === id
              ? [t.amount]
              : []
          : t.accountId === id
            ? [t.kind === "income" ? t.amount : -t.amount]
            : [],
      ),
  ]);
}
export function summary(l: Ledger, r: Range) {
  const tx = l.transactions.filter((t) => inRange(t.date, r));
  const income = safeSum(
      tx.filter((t) => t.kind === "income").map((t) => t.amount),
    ),
    expense = safeSum(
      tx.filter((t) => t.kind === "expense").map((t) => t.amount),
    );
  return {
    income,
    expense,
    surplus: income - expense,
    rate: income > 0 ? ((income - expense) / income) * 100 : null,
    balance: safeSum(l.accounts.map((a) => accountBalance(l, a.id, r.end))),
  };
}
export function categorySpend(l: Ledger, categoryId: string, r: Range) {
  return safeSum(
    l.transactions
      .filter(
        (t) =>
          t.kind === "expense" &&
          t.categoryId === categoryId &&
          inRange(t.date, r),
      )
      .map((t) => t.amount),
  );
}
export function validateLedger(v: unknown): asserts v is Ledger {
  const l = v as Ledger;
  const bad = () => {
    throw Error("دادهٔ مالی معتبر نیست؛ فایل یا ورودی را بررسی کنید.");
  };
  if (
    !l ||
    l.version !== 1 ||
    typeof l.name !== "string" ||
    !l.name.trim() ||
    l.name.length > 80
  )
    bad();
  for (const k of [
    "accounts",
    "categories",
    "transactions",
    "budgets",
    "scheduled",
    "goals",
  ] as const)
    if (!Array.isArray(l[k]) || l[k].length > 20000) bad();
  if (
    l.accounts.length > 100 ||
    l.categories.length > 200 ||
    l.scheduled.length > 200 ||
    l.goals.length > 200 ||
    l.budgets.length > 5000
  )
    bad();
  const all = [
    ...l.accounts,
    ...l.categories,
    ...l.transactions,
    ...l.budgets,
    ...l.scheduled,
    ...l.goals,
  ];
  if (
    all.some(
      (x) => !x || typeof x.id !== "string" || !x.id || x.id.length > 100,
    ) ||
    new Set(all.map((x) => x.id)).size !== all.length
  )
    bad();
  const text = (s: unknown, max = 160) =>
    typeof s === "string" && s.trim().length > 0 && s.length <= max;
  const amount = (n: unknown, zero = false) =>
    typeof n === "number" &&
    Number.isSafeInteger(n) &&
    n <= 1e12 &&
    n >= (zero ? 0 : 1);
  const color = (c: unknown) =>
    typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c);
  if (
    l.accounts.some(
      (a) =>
        !text(a.name, 60) ||
        !["bank", "cash", "savings", "credit"].includes(a.type) ||
        !Number.isSafeInteger(a.opening) ||
        Math.abs(a.opening) > 1e12 ||
        !color(a.color),
    )
  )
    bad();
  if (
    l.categories.some(
      (c) =>
        !text(c.name, 60) ||
        !["income", "expense"].includes(c.kind) ||
        !color(c.color),
    )
  )
    bad();
  const ac = new Set(l.accounts.map((a) => a.id));
  const cat = (id: string | undefined, kind: string) =>
    l.categories.some((c) => c.id === id && c.kind === kind);
  const recur = new Set<string>();
  for (const t of l.transactions) {
    if (
      !["income", "expense", "transfer"].includes(t.kind) ||
      !amount(t.amount) ||
      !validDate(t.date) ||
      !ac.has(t.accountId) ||
      typeof t.note !== "string" ||
      t.note.length > 300
    )
      bad();
    if (t.kind === "transfer") {
      if (
        !ac.has(t.toAccountId || "") ||
        t.toAccountId === t.accountId ||
        t.categoryId
      )
        bad();
    } else if (!cat(t.categoryId, t.kind)) bad();
    if (t.recurringKey) {
      if (typeof t.recurringKey !== "string" || recur.has(t.recurringKey))
        bad();
      recur.add(t.recurringKey);
    }
  }
  const pairs = new Set<string>();
  for (const b of l.budgets) {
    if (
      !cat(b.categoryId, "expense") ||
      !amount(b.amount) ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(b.month) ||
      +b.month.slice(0, 4) < 1280 ||
      +b.month.slice(0, 4) > 1578
    )
      bad();
    const p = b.month + ":" + b.categoryId;
    if (pairs.has(p)) bad();
    pairs.add(p);
  }
  for (const s of l.scheduled)
    if (
      !text(s.name) ||
      !amount(s.amount) ||
      !ac.has(s.accountId) ||
      !cat(s.categoryId, s.kind) ||
      !validDate(s.startDate) ||
      !["once", "monthly"].includes(s.frequency) ||
      (s.endDate && (!validDate(s.endDate) || s.endDate < s.startDate))
    )
      bad();
  for (const g of l.goals)
    if (
      !text(g.name) ||
      !amount(g.target) ||
      !amount(g.saved, true) ||
      g.saved > g.target ||
      (g.deadline && !validDate(g.deadline))
    )
      bad();
  safeSum(l.accounts.map((a) => accountBalance(l, a.id)));
  safeSum(l.accounts.map((a) => Math.abs(a.opening)));
  safeSum(l.transactions.map((t) => t.amount));
}
export function applyTransaction(l: Ledger, t: Transaction) {
  const next = {
    ...l,
    transactions: [...l.transactions.filter((x) => x.id !== t.id), t],
  };
  validateLedger(next);
  return next;
}
export type Due = {
  schedule: Scheduled;
  date: string;
  key: string;
  paid: boolean;
};
export function occurrences(l: Ledger, r: Range): Due[] {
  const out: Due[] = [];
  const paidKeys = new Set(
    l.transactions.map((t) => t.recurringKey).filter(Boolean),
  );
  for (const s of l.scheduled) {
    let d = s.startDate;
    const j = jalaliParts(d);
    let key = monthKey(d),
      count = 0;
    while (d <= r.end && count++ < 4000) {
      if (d >= r.start && (!s.endDate || d <= s.endDate)) {
        const k = s.id + ":" + d;
        out.push({ schedule: s, date: d, key: k, paid: paidKeys.has(k) });
      }
      if (s.frequency === "once") break;
      const nextKey = shiftMonth(key, 1);
      if (nextKey === key) break;
      key = nextKey;
      const [y, m] = key.split("-").map(Number);
      if (y > 1578) break;
      const g = jalaali.toGregorian(
        y,
        m,
        Math.min(j.jd, jalaali.jalaaliMonthLength(y, m)),
      );
      d = iso(g.gy, g.gm, g.gd);
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
export function payOccurrence(l: Ledger, d: Due) {
  if (l.transactions.some((t) => t.recurringKey === d.key))
    throw Error("این پرداخت قبلاً ثبت شده است.");
  return applyTransaction(l, {
    id: uid(),
    kind: d.schedule.kind,
    amount: d.schedule.amount,
    date: d.date,
    accountId: d.schedule.accountId,
    categoryId: d.schedule.categoryId,
    note: d.schedule.name,
    recurringKey: d.key,
  });
}
const demoProfiles = {
  salary: [42000000, 45000000, 43000000, 48000000, 46000000, 51000000],
  freelance: [9000000, 18000000, 6500000, 22000000, 11000000, 16000000],
  rent: [12500000, 12500000, 12500000, 14000000, 14000000, 14000000],
  expenseFactor: [0.85, 1.7, 1.1, 2.6, 1.55, 1.3],
  extraShopping: [0, 6000000, 0, 12000000, 3000000, 0],
};
export function demoLedger(name = "کاربر دمو"): Ledger {
  const l = blankLedger(name);
  l.accounts = [
    {
      id: "bank",
      name: "حساب روزمره",
      type: "bank",
      opening: 8400000,
      color: colors[0],
    },
    {
      id: "cash",
      name: "کیف پول",
      type: "cash",
      opening: 6000000,
      color: colors[2],
    },
    {
      id: "saving",
      name: "حساب پس‌انداز",
      type: "savings",
      opening: 12000000,
      color: colors[1],
    },
  ];
  const cur = monthKey(today());
  const tx = (
    kind: Transaction["kind"],
    amount: number,
    date: string,
    accountId: string,
    note: string,
    categoryId?: string,
    toAccountId?: string,
  ) => {
    if (date > today()) return;
    l.transactions.push({
      id: uid(),
      kind,
      amount,
      date,
      accountId,
      note,
      categoryId,
      toAccountId,
    });
  };
  const { salary, freelance, rent, expenseFactor, extraShopping } = demoProfiles;
  for (let offset = -5; offset <= 0; offset++) {
    const index = offset + 5,
      key = shiftMonth(cur, offset),
      r = monthRange(key);
    const dt = (day: number) => {
      const j = jalaliParts(r.start),
        g = jalaali.toGregorian(j.jy, j.jm, day);
      return iso(g.gy, g.gm, g.gd);
    };
    tx(
      "income",
      salary[index],
      dt(1),
      "bank",
      "حقوق ماهانه",
      "salary",
    );
    tx(
      "income",
      freelance[index],
      dt(8),
      "bank",
      "پروژه طراحی رابط کاربری",
      "freelance",
    );
    tx("expense", rent[index], dt(3), "bank", "اجاره خانه", "home");
    if (extraShopping[index])
      tx("expense", extraShopping[index], dt(12), "bank", "خرید لوازم خانه", "shopping");
    for (
      let day = 2;
      day <= Math.min(28, offset === 0 ? jalaliParts(today()).jd : 28);
      day += 3
    ) {
      const categories = [
        "food",
        "shopping",
        "transport",
        "health",
        "education",
      ];
      const cat = categories[(day + 6 + offset) % 5];
      const notes: Record<string, string> = {
        food: "خرید سوپرمارکت",
        shopping: "خرید لوازم شخصی",
        transport: "تاکسی و رفت‌وآمد",
        health: "باشگاه ورزشی",
        education: "کتاب و دوره آموزشی",
      };
      tx(
        "expense",
        Math.round(
          ([680000, 1250000, 380000, 950000, 420000][day % 5] *
            expenseFactor[index]) / 1000,
        ) * 1000,
        dt(day),
        day % 2 ? "cash" : "bank",
        notes[cat],
        cat,
      );
    }
    tx(
      "transfer",
      5000000,
      dt(5),
      "bank",
      "انتقال به پس‌انداز",
      undefined,
      "saving",
    );
    tx("transfer", 5000000, dt(7), "bank", "شارژ کیف پول", undefined, "cash");
    for (const [categoryId, amount] of [
      ["food", 5000000],
      ["shopping", 4000000],
      ["transport", 2500000],
      ["home", 14000000],
    ] as [string, number][])
      l.budgets.push({ id: uid(), categoryId, amount, month: key });
  }
  const nextMonth = monthRange(shiftMonth(cur, 1));
  l.scheduled = [
    {
      id: uid(),
      name: "اجارهٔ خانه",
      amount: rent[5],
      kind: "expense",
      accountId: "bank",
      categoryId: "home",
      startDate: nextMonth.start,
      frequency: "monthly",
    },
    {
      id: uid(),
      name: "تمدید اینترنت",
      amount: 480000,
      kind: "expense",
      accountId: "bank",
      categoryId: "home",
      startDate: today(),
      frequency: "monthly",
    },
    {
      id: uid(),
      name: "حقوق ماهانه",
      amount: salary[5],
      kind: "income",
      accountId: "bank",
      categoryId: "salary",
      startDate: nextMonth.start,
      frequency: "monthly",
    },
  ];
  l.goals = [
    {
      id: uid(),
      name: "سفر تابستان",
      target: 40000000,
      saved: 12000000,
      deadline: monthRange(shiftMonth(cur, 8)).end,
    },
    {
      id: uid(),
      name: "صندوق اضطراری",
      target: 100000000,
      saved: 35000000,
      deadline: "",
    },
  ];
  validateLedger(l);
  return l;
}

// Update only recognizable, unedited seed amounts; preserve IDs and user entries.
export function upgradeDemoLedger(l: Ledger): Ledger {
  const candidates = new Map<string, number>();
  for (const t of l.transactions) {
    if (t.kind !== "income" || t.accountId !== "bank" || t.recurringKey) continue;
    const day = jalaliParts(t.date).jd;
    const offset = t.categoryId === "salary" && t.note === "حقوق ماهانه" && day === 1
      ? (t.amount - 45000000) / 600000
      : t.categoryId === "freelance" && t.note === "پروژه طراحی رابط کاربری" && day === 8
        ? (t.amount - 12000000) / 200000
        : NaN;
    if (!Number.isInteger(offset) || offset < -5 || offset > 0) continue;
    const seedMonth = shiftMonth(monthKey(t.date), -offset);
    candidates.set(seedMonth, (candidates.get(seedMonth) || 0) + 1);
  }
  const seed = [...candidates].sort((a, b) => b[1] - a[1])[0];
  // Recent variable demos and custom data do not match the old six-month seed.
  if (!seed || seed[1] < 3) return l;
  const indices = new Map(Array.from({ length: 6 }, (_, i) => [shiftMonth(seed[0], i - 5), i]));
  const categories = ["food", "shopping", "transport", "health", "education"],
    notes = ["خرید سوپرمارکت", "خرید لوازم شخصی", "تاکسی و رفت‌وآمد", "باشگاه ورزشی", "کتاب و دوره آموزشی"],
    baseExpenses = [680000, 1250000, 380000, 950000, 420000];
  let changed = false;
  const transactions = l.transactions.map((t) => {
    const index = indices.get(monthKey(t.date));
    if (index === undefined || t.recurringKey || t.kind === "transfer") return t;
    const day = jalaliParts(t.date).jd;
    let oldAmount: number | undefined, amount = t.amount;
    if (t.kind === "income" && t.accountId === "bank") {
      if (t.categoryId === "salary" && t.note === "حقوق ماهانه" && day === 1) {
        oldAmount = 45000000 + (index - 5) * 600000;
        amount = demoProfiles.salary[index];
      } else if (t.categoryId === "freelance" && t.note === "پروژه طراحی رابط کاربری" && day === 8) {
        oldAmount = 12000000 + (index - 5) * 200000;
        amount = demoProfiles.freelance[index];
      }
    } else if (t.kind === "expense") {
      if (t.categoryId === "home" && t.note === "اجاره خانه" && day === 3 && t.accountId === "bank") {
        oldAmount = 12500000;
        amount = demoProfiles.rent[index];
      } else if (day >= 2 && day <= 28 && (day - 2) % 3 === 0) {
        const categoryIndex = (day + 1 + index) % 5;
        if (t.categoryId === categories[categoryIndex] && t.note === notes[categoryIndex] &&
          t.accountId === (day % 2 ? "cash" : "bank")) {
          oldAmount = baseExpenses[day % 5] + index * 45000;
          amount = Math.round(baseExpenses[day % 5] * demoProfiles.expenseFactor[index] / 1000) * 1000;
        }
      }
    }
    if (t.amount !== oldAmount || amount === t.amount) return t;
    changed = true;
    return { ...t, amount };
  });
  if (!changed) return l;
  const next = { ...l, transactions };
  validateLedger(next);
  return next;
}
export type FlowNode = {
  id: string;
  name: string;
  value: number;
  color: string;
};
export function flowData(l: Ledger, r: Range) {
  const s = summary(l, r),
    group = (kind: "income" | "expense"): FlowNode[] =>
      l.categories
        .filter((c) => c.kind === kind)
        .map((c) => ({
          id: c.id,
          name: c.name,
          color: displayColor(c.color),
          value: safeSum(
            l.transactions
              .filter(
                (t) =>
                  t.kind === kind &&
                  t.categoryId === c.id &&
                  inRange(t.date, r),
              )
              .map((t) => t.amount),
          ),
        }))
        .filter((c) => c.value > 0)
        .sort((a, b) => b.value - a.value);
  const sources = group("income"),
    targets = group("expense");
  if (s.surplus > 0)
    targets.unshift({
      id: "surplus",
      name: "مازاد دوره",
      value: s.surplus,
      color: colors[1],
    });
  if (s.surplus < 0)
    sources.push({
      id: "deficit",
      name: "برداشت از موجودی",
      value: -s.surplus,
      color: colors[2],
    });
  return { sources, targets, total: Math.max(s.income, s.expense), ...s };
}
export function csvExport(l: Ledger, r: Range) {
  const esc = (s: string) => '"' + s.replace(/"/g, '""') + '"';
  return (
    "\ufeff" +
    [
      ["تاریخ", "نوع", "شرح", "حساب", "حساب مقصد", "دسته", "مبلغ تومان"],
      ...l.transactions
        .filter((t) => inRange(t.date, r))
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((t) => [
          toJalali(t.date),
          { income: "درآمد", expense: "هزینه", transfer: "انتقال" }[t.kind],
          t.note,
          l.accounts.find((a) => a.id === t.accountId)?.name || "",
          l.accounts.find((a) => a.id === t.toAccountId)?.name || "",
          l.categories.find((c) => c.id === t.categoryId)?.name || "",
          String(t.kind === "expense" ? -t.amount : t.amount),
        ]),
    ]
      .map((row) =>
        row
          .map((v, i) => esc(i !== 6 && /^[=+@\-\t\r]/.test(v) ? "'" + v : v))
          .join(","),
      )
      .join("\r\n")
  );
}
