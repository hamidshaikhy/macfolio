import { test } from "node:test";
import assert from "node:assert/strict";
import { flowData, demoLedger, monthKey, today, monthRange } from "../src/model";
import type { FlowNode } from "../src/model";
import { layoutFlow, ribbonPath } from "../src/flow-layout";

const nodes = (values: number[], prefix: string): FlowNode[] => values.map((value, i) => ({
  id: `${prefix}-${i}`, name: `${prefix} ${i}`, value, color: "#81aebb",
}));
const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) <= Math.max(1, Math.abs(expected)) * 1e-10);

test("direct ribbons conserve each source and destination with a shared thickness scale", () => {
  for (const [sourceValues, targetValues] of [
    [[70, 30], [60, 25, 10, 5]],
    [[100], [100]],
    [[1, 999999999999], [999999999999, 1]],
    [[3, 4, 5], [6, 6]],
  ]) {
    const total = sourceValues.reduce((s, n) => s + n, 0);
    const layout = layoutFlow(nodes(sourceValues, "source"), nodes(targetValues, "target"), total, 300, 26);
    for (const source of layout.sources) {
      const outgoing = layout.links.filter((l) => l.source.id === source.id);
      close(outgoing.reduce((sum, l) => sum + l.value, 0), source.value);
      close(outgoing.reduce((sum, l) => sum + l.h, 0), source.h);
      close(outgoing[0].sy, source.y);
      close(outgoing.at(-1)!.sy + outgoing.at(-1)!.h, source.y + source.h);
    }
    for (const target of layout.targets) {
      const incoming = layout.links.filter((l) => l.target.id === target.id);
      close(incoming.reduce((sum, l) => sum + l.value, 0), target.value);
      close(incoming.reduce((sum, l) => sum + l.h, 0), target.h);
      close(incoming[0].ty, target.y);
      close(incoming.at(-1)!.ty + incoming.at(-1)!.h, target.y + target.h);
    }
    for (const link of layout.links) {
      assert.ok(link.h > 0);
      assert.ok(!/NaN|Infinity/.test(ribbonPath(link, 149, 651)));
      close(link.h / link.value, layout.scale);
    }
  }
});

test("Sankey keeps every expense category, with surplus first and readable label spacing", () => {
  const l = demoLedger();
  const data = flowData(l, monthRange(monthKey(today())));
  assert.equal(data.targets[0].id, "surplus");
  for (const category of l.categories.filter((c) => c.kind === "expense")) {
    if (l.transactions.some((t) => t.categoryId === category.id && monthKey(t.date) === monthKey(today())))
      assert.ok(data.targets.some((n) => n.id === category.id));
  }
  const height = Math.max(300, 150 + 26 * (Math.max(data.sources.length, data.targets.length) - 1));
  const layout = layoutFlow(data.sources, data.targets, data.total, height, 26);
  for (const column of [layout.sources, layout.targets]) {
    for (let i = 1; i < column.length; i++)
      assert.ok(column[i].y - (column[i - 1].y + column[i - 1].h) >= 26 - 1e-8);
    assert.ok(column.every((n) => n.y >= 22 && n.y + n.h <= height - 22 + 1e-8));
  }
});

test("empty flow geometry is finite", () => {
  const layout = layoutFlow([], [], 0, 300, 26);
  assert.equal(layout.scale, 0);
  assert.deepEqual(layout.links, []);
});
