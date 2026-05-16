/**
 * ============================================================
 *    REKAPIN — Cash Flow Trend Chart
 *    src/components/dashboard/CashFlowChart.jsx
 *
 *    Stacked bar chart: Income (sage green) + Expense (beige)
 *    per bulan. Menggunakan Recharts.
 * ============================================================
 * @format
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import "./CashFlowChart.css";

/* ── Chart Colors — hardcoded karena CSS vars tidak bisa
   diakses langsung di Recharts prop ── */
const COLORS = {
  income: "#7aad7a", // ≈ var(--color-accent-400)
  expense: "#c8b89a", // ≈ var(--color-neutral-400) warm beige
};

/* ── Custom Tooltip ── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const formatRp = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="chart-tooltip-row">
          <span
            className="chart-tooltip-dot"
            style={{ background: entry.color }}
          />
          <span className="chart-tooltip-name">
            {entry.dataKey === "income" ? "Income" : "Expense"}
          </span>
          <span className="chart-tooltip-value">{formatRp(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Legend ── */
function ChartLegend() {
  return (
    <div className="chart-legend">
      <div className="chart-legend-item">
        <span
          className="chart-legend-dot"
          style={{ background: COLORS.income }}
        />
        <span className="chart-legend-label">Income</span>
      </div>
      <div className="chart-legend-item">
        <span
          className="chart-legend-dot"
          style={{ background: COLORS.expense }}
        />
        <span className="chart-legend-label">Expense</span>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function CashFlowChart({ data }) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h2 className="chart-card-title">Cash Flow Trend</h2>
        <ChartLegend />
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
            barSize={36}
            barGap={4}
          >
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#a89880", fontWeight: 500 }}
              dy={8}
            />
            <YAxis hide />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(0,0,0,0.04)", radius: 6 }}
            />

            {/* Stacked: expense di bawah, income di atas */}
            <Bar
              dataKey="expense"
              stackId="a"
              fill={COLORS.expense}
              radius={[0, 0, 6, 6]}
            />
            <Bar
              dataKey="income"
              stackId="a"
              fill={COLORS.income}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
