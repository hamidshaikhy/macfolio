import { useId, useMemo, useState } from "react";
import {
  flowData,
  fa,
  money,
  summary,
  shiftMonth,
  monthRange,
  monthTitle,
} from "./model";
import type { Ledger, Range, FlowNode } from "./model";
import { Empty } from "./ui";
import { layoutFlow, ribbonPath } from "./flow-layout";
export function CashFlow({ l, range }: { l: Ledger; range: Range }) {
  const data = useMemo(() => flowData(l, range), [l, range]),
    [active, setActive] = useState<string | null>(null);
  if (!data.total)
    return (
      <Empty
        title="مسیر پول هنوز شکل نگرفته"
        text="با ثبت درآمد یا هزینه، مسیر گردش پول را اینجا ببین."
      />
    );
  const W = 800,
    H = Math.max(
      300,
      150 + 26 * (Math.max(data.sources.length, data.targets.length) - 1),
    ),
    layout = layoutFlow(data.sources, data.targets, data.total, H, 26);
  return (
    <div className="flow-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="sankey"
        role="img"
        aria-label="نمودار سنکی؛ درآمدها در چپ، هزینه‌ها و مازاد دوره در راست؛ اتصال مستقیم با تقسیم متناسب"
      >
        {layout.links.map((link) => (
          <path
            key={`${link.source.id}-${link.target.id}`}
            d={ribbonPath(link, 149, 651)}
            fill={link.source.color}
            fillOpacity={0.28}
            opacity={
              active && active !== link.source.id && active !== link.target.id
                ? 0.25
                : 1
            }
            onMouseEnter={() => setActive(link.source.id)}
            onMouseLeave={() => setActive(null)}
          >
            <title>{`${link.source.name} به ${link.target.name}؛ تقسیم متناسب برای نمایش مجموع‌ها`}</title>
          </path>
        ))}
        {layout.sources.map((n) => (
          <g
            key={n.id}
            onMouseEnter={() => setActive(n.id)}
            onMouseLeave={() => setActive(null)}
          >
            <title>{`${n.name}: ${money(n.value)}`}</title>
            <rect
              x="140"
              y={n.y}
              width="9"
              height={Math.max(n.h, 1)}
              fill={n.color}
            />
            <text
              x="130"
              y={n.y + n.h / 2 + 4}
              textAnchor="start"
              direction="rtl"
              fill="#e5e9e3"
              fontSize="13"
            >
              {n.name.length > 17 ? n.name.slice(0, 16) + "…" : n.name}
            </text>
          </g>
        ))}
        {layout.targets.map((n) => (
          <g
            key={n.id}
            onMouseEnter={() => setActive(n.id)}
            onMouseLeave={() => setActive(null)}
          >
            <title>{`${n.name}: ${money(n.value)}`}</title>
            <rect
              x="651"
              y={n.y}
              width="9"
              height={Math.max(n.h, 1)}
              fill={n.color}
            />
            <text
              x="670"
              y={n.y + n.h / 2 + 4}
              textAnchor="end"
              direction="rtl"
              fill="#e5e9e3"
              fontSize="13"
            >
              {n.name.length > 17 ? n.name.slice(0, 16) + "…" : n.name}
            </text>
          </g>
        ))}
      </svg>
      <div className="flow-mobile">
        <MobileFlow
          sources={data.sources}
          targets={data.targets}
          total={data.total}
        />
        <details>
          <summary>جزئیات مبالغ و دسته‌ها</summary>
          {[
            { title: "منابع ورودی", items: data.sources },
            { title: "مصرف و مانده", items: data.targets },
          ].map((group) => (
            <section key={group.title}>
              <h3>{group.title}</h3>
              {group.items.map((n) => (
                <button
                  type="button"
                  className="flow-mobile-row"
                  key={n.id}
                  onClick={() => setActive(active === n.id ? null : n.id)}
                >
                  <span>
                    <i style={{ background: n.color }} />
                    {n.name}
                    <b>
                      {fa(n.value)} <small>تومان</small>
                    </b>
                  </span>
                  <span className="flow-meter">
                    <span
                      style={{
                        width: `${(n.value / data.total) * 100}%`,
                        background: n.color,
                      }}
                    />
                  </span>
                </button>
              ))}
            </section>
          ))}
        </details>
      </div>
      <p className="chart-note">
        اتصال‌ها تقسیم متناسب درآمد بین هزینه‌ها و مانده را نشان می‌دهند؛ منبع
        دقیق هر پرداخت مشخص نیست. «مازاد دوره» درآمد منهای هزینه است. در موبایل
        دسته‌های کوچک‌تر تجمیع شده‌اند؛ جزئیات مبالغ قابل بازکردن است.
      </p>
    </div>
  );
}
export function SpendingChart({ l, month }: { l: Ledger; month: string }) {
  const id = useId().replace(/:/g, ""),
    [hover, setHover] = useState<number | null>(null);
  const data = Array.from({ length: 6 }, (_, i) => {
    const m = shiftMonth(month, i - 5);
    return { m, ...summary(l, monthRange(m)) };
  });
  const max = Math.max(...data.map((x) => Math.max(x.expense, x.income)), 1);
  return (
    <div className="bars-chart">
      <div className="chart-legend">
        <span>
          <i style={{ background: "#c9b079" }} />
          درآمد
        </span>
        <span>
          <i style={{ background: "#d28e7e" }} />
          هزینه
        </span>
      </div>
      <svg
        role="img"
        aria-label="مقایسه درآمد و هزینه شش ماه"
        viewBox="0 0 420 250"
      >
        <defs>
          <pattern id={id} width="60" height="50" patternUnits="userSpaceOnUse">
            <path
              d="M 0 50 L 60 50"
              fill="none"
              stroke="#304548"
              strokeWidth=".6"
              strokeDasharray="3 4"
            />
          </pattern>
        </defs>
        <rect x="25" y="10" width="385" height="195" fill={`url(#${id})`} />
        {data.map((d, i) => {
          const x = 38 + i * 62,
            a = (d.income / max) * 170,
            b = (d.expense / max) * 170;
          return (
            <g
              key={d.m}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <rect
                x={x}
                y={205 - a}
                width="16"
                height={a}
                rx="2"
                fill="#c9b079"
                opacity=".8"
              />
              <rect
                x={x + 19}
                y={205 - b}
                width="16"
                height={b}
                rx="2"
                fill="#d28e7e"
                opacity=".8"
              />
              <text
                x={x + 17}
                y="232"
                textAnchor="middle"
                fill="#9bafac"
                fontSize="11"
              >
                {monthTitle(d.m).split(" ")[0]}
              </text>
              <title>{`${monthTitle(d.m)}؛ درآمد ${money(d.income)}؛ هزینه ${money(d.expense)}`}</title>
            </g>
          );
        })}
      </svg>
      <p className="chart-note">
        {hover !== null
          ? `${monthTitle(data[hover].m)} · درآمد ${money(data[hover].income)} · هزینه ${money(data[hover].expense)}`
          : "درآمد و هزینهٔ ثبت‌شده؛ انتقال بین حساب‌ها در گزارش محاسبه نمی‌شود."}
      </p>
    </div>
  );
}

function MobileFlow({
  sources,
  targets,
  total,
}: {
  sources: FlowNode[];
  targets: FlowNode[];
  total: number;
}) {
  const compact = (v: FlowNode[]) =>
    v.length > 3
      ? [
          ...v.slice(0, 2),
          {
            id: "mobile-other",
            name: "سایر",
            color: "#8ea39e",
            value: safeTotal(v.slice(2)),
          },
        ]
      : v;
  const layout = layoutFlow(
    compact(sources), compact(targets), total, 245, 25, 30, 45,
  );
  return (
    <svg
      className="mobile-sankey"
      viewBox="0 0 360 245"
      role="img"
      aria-label="مسیر پول؛ منابع در چپ و مصرف و مانده در راست؛ اتصال مستقیم با تقسیم متناسب"
    >
      {layout.links.map((link) => (
        <path
          key={`${link.source.id}-${link.target.id}`}
          d={ribbonPath(link, 86, 274)}
          fill={link.source.color}
          fillOpacity=".3"
        >
          <title>{`${link.source.name} به ${link.target.name}؛ تقسیم متناسب برای نمایش مجموع‌ها`}</title>
        </path>
      ))}
      {layout.sources.map((n) => (
        <g key={n.id}>
          <rect
            x="81"
            y={n.y}
            width="5"
            height={Math.max(n.h, 1)}
            fill={n.color}
          />
          <text
            x="74"
            y={n.y + n.h / 2}
            direction="rtl"
            textAnchor="start"
            fill="#dbe3dc"
            fontSize="10"
          >
            {n.name.length > 11 ? n.name.slice(0, 10) + "…" : n.name}
          </text>
          <title>{`${n.name}: ${money(n.value)}`}</title>
        </g>
      ))}
      {layout.targets.map((n) => (
        <g key={n.id}>
          <rect
            x="274"
            y={n.y}
            width="5"
            height={Math.max(n.h, 1)}
            fill={n.color}
          />
          <text
            x="354"
            y={n.y + n.h / 2}
            direction="rtl"
            textAnchor="start"
            fill="#dbe3dc"
            fontSize="10"
          >
            {n.name.length > 11 ? n.name.slice(0, 10) + "…" : n.name}
          </text>
          <title>{`${n.name}: ${money(n.value)}`}</title>
        </g>
      ))}
      <text x="180" y="231" textAnchor="middle" fill="#93aaa6" fontSize="9">
        از درآمد تا هزینه و مانده
      </text>
    </svg>
  );
}
function safeTotal(nodes: FlowNode[]) {
  return nodes.reduce((s, n) => s + n.value, 0);
}
