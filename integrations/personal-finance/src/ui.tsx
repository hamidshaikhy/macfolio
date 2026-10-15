import { displayColor } from "./palette";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Wallet,
  Home,
  ShoppingBag,
  Utensils,
  Briefcase,
  Car,
  Heart,
  GraduationCap,
  MoreHorizontal,
  Inbox,
} from "lucide-react";
import { fa, money, toJalali } from "./model";
import type { Ledger, Transaction } from "./model";
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const d = ref.current;
    const native = !!d && typeof d.showModal === "function";
    let backdrop: HTMLDivElement | null = null;
    if (native) d!.showModal();
    else if (d) {
      d.setAttribute("open", "");
      d.setAttribute("aria-modal", "true");
      d.classList.add("fallback-modal");
      backdrop = document.createElement("div");
      backdrop.className = "fallback-backdrop";
      backdrop.onclick = () => closeRef.current();
      document.body.appendChild(backdrop);
      d.querySelector<HTMLElement>("input,button,select")?.focus();
    }
    const cancel = (e: Event) => {
      e.preventDefault();
      closeRef.current();
    };
    const keydown = (e: KeyboardEvent) => {
      if (native || !d) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
      }
      if (e.key !== "Tab") return;
      const focusable = Array.from(
        d.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex='0']",
        ),
      );
      const first = focusable[0],
        last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    d?.addEventListener("cancel", cancel);
    document.addEventListener("keydown", keydown);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      d?.removeEventListener("cancel", cancel);
      document.removeEventListener("keydown", keydown);
      if (native && d?.open) d.close();
      else d?.removeAttribute("open");
      backdrop?.remove();
      document.body.style.overflow = old;
      prev?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={"modal " + (wide ? "wide" : "")}
      aria-labelledby={id}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <header>
        <h2 id={id}>{title}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="بستن">
          <X size={20} />
        </button>
      </header>
      <div className="modal-content">{children}</div>
    </dialog>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Empty({
  title = "هنوز اطلاعاتی ثبت نشده",
  text,
  action,
}: {
  title?: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <Inbox size={28} />
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
export function Panel({
  title,
  meta,
  children,
  className = "",
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={"panel " + className}>
      <header className="panel-head">
        <h2>{title}</h2>
        {meta}
      </header>
      {children}
    </section>
  );
}
export const categoryIcon = (id: string) =>
  ({
    home: Home,
    food: Utensils,
    shopping: ShoppingBag,
    transport: Car,
    health: Heart,
    education: GraduationCap,
    salary: Briefcase,
    freelance: Briefcase,
  })[id] || MoreHorizontal;
export function TxList({
  l,
  items,
  onSelect,
}: {
  l: Ledger;
  items: Transaction[];
  onSelect: (t: Transaction) => void;
}) {
  return items.length ? (
    <div className="tx-list">
      {items.map((t) => {
        const c = l.categories.find((c) => c.id === t.categoryId),
          a = l.accounts.find((a) => a.id === t.accountId),
          Icon =
            t.kind === "transfer" ? ArrowLeftRight : categoryIcon(c?.id || "");
        return (
          <button className="tx-row" key={t.id} onClick={() => onSelect(t)}>
            <span
              className="category-icon"
              style={{
                color: displayColor(c?.color || "#c9b079"),
                background: displayColor(c?.color || "#c9b079") + "15",
              }}
            >
              <Icon size={17} />
            </span>
            <span className="tx-desc">
              <strong>{t.note || c?.name || "انتقال بین حساب‌ها"}</strong>
              <small>
                {toJalali(t.date)} · {a?.name}
              </small>
            </span>
            <span className={"amount " + t.kind} dir="ltr">
              {t.kind === "income" ? "+" : t.kind === "expense" ? "−" : ""}
              {fa(t.amount)}
              <small>تومان</small>
            </span>
          </button>
        );
      })}
    </div>
  ) : (
    <Empty
      title="تراکنشی در این بازه نیست"
      text="اولین درآمد یا هزینه‌ات را ثبت کن."
    />
  );
}
export function Stat({
  label,
  value,
  sub,
  tone = "",
}: {
  label: string;
  value: number | null;
  sub: string;
  tone?: string;
}) {
  const Icon =
    tone === "income"
      ? ArrowDownLeft
      : tone === "expense"
        ? ArrowUpRight
        : Wallet;
  return (
    <div className="stat">
      <span className="stat-label">
        <Icon size={15} />
        {label}
      </span>
      <strong className={tone}>
        {value === null ? "—" : fa(value)}
        <small>{label.includes("نرخ") ? "٪" : "تومان"}</small>
      </strong>
      <span className="stat-sub">{sub}</span>
    </div>
  );
}
export function Progress({ value, color }: { value: number; color?: string }) {
  return (
    <span
      className="progress"
      role="progressbar"
      aria-valuenow={Math.round(Math.max(0, Math.min(value, 100)))}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span
        style={{
          width: `${Math.max(0, Math.min(value, 100))}%`,
          background: color,
        }}
      />
    </span>
  );
}
export function download(
  data: string,
  name: string,
  type = "application/json",
) {
  const u = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
export function AmountText({ value }: { value: number }) {
  return <b className="num">{money(value)}</b>;
}
