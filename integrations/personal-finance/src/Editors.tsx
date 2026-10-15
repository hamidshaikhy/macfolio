import { displayColor } from "./palette";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Field } from "./ui";
import {
  uid,
  colors,
  parseMoney,
  toJalali,
  fromJalali,
  today,
  monthKey,
  monthTitle,
  validateLedger,
  applyTransaction,
  payOccurrence,
} from "./model";
import type {
  Ledger,
  Transaction,
  Account,
  Category,
  Budget,
  Scheduled,
  Goal,
  Due,
} from "./model";
export type Editor =
  | { type: "transaction"; item?: Transaction; kind?: Transaction["kind"] }
  | { type: "account"; item?: Account }
  | { type: "category"; item?: Category }
  | { type: "budget"; item?: Budget }
  | { type: "scheduled"; item?: Scheduled }
  | { type: "goal"; item?: Goal };
export const editorTitle = (e: Editor) =>
  ({
    transaction: "تراکنش",
    account: "حساب",
    category: "دسته‌بندی",
    budget: "بودجه",
    scheduled: "پرداخت برنامه‌ریزی‌شده",
    goal: "هدف پس‌انداز",
  })[e.type] + (e.item ? " · ویرایش" : " · جدید");
function EditorForm({
  children,
  onSubmit,
  onDelete,
  busy,
}: {
  children: ReactNode;
  onSubmit: (d: FormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  busy: boolean;
}) {
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    try {
      await onSubmit(new FormData(e.currentTarget));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <form className="editor-form" onSubmit={submit}>
      {children}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <footer className="form-actions">
        <button className="primary" disabled={busy}>
          {busy ? "در حال ذخیره…" : "ذخیره اطلاعات"}
        </button>
        {onDelete && (
          <button
            type="button"
            className="danger ghost"
            disabled={busy}
            onClick={async () => {
              if (!confirm("این مورد حذف شود؟ این تغییر قابل بازگشت نیست."))
                return;
              try {
                await onDelete();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            حذف
          </button>
        )}
      </footer>
    </form>
  );
}
const val = (f: FormData, k: string) => String(f.get(k) || "").trim();
function ColorField({ color }: { color?: string }) {
  return (
    <Field label="رنگ">
      <div className="color-options">
        {colors.map((c, i) => (
          <label key={c} style={{ color: c }}>
            <input
              type="radio"
              name="color"
              value={c}
              defaultChecked={c === displayColor(color || colors[0])}
              aria-label={"رنگ " + (i + 1)}
            />
            <span style={{ background: c }} />
          </label>
        ))}
      </div>
    </Field>
  );
}
function AccountSelect({
  l,
  name = "accountId",
  value,
  label = "حساب",
}: {
  l: Ledger;
  name?: string;
  value?: string;
  label?: string;
}) {
  return (
    <Field label={label}>
      <select name={name} defaultValue={value} required>
        {l.accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
    </Field>
  );
}
function CategorySelect({
  l,
  kind,
  value,
}: {
  l: Ledger;
  kind: "income" | "expense";
  value?: string;
}) {
  return (
    <Field label="دسته‌بندی">
      <select
        key={kind}
        name="categoryId"
        defaultValue={
          l.categories.some((c) => c.id === value && c.kind === kind)
            ? value
            : undefined
        }
        required
      >
        {l.categories
          .filter((c) => c.kind === kind)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
      </select>
    </Field>
  );
}
export function EntityEditor({
  e,
  l,
  month,
  busy,
  onCommit,
}: {
  e: Editor;
  l: Ledger;
  month: string;
  busy: boolean;
  onCommit: (next: Ledger) => Promise<void>;
}) {
  const initialKind =
    e.type === "transaction"
      ? e.item?.kind || e.kind || "expense"
      : e.type === "category"
        ? e.item?.kind || "expense"
        : e.type === "scheduled"
          ? e.item?.kind || "expense"
          : "expense";
  const [kind, setKind] = useState(initialKind);
  const update = (
    key:
      | "accounts"
      | "categories"
      | "transactions"
      | "budgets"
      | "scheduled"
      | "goals",
    item: unknown,
  ) =>
    ({
      ...l,
      [key]: [
        ...l[key].filter((v) => v.id !== (item as { id: string }).id),
        item,
      ],
    }) as Ledger;
  const checked = async (n: Ledger) => {
    validateLedger(n);
    await onCommit(n);
  };
  if (e.type === "transaction") {
    const t = e.item;
    if (!l.accounts.length)
      return (
        <p className="info-box">
          ابتدا در بخش «حساب‌ها» یک حساب بانکی یا کیف پول بسازید.
        </p>
      );
    return (
      <EditorForm
        busy={busy}
        onSubmit={async (f) => {
          const amount = parseMoney(val(f, "amount"));
          await checked(
            applyTransaction(l, {
              id: t?.id || uid(),
              kind: kind as Transaction["kind"],
              amount,
              date: fromJalali(val(f, "date")),
              accountId: val(f, "accountId"),
              toAccountId:
                kind === "transfer" ? val(f, "toAccountId") : undefined,
              categoryId:
                kind !== "transfer" ? val(f, "categoryId") : undefined,
              note: val(f, "note"),
              recurringKey: t?.recurringKey,
            }),
          );
        }}
        onDelete={
          t
            ? () =>
                checked({
                  ...l,
                  transactions: l.transactions.filter((x) => x.id !== t.id),
                })
            : undefined
        }
      >
        <div className="segmented">
          {[
            ["expense", "هزینه"],
            ["income", "درآمد"],
            ["transfer", "انتقال"],
          ].map(([k, title]) => (
            <button
              type="button"
              key={k}
              className={kind === k ? "selected" : ""}
              onClick={() => setKind(k as typeof kind)}
            >
              {title}
            </button>
          ))}
        </div>
        <Field label="مبلغ · تومان">
          <input
            name="amount"
            inputMode="numeric"
            autoFocus
            defaultValue={t?.amount}
            placeholder="مثلاً ۲۵۰٬۰۰۰"
            required
            maxLength={22}
          />
        </Field>
        <div className="form-grid">
          <AccountSelect
            l={l}
            value={t?.accountId}
            label={kind === "transfer" ? "حساب مبدأ" : "حساب"}
          />
          {kind === "transfer" ? (
            <AccountSelect
              l={l}
              name="toAccountId"
              value={t?.toAccountId}
              label="حساب مقصد"
            />
          ) : (
            <CategorySelect
              l={l}
              kind={kind as "income" | "expense"}
              value={t?.categoryId}
            />
          )}
        </div>
        <Field label="تاریخ شمسی">
          <input
            name="date"
            defaultValue={toJalali(t?.date || today())}
            dir="ltr"
            inputMode="numeric"
            required
            placeholder="۱۴۰۵/۰۷/۲۲"
          />
        </Field>
        <Field label="شرح (اختیاری)">
          <input
            name="note"
            defaultValue={t?.note}
            maxLength={300}
            placeholder="مثلاً خرید از سوپرمارکت"
          />
        </Field>
        {kind === "transfer" && (
          <p className="hint">
            یک انتقال هم‌زمان از مبدأ کم و به مقصد اضافه می‌شود؛ درآمد و هزینه
            را تغییر نمی‌دهد.
          </p>
        )}
        {t?.recurringKey && (
          <p className="hint">
            این تراکنش از یک پرداخت برنامه‌ریزی‌شده ثبت شده است. حذف آن، سررسید
            را دوباره پرداخت‌نشده می‌کند.
          </p>
        )}
      </EditorForm>
    );
  }
  if (e.type === "account") {
    const a = e.item;
    return (
      <EditorForm
        busy={busy}
        onSubmit={async (f) =>
          checked(
            update("accounts", {
              id: a?.id || uid(),
              name: val(f, "name"),
              type: val(f, "type"),
              opening: parseMoney(val(f, "opening"), true),
              color: val(f, "color"),
            }),
          )
        }
        onDelete={
          a
            ? async () => {
                if (
                  l.transactions.some(
                    (t) => t.accountId === a.id || t.toAccountId === a.id,
                  ) ||
                  l.scheduled.some((s) => s.accountId === a.id)
                )
                  throw Error(
                    "حساب دارای تراکنش یا پرداخت برنامه‌ریزی‌شده است. ابتدا موارد وابسته را حذف یا به حساب دیگری منتقل کنید.",
                  );
                await checked({
                  ...l,
                  accounts: l.accounts.filter((x) => x.id !== a.id),
                });
              }
            : undefined
        }
      >
        <Field label="نام حساب">
          <input
            name="name"
            defaultValue={a?.name}
            maxLength={60}
            required
            autoFocus
            placeholder="مثلاً حساب روزمره"
          />
        </Field>
        <Field label="نوع حساب">
          <select name="type" defaultValue={a?.type || "bank"}>
            <option value="bank">حساب بانکی</option>
            <option value="cash">کیف پول و نقد</option>
            <option value="savings">پس‌انداز</option>
            <option value="credit">اعتباری و بدهی</option>
          </select>
        </Field>
        <Field
          label="موجودی اولیه · تومان"
          hint="برای بدهی عدد منفی وارد کنید. ویرایش این مقدار، موجودی تمام دوره‌ها را تغییر می‌دهد."
        >
          <input
            name="opening"
            inputMode="text"
            dir="ltr"
            defaultValue={a?.opening || 0}
            required
          />
        </Field>
        <ColorField color={a?.color} />
      </EditorForm>
    );
  }
  if (e.type === "category") {
    const c = e.item;
    return (
      <EditorForm
        busy={busy}
        onSubmit={async (f) => {
          if (
            c &&
            c.kind !== kind &&
            (l.transactions.some((t) => t.categoryId === c.id) ||
              l.scheduled.some((s) => s.categoryId === c.id) ||
              l.budgets.some((b) => b.categoryId === c.id))
          )
            throw Error(
              "نوع دستهٔ استفاده‌شده قابل تغییر نیست. یک دستهٔ جدید بسازید.",
            );
          await checked(
            update("categories", {
              id: c?.id || uid(),
              name: val(f, "name"),
              kind,
              color: val(f, "color"),
            }),
          );
        }}
        onDelete={
          c
            ? async () => {
                if (
                  l.transactions.some((t) => t.categoryId === c.id) ||
                  l.scheduled.some((s) => s.categoryId === c.id) ||
                  l.budgets.some((b) => b.categoryId === c.id)
                )
                  throw Error(
                    "این دسته در تراکنش، بودجه یا پرداخت استفاده شده است؛ ابتدا موارد وابسته را تغییر دهید.",
                  );
                await checked({
                  ...l,
                  categories: l.categories.filter((x) => x.id !== c.id),
                });
              }
            : undefined
        }
      >
        <Field label="نام دسته">
          <input
            name="name"
            defaultValue={c?.name}
            required
            maxLength={60}
            autoFocus
          />
        </Field>
        <Field label="نوع">
          <select
            value={kind}
            onChange={(ev) => setKind(ev.target.value as typeof kind)}
          >
            <option value="expense">هزینه</option>
            <option value="income">درآمد</option>
          </select>
        </Field>
        <ColorField color={c?.color} />
      </EditorForm>
    );
  }
  if (e.type === "budget") {
    const b = e.item;
    return (
      <EditorForm
        busy={busy}
        onSubmit={async (f) => {
          const m = monthKey(fromJalali(val(f, "month") + "/01")),
            categoryId = val(f, "categoryId");
          if (
            l.budgets.some(
              (x) =>
                x.month === m && x.categoryId === categoryId && x.id !== b?.id,
            )
          )
            throw Error(
              "این دسته در این ماه بودجه دارد؛ همان مورد را ویرایش کنید.",
            );
          await checked(
            update("budgets", {
              id: b?.id || uid(),
              categoryId,
              month: m,
              amount: parseMoney(val(f, "amount")),
            }),
          );
        }}
        onDelete={
          b
            ? () =>
                checked({
                  ...l,
                  budgets: l.budgets.filter((x) => x.id !== b.id),
                })
            : undefined
        }
      >
        <CategorySelect l={l} kind="expense" value={b?.categoryId} />
        <Field label="ماه بودجه · سال/ماه" hint={monthTitle(b?.month || month)}>
          <input
            name="month"
            defaultValue={(b?.month || month).replace("-", "/")}
            dir="ltr"
            inputMode="numeric"
            required
          />
        </Field>
        <Field label="سقف هزینه · تومان">
          <input
            name="amount"
            inputMode="numeric"
            defaultValue={b?.amount}
            required
            autoFocus
          />
        </Field>
        <p className="hint">
          بودجه سقف برنامه‌ریزی است و از موجودی حساب کم نمی‌شود.
        </p>
      </EditorForm>
    );
  }
  if (e.type === "scheduled") {
    const s = e.item;
    if (!l.accounts.length)
      return (
        <p className="info-box">
          برای برنامه‌ریزی پرداخت، ابتدا یک حساب بسازید.
        </p>
      );
    return (
      <EditorForm
        busy={busy}
        onSubmit={async (f) =>
          checked(
            update("scheduled", {
              id: s?.id || uid(),
              name: val(f, "name"),
              kind,
              accountId: val(f, "accountId"),
              categoryId: val(f, "categoryId"),
              amount: parseMoney(val(f, "amount")),
              startDate: fromJalali(val(f, "startDate")),
              frequency: val(f, "frequency"),
              endDate: val(f, "endDate")
                ? fromJalali(val(f, "endDate"))
                : undefined,
            }),
          )
        }
        onDelete={
          s
            ? () =>
                checked({
                  ...l,
                  scheduled: l.scheduled.filter((x) => x.id !== s.id),
                })
            : undefined
        }
      >
        <Field label="عنوان">
          <input
            name="name"
            defaultValue={s?.name}
            required
            maxLength={160}
            autoFocus
            placeholder="مثلاً اجارهٔ خانه"
          />
        </Field>
        <Field label="نوع">
          <select
            value={kind}
            onChange={(ev) => setKind(ev.target.value as typeof kind)}
          >
            <option value="expense">پرداخت هزینه</option>
            <option value="income">دریافت درآمد</option>
          </select>
        </Field>
        <div className="form-grid">
          <AccountSelect l={l} value={s?.accountId} />
          <CategorySelect
            l={l}
            kind={kind as "income" | "expense"}
            value={s?.categoryId}
          />
        </div>
        <Field label="مبلغ · تومان">
          <input
            name="amount"
            defaultValue={s?.amount}
            inputMode="numeric"
            required
          />
        </Field>
        <div className="form-grid">
          <Field label="اولین سررسید شمسی">
            <input
              name="startDate"
              defaultValue={toJalali(s?.startDate || today())}
              dir="ltr"
              inputMode="numeric"
              required
            />
          </Field>
          <Field label="تکرار">
            <select name="frequency" defaultValue={s?.frequency || "monthly"}>
              <option value="monthly">ماهانه بر اساس تقویم شمسی</option>
              <option value="once">فقط یک‌بار</option>
            </select>
          </Field>
        </div>
        <Field label="آخرین تاریخ (اختیاری)">
          <input
            name="endDate"
            defaultValue={s?.endDate ? toJalali(s.endDate) : ""}
            dir="ltr"
            inputMode="numeric"
            placeholder="۱۴۰۵/۱۲/۲۹"
          />
        </Field>
        <p className="hint">
          سررسیدها خودکار از موجودی کم نمی‌شوند؛ با «ثبت پرداخت» به تراکنش واقعی
          تبدیل‌شان کنید. روز ۳۱ در ماه کوتاه به آخر ماه منتقل می‌شود.
        </p>
      </EditorForm>
    );
  }
  const g = e.item;
  return (
    <EditorForm
      busy={busy}
      onSubmit={async (f) =>
        checked(
          update("goals", {
            id: g?.id || uid(),
            name: val(f, "name"),
            target: parseMoney(val(f, "target")),
            saved: parseMoney(val(f, "saved"), true),
            deadline: val(f, "deadline") ? fromJalali(val(f, "deadline")) : "",
          }),
        )
      }
      onDelete={
        g
          ? () => checked({ ...l, goals: l.goals.filter((x) => x.id !== g.id) })
          : undefined
      }
    >
      <Field label="نام هدف">
        <input
          name="name"
          defaultValue={g?.name}
          required
          maxLength={160}
          autoFocus
        />
      </Field>
      <Field label="مبلغ هدف · تومان">
        <input
          name="target"
          defaultValue={g?.target}
          inputMode="numeric"
          required
        />
      </Field>
      <Field label="مبلغ اختصاص‌یافته · تومان">
        <input
          name="saved"
          defaultValue={g?.saved || 0}
          inputMode="numeric"
          required
        />
      </Field>
      <Field label="تاریخ هدف (اختیاری)">
        <input
          name="deadline"
          defaultValue={g?.deadline ? toJalali(g.deadline) : ""}
          inputMode="numeric"
          dir="ltr"
        />
      </Field>
      <p className="hint">
        هدف یک یادداشت برنامه‌ریزی است؛ مبلغ اختصاص‌یافته از موجودی حساب کم
        نمی‌شود و تراکنش ایجاد نمی‌کند.
      </p>
    </EditorForm>
  );
}
