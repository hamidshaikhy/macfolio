import { test } from "node:test";
import assert from "node:assert/strict";
import {
  blankLedger,
  parseMoney,
  safeSum,
  fromJalali,
  toJalali,
  monthRange,
  monthKey,
  shiftMonth,
  applyTransaction,
  accountBalance,
  summary,
  validateLedger,
  occurrences,
  payOccurrence,
  flowData,
  categorySpend,
  csvExport,
  demoLedger,
  today,
} from "../src/model";
function ledger() {
  const l = blankLedger("تست");
  l.accounts = [
    {
      id: "bank",
      name: "بانک",
      type: "bank",
      opening: 1000000,
      color: "#a89bef",
    },
    { id: "cash", name: "نقد", type: "cash", opening: 0, color: "#d0aa76" },
  ];
  return l;
}
const date = fromJalali("۱۴۰۵/۰۷/۲۲"),
  range = monthRange("1405-07");
test("Persian and Arabic digits parse as exact integer toman, never decimals", () => {
  assert.equal(parseMoney("۱٬۲۳۴٬۵۶۷"), 1234567);
  assert.equal(parseMoney("١٢٣"), 123);
  assert.equal(parseMoney("-500", true), -500);
  assert.equal(parseMoney("0", true), 0);
  for (const s of ["12.5", "1e6", "0", "-1", "Infinity", "1000000000001"])
    assert.throws(() => parseMoney(s));
});
test("safe totals reject loss of integer precision", () => {
  assert.equal(safeSum([100, 200, -50]), 250);
  assert.throws(() => safeSum([Number.MAX_SAFE_INTEGER, 1]));
});
test("Jalali calendar roundtrips leap-day and rejects invalid dates", () => {
  assert.equal(toJalali(fromJalali("۱۳۹۹/۱۲/۳۰")), "۱۳۹۹/۱۲/۳۰");
  assert.equal(fromJalali("1403/01/01"), "2024-03-20");
  assert.throws(() => fromJalali("1400/12/30"));
  assert.throws(() => fromJalali("1405/07/31"));
  assert.throws(() => fromJalali("1405/13/01"));
  assert.equal(monthRange("1405-06").end, fromJalali("1405/06/31"));
  assert.equal(shiftMonth("1405-12", 1), "1406-01");
});
test("income, expense and transfer produce exact independent account balances", () => {
  let l = ledger();
  l = applyTransaction(l, {
    id: "i",
    kind: "income",
    amount: 300000,
    date,
    accountId: "bank",
    categoryId: "salary",
    note: "",
  });
  l = applyTransaction(l, {
    id: "e",
    kind: "expense",
    amount: 200000,
    date,
    accountId: "bank",
    categoryId: "food",
    note: "",
  });
  l = applyTransaction(l, {
    id: "t",
    kind: "transfer",
    amount: 400000,
    date,
    accountId: "bank",
    toAccountId: "cash",
    note: "",
  });
  assert.equal(accountBalance(l, "bank"), 700000);
  assert.equal(accountBalance(l, "cash"), 400000);
  const s = summary(l, range);
  assert.equal(s.balance, 1100000);
  assert.equal(s.income, 300000);
  assert.equal(s.expense, 200000);
  assert.equal(s.surplus, 100000);
});
test("transfer cannot create net worth, income, expense, or category spend", () => {
  let l = ledger();
  l = applyTransaction(l, {
    id: "t",
    kind: "transfer",
    amount: 1200000,
    date,
    accountId: "bank",
    toAccountId: "cash",
    note: "",
  });
  assert.equal(summary(l, range).balance, 1000000);
  assert.equal(summary(l, range).income, 0);
  assert.equal(summary(l, range).expense, 0);
  assert.equal(categorySpend(l, "food", range), 0);
  assert.equal(accountBalance(l, "bank"), -200000);
});
test("editing same transaction replaces it; deletion restores balances", () => {
  let l = ledger();
  const t = {
    id: "e",
    kind: "expense" as const,
    amount: 200000,
    date,
    accountId: "bank",
    categoryId: "food",
    note: "",
  };
  l = applyTransaction(l, t);
  l = applyTransaction(l, { ...t, amount: 500000, accountId: "cash" });
  assert.equal(l.transactions.length, 1);
  assert.equal(accountBalance(l, "bank"), 1000000);
  assert.equal(accountBalance(l, "cash"), -500000);
  l.transactions = [];
  assert.equal(accountBalance(l, "cash"), 0);
});
test("future and out-of-range postings follow explicit cutoff", () => {
  let l = ledger();
  l = applyTransaction(l, {
    id: "i",
    kind: "income",
    amount: 500,
    date: fromJalali("1405/08/01"),
    accountId: "bank",
    categoryId: "salary",
    note: "",
  });
  assert.equal(summary(l, range).income, 0);
  assert.equal(accountBalance(l, "bank", range.end), 1000000);
  assert.equal(accountBalance(l, "bank"), 1000500);
});
test("bad transfers, category mismatch and dangling references cannot enter ledger", () => {
  for (const t of [
    { kind: "transfer", toAccountId: "bank" },
    { kind: "transfer", toAccountId: "missing" },
    { kind: "expense", categoryId: "salary" },
    { kind: "income", categoryId: "food" },
    { kind: "expense", categoryId: "food", accountId: "missing" },
    { kind: "expense", categoryId: "food", amount: 0 },
  ])
    assert.throws(() =>
      applyTransaction(ledger(), {
        id: "x",
        kind: "expense",
        amount: 1,
        date,
        accountId: "bank",
        note: "",
        ...t,
      } as any),
    );
});
test("budget uses only matching category and correct Jalali month", () => {
  let l = ledger();
  for (const [id, cat, d, amount] of [
    ["a", "food", date, 300],
    ["b", "shopping", date, 500],
    ["c", "food", fromJalali("1405/08/01"), 700],
  ] as const)
    l = applyTransaction(l, {
      id,
      kind: "expense",
      amount,
      date: d,
      accountId: "bank",
      categoryId: cat,
      note: "",
    });
  assert.equal(categorySpend(l, "food", range), 300);
  l.budgets = [
    { id: "b1", categoryId: "food", month: "1405-07", amount: 100 },
    { id: "b2", categoryId: "food", month: "1405-07", amount: 100 },
  ];
  assert.throws(() => validateLedger(l));
});
test("validation rejects malformed/unsafe imported metadata and goals", () => {
  for (const patch of [
    { budgets: [{ id: "b", categoryId: "food", month: "9999-01", amount: 1 }] },
    { goals: [{ id: "g", name: "x", target: 100, saved: 101, deadline: "" }] },
    {
      accounts: [
        { id: "bank", name: "x", type: "bank", opening: 1.5, color: "red" },
      ],
    },
    {
      transactions: [
        {
          id: "x",
          kind: "expense",
          amount: 1,
          date: "2026-02-30",
          accountId: "bank",
          categoryId: "food",
          note: "",
        },
      ],
    },
  ])
    assert.throws(() => validateLedger({ ...ledger(), ...patch }));
});
test("month-end recurring schedules clamp short month, then restore original day", () => {
  const l = ledger();
  l.scheduled = [
    {
      id: "rent",
      name: "اجاره",
      kind: "expense",
      amount: 100,
      accountId: "bank",
      categoryId: "home",
      frequency: "monthly",
      startDate: fromJalali("1405/06/31"),
    },
  ];
  const d = occurrences(l, {
    start: fromJalali("1405/06/01"),
    end: fromJalali("1406/01/31"),
  });
  assert.equal(toJalali(d[0].date), "۱۴۰۵/۰۶/۳۱");
  assert.equal(toJalali(d[1].date), "۱۴۰۵/۰۷/۳۰");
  assert.equal(toJalali(d[d.length - 1].date), "۱۴۰۶/۰۱/۳۱");
});
test("scheduled occurrence posts exactly once and remains paid after reload", () => {
  const l = ledger();
  l.scheduled = [
    {
      id: "rent",
      name: "اجاره",
      kind: "expense",
      amount: 100,
      accountId: "bank",
      categoryId: "home",
      frequency: "once",
      startDate: date,
    },
  ];
  const d = occurrences(l, range)[0];
  const next = payOccurrence(l, d);
  assert.equal(summary(next, range).expense, 100);
  assert.equal(
    occurrences(JSON.parse(JSON.stringify(next)), range)[0].paid,
    true,
  );
  assert.throws(() => payOccurrence(next, d));
  next.transactions = [];
  assert.equal(occurrences(next, range)[0].paid, false);
});
test("schedule stop-date prevents extra monthly payments", () => {
  const l = ledger();
  l.scheduled = [
    {
      id: "s",
      name: "سرویس",
      kind: "expense",
      amount: 1,
      accountId: "bank",
      categoryId: "home",
      frequency: "monthly",
      startDate: date,
      endDate: fromJalali("1405/08/22"),
    },
  ];
  assert.equal(
    occurrences(l, { start: range.start, end: fromJalali("1405/12/29") })
      .length,
    2,
  );
});
test("Sankey conserves cash including deficit and surplus, no invented attribution", () => {
  for (const [income, expense] of [
    [0, 0],
    [100, 20],
    [10, 100],
    [0, 100],
    [100, 0],
  ]) {
    let l = ledger();
    if (income)
      l = applyTransaction(l, {
        id: "i",
        kind: "income",
        amount: income,
        date,
        accountId: "bank",
        categoryId: "salary",
        note: "",
      });
    if (expense)
      l = applyTransaction(l, {
        id: "e",
        kind: "expense",
        amount: expense,
        date,
        accountId: "bank",
        categoryId: "food",
        note: "",
      });
    const f = flowData(l, range);
    assert.equal(safeSum(f.sources.map((n) => n.value)), f.total);
    assert.equal(safeSum(f.targets.map((n) => n.value)), f.total);
    assert.equal(f.total, Math.max(income, expense));
  }
});
test("zero income has no fabricated savings percentage", () => {
  assert.equal(summary(ledger(), range).rate, null);
});
test("CSV safely escapes formula-like user notes and preserves numeric amounts", () => {
  let l = ledger();
  l = applyTransaction(l, {
    id: "e",
    kind: "expense",
    amount: 250,
    date,
    accountId: "bank",
    categoryId: "food",
    note: '=HYPERLINK("bad")',
  });
  const csv = csvExport(l, range);
  assert.ok(csv.includes("'=HYPERLINK"));
  assert.ok(csv.includes('"-250"'));
});
test("demo includes valid six-month history without using future postings", () => {
  const l = demoLedger();
  validateLedger(l);
  assert.ok(l.transactions.length > 60);
  assert.ok(new Set(l.transactions.map((t) => monthKey(t.date))).size >= 6);
  assert.ok(l.transactions.every((t) => t.date <= today()));
  assert.ok(l.accounts.every((a) => accountBalance(l, a.id, today()) >= 0));
});

test("demo has distinct monthly income and expense with visible variation", () => {
  const l = demoLedger(), cur = monthKey(today());
  const history = Array.from({ length: 6 }, (_, i) =>
    summary(l, monthRange(shiftMonth(cur, i - 5))),
  );
  for (const metric of ["income", "expense"] as const) {
    const values = history.map((s) => s[metric]);
    assert.equal(new Set(values).size, 6);
    // Completed months must vary even when the current month has just started.
    const completed = values.slice(0, 5);
    assert.ok(Math.max(...completed) / Math.min(...completed) > 1.3);
    assert.ok(values.every(Number.isSafeInteger));
  }
});
