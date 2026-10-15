import { displayColor } from "./palette";
import { useEffect, useRef, useState, useMemo } from "react";
import type { FormEvent } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  ChartNoAxesCombined,
  CalendarDays,
  Settings,
  Plus,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Search,
  SlidersHorizontal,
  Download,
  Upload,
  ShieldCheck,
  LockKeyhole,
  Mail,
  ArrowUpLeft,
  Check,
  MoreHorizontal,
  Pencil,
  Target,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  Eye,
  EyeOff,
  X,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  signup,
  login,
  demoLogin,
  refreshDemoSession,
  saveLedger,
  changePassword,
  exportBackup,
  importBackup,
} from "./db";
import type { Session } from "./db";
import {
  fa,
  money,
  today,
  toJalali,
  fromJalali,
  monthKey,
  monthRange,
  monthTitle,
  shiftMonth,
  summary,
  accountBalance,
  categorySpend,
  occurrences,
  payOccurrence,
  demoLedger,
  csvExport,
  validateLedger,
  inRange,
  safeSum,
  colors,
} from "./model";
import type { Ledger, Range, Due } from "./model";
import {
  Modal,
  Field,
  Panel,
  Empty,
  Stat,
  Progress,
  TxList,
  download,
  categoryIcon,
} from "./ui";
import { CashFlow, SpendingChart } from "./Charts";
import { EntityEditor, editorTitle } from "./Editors";
import type { Editor } from "./Editors";
type Page =
  | "overview"
  | "transactions"
  | "accounts"
  | "budgets"
  | "reports"
  | "planning"
  | "settings";
const pages: { id: Page; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "نمای کلی", icon: LayoutDashboard },
  { id: "transactions", label: "تراکنش‌ها", icon: ArrowLeftRight },
  { id: "accounts", label: "حساب‌ها", icon: Wallet },
  { id: "budgets", label: "بودجه", icon: Target },
  { id: "reports", label: "گزارش‌ها", icon: ChartNoAxesCombined },
  { id: "planning", label: "برنامه‌ریزی", icon: CalendarDays },
  { id: "settings", label: "تنظیمات", icon: Settings },
];
const accountTypes = {
  bank: "حساب بانکی",
  cash: "نقد و کیف پول",
  savings: "حساب پس‌انداز",
  credit: "اعتباری و بدهی",
};
function Auth({ onLogin }: { onLogin: (s: Session) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [show, setShow] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      if (!crypto.subtle)
        throw Error(
          "برای محافظت از اطلاعات، برنامه را با HTTPS یا localhost باز کنید.",
        );
      const u = String(f.get("username")),
        p = String(f.get("password"));
      onLogin(
        mode === "login" &&
          u.trim().toLowerCase() === "demo" &&
          p === "Demo2026!"
          ? await demoLogin()
          : mode === "signup"
            ? await signup(u, p, String(f.get("name")))
            : await login(u, p),
      );
    } catch (e) {
      setError(storageError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <div className="auth-art" aria-hidden="true">
        <div className="art-top">
          <span className="brand-mark">
            <ChartNoAxesCombined size={25} />
          </span>
          <span>مدیریت مالی شخصی</span>
        </div>
        <div className="art-copy">
          <span className="eyebrow">پولتان را روشن‌تر ببینید.</span>
          <h1>
            از اولین درآمد،
            <br />
            تا تصمیم بعدی.
          </h1>
          <p>
            حساب‌ها، هزینه‌ها و برنامه‌های مالی‌تان؛
            <br />
            همه در یک فضای شخصی.
          </p>
        </div>
        <div className="art-flow">
          <span>درآمد</span>
          <svg viewBox="0 0 500 180">
            <path
              d="M 0 70 C 180 70 240 30 500 30 L 500 75 C 240 75 180 110 0 110 Z"
              fill="#c9b079"
              opacity=".4"
            />
            <path
              d="M 0 110 C 200 110 200 100 500 100 L 500 122 C 200 122 200 130 0 130 Z"
              fill="#7fbaaa"
              opacity=".4"
            />
            <path
              d="M 0 130 C 200 130 240 150 500 150 L 500 164 C 240 164 200 144 0 144 Z"
              fill="#c49a70"
              opacity=".35"
            />
          </svg>
          <div>
            <span>زندگی</span>
            <span>پس‌انداز</span>
            <span>آینده</span>
          </div>
        </div>
        <footer>
          <LockKeyhole size={15} /> ذخیره‌سازی محلی و رمزگذاری‌شده
        </footer>
      </div>
      <main className="auth-main">
        <div className="auth-card">
          <div className="mobile-brand">
            <ChartNoAxesCombined size={22} /> مدیریت مالی شخصی
          </div>
          <span className="eyebrow">دفتر مالی شما</span>
          <h2>{mode === "login" ? "خوش برگشتی." : "یک شروع مرتب."}</h2>
          <p>
            {mode === "login"
              ? "برای دیدن حساب‌هایت وارد شو."
              : "حساب شخصی‌ات را در همین مرورگر بساز."}
          </p>
          <form onSubmit={submit}>
            {mode === "signup" && (
              <Field label="نام شما">
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={80}
                  placeholder="نامی که دوست داری صدایت کنیم"
                />
              </Field>
            )}
            <Field label="نام کاربری یا ایمیل">
              <input
                name="username"
                autoComplete="username"
                dir="ltr"
                required
                minLength={3}
                maxLength={80}
                placeholder="yourname"
              />
            </Field>
            <Field label="رمز عبور">
              <span className="password-field">
                <input
                  name="password"
                  type={show ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  dir="ltr"
                  required
                  minLength={mode === "signup" ? 8 : 1}
                  maxLength={128}
                />
                <button
                  type="button"
                  aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </Field>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <button className="primary full" disabled={busy}>
              {busy
                ? "در حال بازکردن دفتر…"
                : mode === "login"
                  ? "ورود به حساب"
                  : "ساخت حساب"}
              <ArrowUpLeft size={18} />
            </button>
          </form>
          <p className="auth-switch">
            {mode === "login" ? "حساب نداری؟" : "حساب ساخته‌ای؟"}{" "}
            <button
              className="text-btn"
              disabled={busy}
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
              }}
            >
              {mode === "login" ? "ساخت حساب جدید" : "ورود به حساب"}
            </button>
          </p>
          <div className="auth-divider">
            <span>اول می‌خواهی ببینی؟</span>
          </div>
          <button
            className="secondary full"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                onLogin(await demoLogin());
              } catch (e) {
                setError(storageError(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            ورود به نسخهٔ دمو <ChartNoAxesCombined size={17} />
          </button>
          <small className="demo-credentials" dir="ltr">
            demo / Demo2026!
          </small>
          <div className="local-note">
            <ShieldCheck size={19} />
            <p>
              داده‌ها فقط در همین مرورگر ذخیره و با رمز شما قفل می‌شوند.
              همگام‌سازی و بازیابی رمز نداریم؛ نسخهٔ پشتیبان نگه دارید.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
function storageError(e: unknown) {
  const err = e as Error;
  return err.name === "QuotaExceededError"
    ? "فضای ذخیره‌سازی مرورگر پر شده است. فایل پشتیبان بگیرید و فضا آزاد کنید."
    : err.name === "SecurityError" || err.name === "InvalidStateError"
      ? "ذخیره‌سازی مرورگر در دسترس نیست. دسترسی ذخیره‌سازی را بررسی کنید."
      : err.message || "ذخیره اطلاعات انجام نشد. دوباره تلاش کنید.";
}
export default function App() {
  const [session, setSession] = useState<Session | null>(null),
    ref = useRef<Session | null>(null),
    busyRef = useRef(false),
    [busy, setBusy] = useState(false),
    [page, setPage] = useState<Page>("overview"),
    [month, setMonth] = useState(monthKey(today())),
    [custom, setCustom] = useState<Range | null>(null),
    [editor, setEditor] = useState<Editor | null>(null),
    [modal, setModal] = useState<
      "profile" | "range" | "more" | "backup" | "import" | "password" | null
    >(null),
    [toast, setToast] = useState(""),
    [offline, setOffline] = useState(!navigator.onLine),
    [query, setQuery] = useState(""),
    [kindFilter, setKindFilter] = useState("all"),
    [accountFilter, setAccountFilter] = useState("all"),
    [categoryFilter, setCategoryFilter] = useState("all"),
    [planningTab, setPlanningTab] = useState<"scheduled" | "goals">(
      "scheduled",
    );
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const current = ref.current;
    if (!current?.demo) return;
    let cancelled = false;
    refreshDemoSession(current).then((next) => {
      if (!cancelled && ref.current === current && !busyRef.current) {
        ref.current = next;
        setSession(next);
      }
    }).catch((e) => {
      if (!cancelled) setToast(storageError(e));
    });
    return () => { cancelled = true; };
  }, [session?.id]);
  const enter = (s: Session) => {
    ref.current = s;
    setSession(s);
    setPage("overview");
    setCustom(null);
    setMonth(monthKey(today()));
    setQuery("");
    setKindFilter("all");
    setAccountFilter("all");
    setCategoryFilter("all");
    setModal(null);
    setEditor(null);
  };
  const logout = () => {
    if (busyRef.current) return;
    ref.current = null;
    setSession(null);
    setEditor(null);
    setModal(null);
    setQuery("");
    setToast("");
  };
  async function commit(ledger: Ledger) {
    const current = ref.current;
    if (!current || busyRef.current)
      throw Error("کمی صبر کنید؛ تغییر قبلی در حال ذخیره است.");
    busyRef.current = true;
    setBusy(true);
    try {
      validateLedger(ledger);
      const next = await saveLedger(current, ledger);
      if (ref.current?.id === current.id) {
        ref.current = next;
        setSession(next);
      }
      setToast("اطلاعات ذخیره شد.");
    } catch (e) {
      throw Error(storageError(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function run(fn: () => Promise<void>) {
    try {
      await fn();
    } catch (e) {
      setToast(storageError(e));
    }
  }
  const range = custom || monthRange(month);
  const l = session?.ledger;
  const stats = useMemo(
    () => (l ? summary(l, range) : null),
    [l, range.start, range.end],
  );
  const filtered = useMemo(
    () =>
      l
        ? l.transactions
            .filter(
              (t) =>
                inRange(t.date, range) &&
                (kindFilter === "all" || t.kind === kindFilter) &&
                (accountFilter === "all" ||
                  t.accountId === accountFilter ||
                  t.toAccountId === accountFilter) &&
                (categoryFilter === "all" || t.categoryId === categoryFilter) &&
                [
                  t.note,
                  l.accounts.find((a) => a.id === t.accountId)?.name,
                  l.categories.find((c) => c.id === t.categoryId)?.name,
                ]
                  .join(" ")
                  .toLowerCase()
                  .includes(query.trim().toLowerCase()),
            )
            .sort(
              (a, b) =>
                b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
            )
        : [],
    [
      l,
      range.start,
      range.end,
      kindFilter,
      accountFilter,
      categoryFilter,
      query,
    ],
  );
  const [limit, setLimit] = useState(30);
  useEffect(
    () => setLimit(30),
    [query, kindFilter, accountFilter, categoryFilter, month, custom],
  );
  if (!session || !l || !stats) return <Auth onLogin={enter} />;
  const navigate = (p: Page) => {
    setPage(p);
    setModal(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const currentBudgets = l.budgets.filter((b) => b.month === month);
  const budgetTotal = safeSum(currentBudgets.map((b) => b.amount));
  const budgetSpent = safeSum(
    currentBudgets.map((b) =>
      categorySpend(l, b.categoryId, monthRange(month)),
    ),
  );
  const dueRange = {
    start: monthRange(shiftMonth(month, -1)).start,
    end: monthRange(shiftMonth(month, 1)).end,
  };
  const due = occurrences(l, dueRange);
  const upcoming = due.filter((d) => !d.paid).slice(0, 4);
  const openTx = () => setEditor({ type: "transaction" });
  const viewTransaction = (t: Ledger["transactions"][number]) =>
    setEditor({ type: "transaction", item: t });
  const pay = async (d: Due) => {
    if (
      d.date > today() &&
      !confirm("سررسید در آینده است. تراکنش با تاریخ سررسید ثبت شود؟")
    )
      return;
    await run(() => commit(payOccurrence(ref.current!.ledger, d)));
  };
  const futureCount = l.transactions.filter(
    (t) => inRange(t.date, range) && t.date > today(),
  ).length;
  const budgetRows = (full = false) =>
    currentBudgets.length ? (
      <div className="budget-list">
        {currentBudgets.slice(0, full ? undefined : 4).map((b) => {
          const c = l.categories.find((c) => c.id === b.categoryId)!,
            spent = categorySpend(l, b.categoryId, monthRange(b.month)),
            pct = (spent / b.amount) * 100;
          return (
            <button
              key={b.id}
              className="budget-row"
              onClick={() => setEditor({ type: "budget", item: b })}
            >
              <span className="row-between">
                <strong>{c.name}</strong>
                <span className={pct > 100 ? "expense" : "muted"}>
                  {fa(spent)} <small>/ {fa(b.amount)}</small>
                </span>
              </span>
              <Progress
                value={pct}
                color={pct > 100 ? "var(--red)" : displayColor(c.color)}
              />
              <span className="row-between small muted">
                <span>
                  {pct > 100
                    ? money(spent - b.amount) + " بیشتر از بودجه"
                    : money(b.amount - spent) + " باقی‌مانده"}
                </span>
                <span>{fa(Math.round(pct))}٪</span>
              </span>
            </button>
          );
        })}
      </div>
    ) : (
      <Empty
        title="بودجهٔ این ماه را بچین"
        text="برای هر دسته سقف هزینه تعیین کن."
        action={
          <button
            className="text-btn"
            onClick={() => setEditor({ type: "budget" })}
          >
            افزودن بودجه +
          </button>
        }
      />
    );
  const dueRows = (items: Due[], detailed = false) =>
    items.length ? (
      <div className="due-list">
        {items.map((d) => (
          <div className="due-row" key={d.key}>
            <span
              className={
                "due-date " + (d.date < today() && !d.paid ? "late" : "")
              }
            >
              {toJalali(d.date).slice(8)}
              <small>{monthTitle(monthKey(d.date)).split(" ")[0]}</small>
            </span>
            <span className="due-copy">
              <strong>{d.schedule.name}</strong>
              <small>
                {money(d.schedule.amount)} ·{" "}
                {l.accounts.find((a) => a.id === d.schedule.accountId)?.name}
              </small>
              {detailed && (
                <small>
                  {d.paid
                    ? "ثبت شده"
                    : d.date < today()
                      ? "سررسید گذشته"
                      : d.schedule.kind === "income"
                        ? "دریافتنی"
                        : "پرداختنی"}
                </small>
              )}
            </span>
            {d.paid ? (
              <CheckCircle2 size={17} className="income" />
            ) : (
              <button
                className="small-btn"
                disabled={busy}
                onClick={() => pay(d)}
              >
                ثبت {d.schedule.kind === "income" ? "دریافت" : "پرداخت"}
              </button>
            )}
            {detailed && (
              <button
                className="icon-btn"
                aria-label={"ویرایش " + d.schedule.name}
                onClick={() =>
                  setEditor({ type: "scheduled", item: d.schedule })
                }
              >
                <Pencil size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
    ) : (
      <Empty title="سررسیدی در این بازه نیست" />
    );
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate("overview")}>
          <ChartNoAxesCombined size={25} />
          <span>مدیریت مالی</span>
        </button>
        <nav className="desktop-nav" aria-label="ناوبری اصلی">
          {pages
            .filter((p) => p.id !== "settings")
            .map((p) => (
              <button
                key={p.id}
                className={page === p.id ? "active" : ""}
                onClick={() => navigate(p.id)}
              >
                {p.label}
              </button>
            ))}
        </nav>
        <div className="topbar-left">
          <button
            className="icon-btn desktop-only"
            aria-label="تنظیمات"
            onClick={() => navigate("settings")}
          >
            <Settings size={18} />
          </button>
          <button
            className="profile-btn"
            onClick={() => setModal("profile")}
            aria-label="حساب کاربری"
          >
            <span>{l.name.slice(0, 1)}</span>
            <span className="desktop-only">{l.name}</span>
          </button>
        </div>
      </header>
      <main className="workspace">
        <div className="page-heading">
          <div>
            <div className="title-line">
              <h1>{pages.find((p) => p.id === page)?.label}</h1>
              {session.demo && <span className="badge">حساب دمو</span>}
            </div>
            <p>
              {page === "overview"
                ? "تصویر روشن‌تری از دخل‌وخرجت."
                : page === "transactions"
                  ? "هر مبلغ، یک داستان؛ همه را مرتب نگه دار."
                  : page === "accounts"
                    ? "موجودی و گردش حساب‌ها در یک نگاه."
                    : page === "budgets"
                      ? "قبل از خرج‌کردن، برای پولت برنامه بچین."
                      : page === "planning"
                        ? "سررسیدها و هدف‌هایی که نباید فراموش شوند."
                        : page === "reports"
                          ? "پول از کجا آمده و کجا رفته است؟"
                          : "دفترت را مطابق خودت تنظیم کن."}
            </p>
          </div>
          <div className="heading-actions">
            <div className="month-switch">
              <button
                className="icon-btn"
                onClick={() => {
                  setMonth(shiftMonth(month, -1));
                  setCustom(null);
                }}
                aria-label="ماه قبل"
              >
                <ChevronRight size={17} />
              </button>
              <button className="month-label" onClick={() => setModal("range")}>
                {custom ? "بازهٔ دلخواه" : monthTitle(month)}
                <CalendarDays size={15} />
              </button>
              <button
                className="icon-btn"
                onClick={() => {
                  setMonth(shiftMonth(month, 1));
                  setCustom(null);
                }}
                aria-label="ماه بعد"
              >
                <ChevronLeft size={17} />
              </button>
            </div>
            <button className="primary desktop-add" onClick={openTx}>
              <Plus size={18} />
              ثبت تراکنش
            </button>
          </div>
        </div>
        {offline && (
          <div className="notice">
            <WifiOff size={17} />
            <span>
              آفلاین هستید؛ اطلاعات همچنان روی همین دستگاه ذخیره می‌شود.
            </span>
          </div>
        )}
        {session.demo && (
          <div className="demo-notice">
            <span>
              <i />
              داده‌های این حساب نمونه‌اند. تغییرات دمو فقط در مرورگر شما ذخیره
              می‌شوند.
            </span>
            <button className="text-btn" disabled={busy} onClick={logout}>
              ساخت حساب شخصی
              <ArrowUpLeft size={14} />
            </button>
          </div>
        )}
        {futureCount > 0 && (
          <div className="notice">
            <AlertCircle size={16} />
            {fa(futureCount)} تراکنش با تاریخ آینده در این بازه ثبت شده و در
            جمع‌های بازه لحاظ می‌شود.
          </div>
        )}
        {(page === "overview" || page === "reports") && (
          <>
            <section className="stats-strip" aria-label="خلاصهٔ مالی">
              <Stat
                label="موجودی حساب‌ها"
                value={stats.balance}
                sub="مانده تا پایان بازهٔ انتخابی"
              />
              <Stat
                label="درآمد بازه"
                value={stats.income}
                tone="income"
                sub="مجموع دریافت‌های ثبت‌شده"
              />
              <Stat
                label="هزینهٔ بازه"
                value={stats.expense}
                tone="expense"
                sub="بدون انتقال بین حساب‌ها"
              />
              <Stat
                label="مازاد دوره"
                value={stats.surplus}
                sub={
                  stats.rate === null
                    ? "در این بازه درآمدی ثبت نشده"
                    : `${fa(Math.round(stats.rate))}٪ از درآمد دوره`
                }
              />
            </section>
            <div className="charts-grid">
              <Panel
                title="مسیر پول"
                meta={
                  <span className="subtle">
                    تومان · {custom ? "بازهٔ انتخابی" : monthTitle(month)}
                  </span>
                }
                className="flow-panel"
              >
                <CashFlow l={l} range={range} />
              </Panel>
              <Panel
                title="درآمد و هزینه"
                meta={
                  <span className="subtle">
                    ۶ ماه منتهی به{" "}
                    {monthTitle(monthKey(range.end)).split(" ")[0]}
                  </span>
                }
              >
                <SpendingChart l={l} month={monthKey(range.end)} />
              </Panel>
            </div>
          </>
        )}
        {page === "overview" && (
          <>
            <div className="overview-bottom">
              <Panel
                title="آخرین تراکنش‌ها"
                meta={
                  <button
                    className="text-btn"
                    onClick={() => navigate("transactions")}
                  >
                    مشاهده همه
                    <ChevronLeft size={13} />
                  </button>
                }
              >
                <TxList
                  l={l}
                  items={l.transactions
                    .filter((t) => inRange(t.date, range))
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 5)}
                  onSelect={viewTransaction}
                />
              </Panel>
              <Panel
                title="بودجهٔ ماهانه"
                meta={
                  <button
                    className="icon-btn"
                    aria-label="افزودن بودجه"
                    onClick={() => setEditor({ type: "budget" })}
                  >
                    <Plus size={17} />
                  </button>
                }
              >
                {budgetRows()}
                <div className="panel-foot">
                  {monthTitle(month)} · {fa(currentBudgets.length)} دسته
                </div>
              </Panel>
              <Panel
                title="پرداخت‌های پیش رو"
                meta={
                  <button
                    className="text-btn"
                    onClick={() => navigate("planning")}
                  >
                    همه
                    <ChevronLeft size={13} />
                  </button>
                }
              >
                {dueRows(upcoming)}
                <div className="panel-foot">
                  سررسیدها با ثبت شما به تراکنش تبدیل می‌شوند.
                </div>
              </Panel>
            </div>
            {!l.accounts.length && (
              <div className="onboarding">
                <Wallet size={26} />
                <div>
                  <h2>اولین قدم: یک حساب بساز.</h2>
                  <p>
                    موجودی اولیه را وارد کن، بعد اولین درآمد یا هزینه‌ات را ثبت
                    کن.
                  </p>
                </div>
                <button
                  className="primary"
                  onClick={() => setEditor({ type: "account" })}
                >
                  ساخت حساب
                  <Plus size={17} />
                </button>
              </div>
            )}
          </>
        )}
        {page === "transactions" && (
          <Panel
            title="دفتر تراکنش‌ها"
            meta={
              <button
                className="secondary small-btn"
                onClick={() => {
                  download(
                    csvExport(l, range),
                    "transactions.csv",
                    "text/csv;charset=utf-8",
                  );
                  setToast(
                    "خروجی CSV آماده شد؛ فایل شامل اطلاعات خوانای مالی است.",
                  );
                }}
              >
                <Download size={15} />
                خروجی CSV
              </button>
            }
          >
            <div className="filters">
              <label className="search-field">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جست‌وجو در شرح و حساب…"
                  aria-label="جست‌وجوی تراکنش"
                />
              </label>
              <select
                aria-label="نوع تراکنش"
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value)}
              >
                <option value="all">همهٔ انواع</option>
                <option value="expense">هزینه</option>
                <option value="income">درآمد</option>
                <option value="transfer">انتقال</option>
              </select>
              <select
                aria-label="فیلتر حساب"
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
              >
                <option value="all">همهٔ حساب‌ها</option>
                {l.accounts.map((a) => (
                  <option value={a.id} key={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="فیلتر دسته"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">همهٔ دسته‌ها</option>
                {l.categories.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-summary">
              <span>{fa(filtered.length)} تراکنش</span>
              <span>
                درآمد:{" "}
                {money(
                  safeSum(
                    filtered
                      .filter((t) => t.kind === "income")
                      .map((t) => t.amount),
                  ),
                )}{" "}
                · هزینه:{" "}
                {money(
                  safeSum(
                    filtered
                      .filter((t) => t.kind === "expense")
                      .map((t) => t.amount),
                  ),
                )}
              </span>
            </div>
            <TxList
              l={l}
              items={filtered.slice(0, limit)}
              onSelect={viewTransaction}
            />
            {filtered.length > limit && (
              <button
                className="secondary load-more"
                onClick={() => setLimit(limit + 30)}
              >
                نمایش بیشتر
              </button>
            )}
          </Panel>
        )}
        {page === "accounts" && (
          <>
            <div className="section-toolbar">
              <p className="muted">
                مانده‌ها تا امروز، {toJalali(today())} محاسبه شده‌اند.
              </p>
              <button
                className="secondary"
                onClick={() => setEditor({ type: "account" })}
              >
                <Plus size={16} />
                حساب جدید
              </button>
            </div>
            <div className="account-grid">
              {l.accounts.map((a) => {
                const balance = accountBalance(l, a.id, today());
                return (
                  <section className="account-card" key={a.id}>
                    <div className="row-between">
                      <span
                        className="account-symbol"
                        style={{
                          color: displayColor(a.color),
                          background: displayColor(a.color) + "15",
                        }}
                      >
                        <Wallet size={22} />
                      </span>
                      <button
                        className="icon-btn"
                        aria-label={"ویرایش " + a.name}
                        onClick={() => setEditor({ type: "account", item: a })}
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                    <h2>{a.name}</h2>
                    <p>{accountTypes[a.type]}</p>
                    <strong className={balance < 0 ? "expense" : ""}>
                      {fa(balance)} <small>تومان</small>
                    </strong>
                    <div className="account-actions">
                      <button
                        onClick={() => {
                          setAccountFilter(a.id);
                          setPage("transactions");
                        }}
                      >
                        گردش حساب
                        <ArrowUpLeft size={14} />
                      </button>
                      <button
                        disabled={l.accounts.length < 2}
                        onClick={() =>
                          setEditor({ type: "transaction", kind: "transfer" })
                        }
                      >
                        انتقال
                        <ArrowLeftRight size={14} />
                      </button>
                    </div>
                  </section>
                );
              })}
            </div>
            {!l.accounts.length && (
              <Empty
                title="هنوز حسابی نداری"
                text="حساب بانکی، کیف پول نقد یا حساب پس‌انداز اضافه کن."
              />
            )}
            <Panel title="ترکیب موجودی حساب‌ها">
              <div className="asset-stack">
                {l.accounts
                  .filter((a) => accountBalance(l, a.id, today()) > 0)
                  .map((a) => {
                    const total = safeSum(
                        l.accounts.map((x) =>
                          Math.max(0, accountBalance(l, x.id, today())),
                        ),
                      ),
                      b = accountBalance(l, a.id, today());
                    return (
                      <span
                        key={a.id}
                        style={{
                          width: `${(b / total) * 100}%`,
                          background: displayColor(a.color),
                        }}
                        title={`${a.name}: ${money(b)}`}
                      />
                    );
                  })}
              </div>
              <div className="asset-legend">
                {l.accounts.map((a) => (
                  <span key={a.id}>
                    <i style={{ background: displayColor(a.color) }} />
                    {a.name}
                    <b
                      className={
                        accountBalance(l, a.id, today()) < 0 ? "expense" : ""
                      }
                    >
                      {money(accountBalance(l, a.id, today()))}
                    </b>
                  </span>
                ))}
              </div>
              <p className="hint padded">
                نوار فقط مانده‌های مثبت را نشان می‌دهد. ماندهٔ منفی به‌عنوان
                بدهی جداگانه در لیست مشخص است.
              </p>
            </Panel>
          </>
        )}
        {page === "budgets" && (
          <>
            <div className="section-toolbar">
              <p className="muted">
                بودجه‌بندی برای {monthTitle(month)}؛ مستقل از بازهٔ دلخواه
                گزارش.
              </p>
              <button
                className="secondary"
                onClick={() => setEditor({ type: "budget" })}
              >
                <Plus size={16} />
                بودجه جدید
              </button>
            </div>
            <div className="budget-summary">
              <span>
                سقف کل<b>{money(budgetTotal)}</b>
              </span>
              <span>
                خرج دسته‌های بودجه‌دار<b>{money(budgetSpent)}</b>
              </span>
              <span>
                ماندهٔ برنامه
                <b className={budgetTotal - budgetSpent < 0 ? "expense" : ""}>
                  {money(budgetTotal - budgetSpent)}
                </b>
              </span>
            </div>
            <Panel title="بودجهٔ دسته‌ها">{budgetRows(true)}</Panel>
            <p className="hint">
              هزینهٔ دسته‌های بدون بودجه در این جمع لحاظ نشده است. برای دیدن کل
              هزینه‌ها به گزارش‌ها بروید.
            </p>
          </>
        )}
        {page === "reports" && (
          <div className="report-bottom">
            <Panel title="هزینه‌ها به تفکیک دسته">
              {l.categories
                .filter(
                  (c) =>
                    c.kind === "expense" && categorySpend(l, c.id, range) > 0,
                )
                .sort(
                  (a, b) =>
                    categorySpend(l, b.id, range) -
                    categorySpend(l, a.id, range),
                )
                .map((c) => {
                  const v = categorySpend(l, c.id, range);
                  return (
                    <div className="report-row" key={c.id}>
                      <span className="row-between">
                        <strong>
                          <i style={{ background: displayColor(c.color) }} />
                          {c.name}
                        </strong>
                        <b>{money(v)}</b>
                      </span>
                      <Progress
                        value={stats.expense ? (v / stats.expense) * 100 : 0}
                        color={displayColor(c.color)}
                      />
                      <small className="muted">
                        {fa(Math.round((v / (stats.expense || 1)) * 100))}٪ از
                        کل هزینه
                      </small>
                    </div>
                  );
                })}
              {!stats.expense && (
                <Empty title="در این بازه هزینه‌ای ثبت نشده" />
              )}
            </Panel>
            <Panel title="خلاصهٔ قابل خروجی">
              <div className="report-highlights">
                <span>
                  بازه
                  <strong>
                    {toJalali(range.start)} تا {toJalali(range.end)}
                  </strong>
                </span>
                <span>
                  تعداد تراکنش‌ها
                  <strong>
                    {fa(
                      l.transactions.filter((t) => inRange(t.date, range))
                        .length,
                    )}
                  </strong>
                </span>
                <span>
                  نرخ مازاد به درآمد
                  <strong>
                    {stats.rate === null
                      ? "بدون درآمد"
                      : fa(Math.round(stats.rate)) + "٪"}
                  </strong>
                </span>
                <span>
                  تراز درآمد و هزینه
                  <strong className={stats.surplus < 0 ? "expense" : "income"}>
                    {money(stats.surplus)}
                  </strong>
                </span>
              </div>
              <div className="padded">
                <button
                  className="secondary full"
                  onClick={() =>
                    download(
                      csvExport(l, range),
                      "finance-report.csv",
                      "text/csv;charset=utf-8",
                    )
                  }
                >
                  <Download size={16} />
                  دریافت تراکنش‌های این بازه
                </button>
              </div>
              <p className="hint padded">
                مازاد دوره با پس‌انداز واقعی تفاوت دارد. انتقال به حساب پس‌انداز
                یک جابه‌جایی داخلی است و دوباره به درآمد اضافه نمی‌شود.
              </p>
            </Panel>
          </div>
        )}
        {page === "planning" && (
          <>
            <div className="section-toolbar">
              <div className="segmented">
                <button
                  className={planningTab === "scheduled" ? "selected" : ""}
                  onClick={() => setPlanningTab("scheduled")}
                >
                  سررسیدها
                </button>
                <button
                  className={planningTab === "goals" ? "selected" : ""}
                  onClick={() => setPlanningTab("goals")}
                >
                  هدف‌های پس‌انداز
                </button>
              </div>
              <button
                className="secondary"
                onClick={() =>
                  setEditor({
                    type: planningTab === "scheduled" ? "scheduled" : "goal",
                  })
                }
              >
                <Plus size={16} />
                {planningTab === "scheduled" ? "سررسید جدید" : "هدف جدید"}
              </button>
            </div>
            {planningTab === "scheduled" ? (
              <>
                <Panel
                  title={"تقویم سررسید · " + monthTitle(month)}
                  meta={<span className="subtle">ماه قبل تا ماه بعد</span>}
                >
                  {dueRows(due, true)}
                </Panel>
                <Panel title="الگوهای پرداخت و دریافت">
                  {l.scheduled.map((s) => (
                    <button
                      className="setting-row"
                      key={s.id}
                      onClick={() => setEditor({ type: "scheduled", item: s })}
                    >
                      <CalendarDays size={18} />
                      <span>
                        <strong>{s.name}</strong>
                        <small>
                          {money(s.amount)} ·{" "}
                          {s.frequency === "monthly"
                            ? "تکرار ماهانه"
                            : "یک‌بار"}{" "}
                          · از {toJalali(s.startDate)}
                        </small>
                      </span>
                      <Pencil size={15} />
                    </button>
                  ))}
                  {!l.scheduled.length && (
                    <Empty title="پرداختی برنامه‌ریزی نشده" />
                  )}
                </Panel>
              </>
            ) : (
              <>
                <div className="goal-grid">
                  {l.goals.map((g) => (
                    <button
                      className="goal-card"
                      key={g.id}
                      onClick={() => setEditor({ type: "goal", item: g })}
                    >
                      <div className="row-between">
                        <span className="category-icon">
                          <Target size={20} />
                        </span>
                        <Pencil size={15} />
                      </div>
                      <h2>{g.name}</h2>
                      <strong>{money(g.saved)}</strong>
                      <p>از {money(g.target)}</p>
                      <Progress value={(g.saved / g.target) * 100} />
                      <div className="row-between small muted">
                        <span>
                          {fa(Math.round((g.saved / g.target) * 100))}٪ تکمیل
                        </span>
                        <span>
                          {g.deadline ? toJalali(g.deadline) : "بدون مهلت"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                {!l.goals.length && (
                  <Empty title="برای هدف بعدی‌ات برنامه بچین" />
                )}
                <p className="hint">
                  مبلغ اهداف صرفاً برای برنامه‌ریزی است؛ برای جابه‌جایی واقعی
                  پول بین حساب‌ها، تراکنش انتقال ثبت کنید.
                </p>
              </>
            )}
          </>
        )}
        {page === "settings" && (
          <div className="settings-grid">
            <Panel title="دفتر شخصی">
              <button
                className="setting-row"
                onClick={() => setModal("profile")}
              >
                <ShieldCheck size={19} />
                <span>
                  <strong>{l.name}</strong>
                  <small dir="ltr">{session.login}</small>
                </span>
                <ChevronLeft size={16} />
              </button>
              <button
                className="setting-row"
                onClick={() => setModal("password")}
                disabled={session.demo}
              >
                <LockKeyhole size={19} />
                <span>
                  <strong>تغییر رمز عبور</strong>
                  <small>رمزگذاری مجدد دفتر با رمز جدید</small>
                </span>
                <ChevronLeft size={16} />
              </button>
              <button
                className="setting-row"
                onClick={() => setModal("backup")}
              >
                <Download size={19} />
                <span>
                  <strong>پشتیبان رمزگذاری‌شده</strong>
                  <small>فایل قابل انتقال به مرورگر یا گوشی دیگر</small>
                </span>
                <ChevronLeft size={16} />
              </button>
              <button
                className="setting-row"
                onClick={() => setModal("import")}
              >
                <Upload size={19} />
                <span>
                  <strong>بازیابی فایل پشتیبان</strong>
                  <small>جایگزینی اطلاعات همین حساب</small>
                </span>
                <ChevronLeft size={16} />
              </button>
              <button className="setting-row" onClick={logout} disabled={busy}>
                <LogOut size={19} />
                <span>
                  <strong>خروج و قفل‌کردن دفتر</strong>
                  <small>برای ورود دوباره رمز لازم است.</small>
                </span>
              </button>
              {session.demo && (
                <button
                  className="setting-row"
                  disabled={busy}
                  onClick={() => {
                    if (
                      confirm(
                        "تمام تغییرات حساب دمو پاک و داده‌های نمونه جایگزین شوند؟",
                      )
                    )
                      run(() => commit(demoLedger()));
                  }}
                >
                  <ChartNoAxesCombined size={19} />
                  <span>
                    <strong>بازنشانی داده‌های دمو</strong>
                    <small>فقط حساب نمایشی تغییر می‌کند.</small>
                  </span>
                </button>
              )}
              <div className="local-note">
                <LockKeyhole size={20} />
                <p>
                  این حساب فقط متعلق به همین مرورگر است؛ ارسال اطلاعات به سرور و
                  بازیابی رمز نداریم. حذف داده‌های مرورگر، اطلاعات را پاک
                  می‌کند. در حالت نصب روی صفحهٔ اصلی هم پشتیبان بگیرید.
                </p>
              </div>
            </Panel>
            <Panel
              title="دسته‌بندی‌های شما"
              meta={
                <button
                  className="icon-btn"
                  aria-label="افزودن دسته"
                  onClick={() => setEditor({ type: "category" })}
                >
                  <Plus size={18} />
                </button>
              }
            >
              <div className="category-settings">
                {l.categories.map((c) => {
                  const Icon = categoryIcon(c.id);
                  return (
                    <button
                      className="setting-row"
                      key={c.id}
                      onClick={() => setEditor({ type: "category", item: c })}
                    >
                      <span
                        className="category-icon"
                        style={{ color: displayColor(c.color) }}
                      >
                        <Icon size={18} />
                      </span>
                      <span>
                        <strong>{c.name}</strong>
                        <small>{c.kind === "income" ? "درآمد" : "هزینه"}</small>
                      </span>
                      <Pencil size={14} />
                    </button>
                  );
                })}
              </div>
            </Panel>
            <Panel title="استفاده روی گوشی">
              <div className="padded">
                <p>
                  در Safari آیفون از منوی Share گزینهٔ Add to Home Screen و در
                  مرورگر اندروید از منوی مرورگر گزینهٔ نصب یا افزودن به صفحهٔ
                  اصلی را بزنید.
                </p>
                <p className="hint">
                  فایل APK لازم نیست. برنامه یک وب‌اپ است؛ بدون اینترنت هم پس از
                  بارگذاری اولیه کار می‌کند. بسته به مرورگر، نسخهٔ نصب‌شده ممکن
                  است فضای ذخیره‌سازی جداگانه داشته باشد؛ با فایل پشتیبان
                  اطلاعات را منتقل کنید.
                </p>
              </div>
            </Panel>
          </div>
        )}
        <footer className="workspace-foot">
          <span>
            <LockKeyhole size={12} />
            ذخیره‌سازی محلی · تومان · تقویم شمسی
          </span>
          <span>{toJalali(today())}</span>
        </footer>
      </main>
      <nav className="mobile-nav" aria-label="ناوبری موبایل">
        {[pages[0], pages[1]].map((p) => (
          <button
            key={p.id}
            className={page === p.id ? "active" : ""}
            onClick={() => navigate(p.id)}
          >
            <p.icon size={21} />
            <span>{p.label}</span>
          </button>
        ))}
        <button className="mobile-add" onClick={openTx} aria-label="ثبت تراکنش">
          <Plus size={24} />
        </button>
        {[pages[2]].map((p) => (
          <button
            key={p.id}
            className={page === p.id ? "active" : ""}
            onClick={() => navigate(p.id)}
          >
            <p.icon size={21} />
            <span>{p.label}</span>
          </button>
        ))}
        <button
          className={
            ["reports", "settings", "planning", "budgets"].includes(page)
              ? "active"
              : ""
          }
          onClick={() => setModal("more")}
        >
          <MoreHorizontal size={22} />
          <span>بیشتر</span>
        </button>
      </nav>
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button
            className="icon-btn"
            onClick={() => setToast("")}
            aria-label="بستن پیام"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {editor && (
        <Modal
          key={
            editor.type + ("item" in editor ? editor.item?.id || "new" : "new")
          }
          title={editorTitle(editor)}
          onClose={() => {
            if (!busy) setEditor(null);
          }}
        >
          <EntityEditor
            e={editor}
            l={l}
            month={month}
            busy={busy}
            onCommit={async (next) => {
              await commit(next);
              setEditor(null);
            }}
          />
        </Modal>
      )}
      {modal === "more" && (
        <Modal title="بخش‌های دیگر" onClose={() => setModal(null)}>
          <div className="more-grid">
            {pages
              .filter((p) =>
                ["reports", "budgets", "planning", "settings"].includes(p.id),
              )
              .map((p) => (
                <button key={p.id} onClick={() => navigate(p.id)}>
                  <p.icon size={23} />
                  {p.label}
                  <ChevronLeft size={16} />
                </button>
              ))}
          </div>
        </Modal>
      )}
      {modal === "profile" && (
        <Modal title="حساب کاربری" onClose={() => setModal(null)}>
          <div className="profile-detail">
            <span className="avatar-large">{l.name.slice(0, 1)}</span>
            <h3>{l.name}</h3>
            <p dir="ltr">{session.login}</p>
            <span className="badge">
              {session.demo ? "حساب نمایشی" : "دفتر رمزگذاری‌شدهٔ محلی"}
            </span>
          </div>
          <LocalForm
            submit={async (f) => {
              await commit({ ...l, name: String(f.get("name")).trim() });
              setModal(null);
            }}
            busy={busy}
          >
            <Field label="نام نمایشی">
              <input
                name="name"
                defaultValue={l.name}
                maxLength={80}
                required
              />
            </Field>
            <button className="primary full" disabled={busy}>
              ذخیره نام
            </button>
          </LocalForm>
          <button
            className="secondary full spaced"
            onClick={logout}
            disabled={busy}
          >
            <LogOut size={17} />
            خروج و قفل‌کردن
          </button>
          <p className="hint">
            هر حساب دفتر جداگانه دارد. رمز عبور یا کلید رمزگشایی در مرورگر ذخیره
            نمی‌شود؛ بعد از بستن یا تازه‌کردن صفحه دوباره وارد شوید.
          </p>
        </Modal>
      )}
      {modal === "range" && (
        <Modal title="بازهٔ گزارش" onClose={() => setModal(null)}>
          <LocalForm
            busy={false}
            submit={async (f) => {
              const start = fromJalali(String(f.get("start"))),
                end = fromJalali(String(f.get("end")));
              if (start > end)
                throw Error("تاریخ شروع باید قبل از تاریخ پایان باشد.");
              setCustom({ start, end });
              setModal(null);
            }}
          >
            <Field label="از تاریخ شمسی">
              <input
                name="start"
                defaultValue={toJalali(range.start)}
                dir="ltr"
                required
                inputMode="numeric"
              />
            </Field>
            <Field label="تا تاریخ شمسی">
              <input
                name="end"
                defaultValue={toJalali(range.end)}
                dir="ltr"
                required
                inputMode="numeric"
              />
            </Field>
            <button className="primary full">اعمال بازه</button>
            <button
              type="button"
              className="secondary full"
              onClick={() => {
                setCustom(null);
                setModal(null);
              }}
            >
              بازگشت به ماه {monthTitle(month)}
            </button>
          </LocalForm>
        </Modal>
      )}
      {(modal === "backup" || modal === "import") && (
        <Modal
          title={modal === "backup" ? "دریافت پشتیبان امن" : "بازیابی پشتیبان"}
          onClose={() => {
            if (!busy) setModal(null);
          }}
        >
          <LocalForm
            busy={busy}
            submit={async (f) => {
              if (modal === "backup") {
                const pass = String(f.get("password"));
                if (pass !== f.get("repeat"))
                  throw Error("تکرار رمز یکسان نیست.");
                const backup = await exportBackup(session, pass);
                download(
                  JSON.stringify(backup),
                  "finance-backup-" + today() + ".json",
                );
                setToast(
                  "فایل پشتیبان رمزگذاری‌شده آماده شد. رمز آن را نگه دارید.",
                );
                setModal(null);
              } else {
                const file = f.get("file") as File;
                if (!file?.size || file.size > 25000000)
                  throw Error("فایل باید کمتر از ۲۵ مگابایت باشد.");
                let json;
                try {
                  json = JSON.parse(await file.text());
                } catch {
                  throw Error("ساختار فایل JSON معتبر نیست.");
                }
                const imported = await importBackup(
                  json,
                  String(f.get("password")),
                );
                if (
                  !confirm(
                    "تمام داده‌های همین حساب با پشتیبان جایگزین شود؟ اطلاعات حساب‌های دیگر تغییر نمی‌کند.",
                  )
                )
                  return;
                await commit(imported);
                setModal(null);
              }
            }}
          >
            {modal === "import" && (
              <Field label="فایل پشتیبان">
                <input
                  type="file"
                  name="file"
                  accept=".json,application/json"
                  required
                />
              </Field>
            )}
            <Field
              label={
                modal === "backup"
                  ? "رمز مستقل برای فایل پشتیبان"
                  : "رمز فایل پشتیبان"
              }
            >
              <input
                type="password"
                name="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                dir="ltr"
              />
            </Field>
            {modal === "backup" && (
              <Field label="تکرار رمز فایل">
                <input
                  type="password"
                  name="repeat"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  dir="ltr"
                />
              </Field>
            )}
            <p className="hint">
              {modal === "backup"
                ? "این فایل همهٔ حساب‌ها، تراکنش‌ها و تنظیمات دفتر فعلی را در بر می‌گیرد. نام کاربری و رمز ورود در آن نیست."
                : "فقط فایل پشتیبان ساخته‌شده با همین برنامه پذیرفته می‌شود. ورود به حساب فعلی عوض نخواهد شد."}
            </p>
            <button className="primary full" disabled={busy}>
              {modal === "backup" ? "ساخت فایل پشتیبان" : "بررسی و بازیابی"}
            </button>
          </LocalForm>
        </Modal>
      )}
      {modal === "password" && (
        <Modal
          title="تغییر رمز"
          onClose={() => {
            if (!busy) setModal(null);
          }}
        >
          <LocalForm
            busy={busy}
            submit={async (f) => {
              if (f.get("new") !== f.get("repeat"))
                throw Error("تکرار رمز جدید یکسان نیست.");
              if (busyRef.current) throw Error("کمی صبر کنید.");
              busyRef.current = true;
              setBusy(true);
              try {
                const next = await changePassword(
                  ref.current!,
                  String(f.get("old")),
                  String(f.get("new")),
                );
                enter(next);
                setToast("رمز جدید ذخیره شد.");
              } finally {
                busyRef.current = false;
                setBusy(false);
              }
            }}
          >
            <Field label="رمز فعلی">
              <input
                name="old"
                type="password"
                autoComplete="current-password"
                dir="ltr"
                required
              />
            </Field>
            <Field label="رمز جدید">
              <input
                name="new"
                type="password"
                autoComplete="new-password"
                dir="ltr"
                minLength={8}
                maxLength={128}
                required
              />
            </Field>
            <Field label="تکرار رمز جدید">
              <input
                name="repeat"
                type="password"
                autoComplete="new-password"
                dir="ltr"
                minLength={8}
                maxLength={128}
                required
              />
            </Field>
            <button className="primary full" disabled={busy}>
              تغییر رمز و رمزگذاری مجدد
            </button>
          </LocalForm>
        </Modal>
      )}
    </div>
  );
}
function LocalForm({
  children,
  submit,
  busy,
}: {
  children: React.ReactNode;
  submit: (f: FormData) => Promise<void>;
  busy: boolean;
}) {
  const [error, setError] = useState(""),
    [working, setWorking] = useState(false);
  return (
    <form
      className="editor-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy || working) return;
        const f = new FormData(e.currentTarget);
        setError("");
        setWorking(true);
        try {
          await submit(f);
        } catch (e) {
          setError(storageError(e));
        } finally {
          setWorking(false);
        }
      }}
    >
      <fieldset disabled={busy || working}>{children}</fieldset>
      {(busy || working) && (
        <p className="hint" role="status">
          در حال پردازش…
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
