import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CashFlow, SpendingChart } from "../src/Charts";
import { EntityEditor } from "../src/Editors";
import {
  demoLedger,
  monthKey,
  today,
  monthRange,
  blankLedger,
} from "../src/model";
test("real demo renders both mobile and desktop cashflow with safe user text", () => {
  const l = demoLedger();
  const html = renderToStaticMarkup(
    React.createElement(CashFlow, { l, range: monthRange(monthKey(today())) }),
  );
  assert.ok(html.includes("mobile-sankey"));
  assert.ok(html.includes('viewBox="0 0 360 245"'));
  assert.ok(!html.includes("مخزن مشترک"));
  assert.ok(html.includes("درآمدها در چپ"));
  assert.ok(html.includes("تقسیم متناسب"));
  assert.ok(!html.includes("NaN"));
  assert.ok(!html.includes("Infinity"));
});
test("all six financial editors render populated data and empty account guard", () => {
  const l = demoLedger(),
    month = monthKey(today());
  for (const [type, item] of [
    ["transaction", l.transactions[0]],
    ["account", l.accounts[0]],
    ["category", l.categories[0]],
    ["budget", l.budgets[0]],
    ["scheduled", l.scheduled[0]],
    ["goal", l.goals[0]],
  ]) {
    const html = renderToStaticMarkup(
      React.createElement(EntityEditor, {
        e: { type, item } as any,
        l,
        month,
        busy: false,
        onCommit: async () => {},
      }),
    );
    assert.ok(html.includes("ذخیره اطلاعات"));
    assert.ok(!html.includes("undefined"));
  }
  const empty = renderToStaticMarkup(
    React.createElement(EntityEditor, {
      e: { type: "transaction" },
      l: blankLedger("x"),
      month,
      busy: false,
      onCommit: async () => {},
    }),
  );
  assert.ok(empty.includes("ابتدا"));
});
test("empty financial charts have readable empty states and valid chart geometry", () => {
  const l = blankLedger("x"),
    month = monthKey(today());
  const html = renderToStaticMarkup(
    React.createElement(CashFlow, { l, range: monthRange(month) }),
  );
  assert.ok(html.includes("مسیر پول هنوز شکل نگرفته"));
  const chart = renderToStaticMarkup(
    React.createElement(SpendingChart, { l, month }),
  );
  assert.ok(!chart.includes("NaN"));
});
