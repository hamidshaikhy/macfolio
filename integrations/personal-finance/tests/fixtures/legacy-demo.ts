import { demoLedger, monthKey, shiftMonth, today, jalaliParts, validateLedger } from "../../src/model";

// Reconstruct the amounts shipped before the variable monthly demo profiles.
export function legacyDemoLedger() {
  const l = demoLedger(), current = monthKey(today());
  const offsets = new Map(Array.from({ length: 6 }, (_, i) => [shiftMonth(current, i - 5), i - 5]));
  l.transactions = l.transactions.filter((t) => t.note !== "خرید لوازم خانه").map((t) => {
    const offset = offsets.get(monthKey(t.date))!, day = jalaliParts(t.date).jd;
    const amount = t.kind === "income"
      ? t.categoryId === "salary" ? 45000000 + offset * 600000 : 12000000 + offset * 200000
      : t.kind === "expense"
        ? t.categoryId === "home" ? 12500000 : [680000, 1250000, 380000, 950000, 420000][day % 5] + (offset + 5) * 45000
        : t.amount;
    return { ...t, amount };
  });
  validateLedger(l);
  return JSON.parse(JSON.stringify(l)) as typeof l;
}
