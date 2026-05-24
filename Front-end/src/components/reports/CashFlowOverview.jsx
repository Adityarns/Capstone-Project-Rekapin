/**
 * ============================================================
 *    REKAPIN — Cash Flow Overview Chart
 *    src/components/reports/CashFlowOverview.jsx
 *
 *    Grouped bar chart: Inflow (sage green) vs Outflow (beige)
 *    per month — uses Recharts (already installed for Dashboard)
 * ============================================================
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

import { cashFlowOverviewData } from "../../data/reportsData";
import "./CashFlowOverview.css";

/* ── Tooltip ── */
function CashFlowTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const fmt = (v) => `Rp ${(v / 1_000_000).toFixed(1)} jt`;
  return (
    <div className="rpt-cf-tooltip">
      <p className="rpt-cf-tooltip__label">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="rpt-cf-tooltip__row">
          <span className="rpt-cf-tooltip__dot" style={{ backgroundColor: entry.fill }} />
          <span className="rpt-cf-tooltip__name">
            {entry.dataKey === "inflow" ? "Inflow" : "Outflow"}
          </span>
          <span className="rpt-cf-tooltip__val">{fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Legend ── */
function ChartLegend() {
  return (
    <div className="rpt-cf-legend">
      <span className="rpt-cf-legend__item">
        <span className="rpt-cf-legend__dot rpt-cf-legend__dot--inflow" />
        Inflow
      </span>
      <span className="rpt-cf-legend__item">
        <span className="rpt-cf-legend__dot rpt-cf-legend__dot--outflow" />
        Outflow
      </span>
    </div>
  );
}

/* ── Main component ── */
export default function CashFlowOverview() {
  return (
    <div className="rpt-cf-card">
      <div className="rpt-cf-card__header">
        <h3 className="rpt-cf-card__title">Cash Flow Overview</h3>
      </div>

      <div className="rpt-cf-card__chart">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={cashFlowOverviewData}
            margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
            barCategoryGap="30%"
            barGap={4}
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
                fontSize:   11,
                fill:       "var(--color-text-muted)",
                fontFamily: "var(--font-sans)",
              }}
            />
            <YAxis hide />
            <Tooltip
              content={<CashFlowTooltip />}
              cursor={{ fill: "var(--color-neutral-100)", radius: 4 }}
            />
            {/* Grouped bars — no stackId */}
            <Bar
              dataKey="inflow"
              fill="var(--color-accent-500)"
              radius={[5, 5, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="outflow"
              fill="var(--color-neutral-300)"
              radius={[5, 5, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ChartLegend />
    </div>
  );
}