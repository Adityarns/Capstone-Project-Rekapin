/**
 * ============================================================
 *    REKAPIN — Cash Flow Trend Chart
 *    src/components/dashboard/CashFlowChart.jsx
 *
 *    Props:
 *    - data: array dari cashFlowData (dipass dari Dashboard.jsx)
 * ============================================================
 *
 * @format
 */

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import "./CashFlowChart.css";

/* ── Custom Tooltip ── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const formatVal = (v) => `Rp ${(v / 1_000_000).toFixed(1)} jt`;

  return (
    <div className="cashflow-tooltip">
      <p className="cashflow-tooltip__label">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="cashflow-tooltip__row">
          <span
            className="cashflow-tooltip__dot"
            style={{ backgroundColor: entry.fill }}
          />
          <span className="cashflow-tooltip__name">
            {entry.dataKey === "income" ? "Income" : "Expense"}
          </span>
          <span className="cashflow-tooltip__value">
            {formatVal(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Custom Legend ── */
function ChartLegend() {
  return (
    <div className="cashflow-legend">
      <span className="cashflow-legend__item">
        <span className="cashflow-legend__dot cashflow-legend__dot--income" />
        Income
      </span>
      <span className="cashflow-legend__item">
        <span className="cashflow-legend__dot cashflow-legend__dot--expense" />
        Expense
      </span>
    </div>
  );
}

/* ── Main Component ── */
export default function CashFlowChart({ data }) {
  // Check apakah data kosong atau tidak ada
  const hasData = data && Array.isArray(data) && data.length > 0;

  return (
    <div className="cashflow-card">
      <div className="cashflow-card__header">
        <h3 className="cashflow-card__title">Cash Flow Trend</h3>
        <ChartLegend />
      </div>

      {hasData ? (
        <div className="cashflow-card__chart">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data}
              margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
              barSize={36}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--color-border)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 11,
                  fill: "var(--color-text-muted)",
                  fontFamily: "var(--font-sans)",
                }}
              />
              <YAxis hide />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "var(--color-neutral-100)", radius: 4 }}
              />
              {/* Expense di bawah, income di atas — stacked */}
              <Bar
                dataKey="expense"
                stackId="cashflow"
                fill="var(--color-neutral-300)"
                radius={[0, 0, 6, 6]}
              />
              <Bar
                dataKey="income"
                stackId="cashflow"
                fill="var(--color-accent-400)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="cashflow-card__empty">
          <p className="cashflow-card__empty-text">Belum ada transaksi</p>
        </div>
      )}
    </div>
  );
}
