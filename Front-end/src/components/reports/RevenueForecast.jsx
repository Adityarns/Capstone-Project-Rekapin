/**
 * ============================================================
 *    REKAPIN — Revenue Forecast Chart
 *    src/components/reports/RevenueForecast.jsx
 *
 *    AreaChart with gradient fill.
 *    Last data point = predicted value.
 *    "Predicted +8% next quarter" badge top-right.
 * ============================================================
 */

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
} from "recharts";

import { revenueForecastData } from "../../data/reportsData";
import "./RevenueForecast.css";

/* ── Custom dot — visible only on the forecast transition point ── */
const CustomDot = (props) => {
  const { cx, cy, index } = props;
  /* Show a visible circle only on the 4th point (last historical) */
  if (index !== 3) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="var(--color-bg-surface)"
      stroke="var(--color-neutral-500)"
      strokeWidth={2}
    />
  );
};

/* ── Tooltip ── */
function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rpt-fc-tooltip">
      <p className="rpt-fc-tooltip__label">{label}</p>
      <p className="rpt-fc-tooltip__val">Rp {payload[0].value}M</p>
    </div>
  );
}

/* ── Main component ── */
export default function RevenueForecast() {
  return (
    <div className="rpt-fc-card">

      {/* Header */}
      <div className="rpt-fc-card__header">
        <h3 className="rpt-fc-card__title">Revenue Forecast</h3>
        <span className="rpt-fc-card__badge">Predicted +8% next quarter</span>
      </div>

      {/* Chart */}
      <div className="rpt-fc-card__chart">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={revenueForecastData}
            margin={{ top: 16, right: 8, left: -32, bottom: 0 }}
          >
            <defs>
              <linearGradient id="rfGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--color-accent-400)" stopOpacity={0.18} />
                <stop offset="90%" stopColor="var(--color-accent-400)" stopOpacity={0.02} />
              </linearGradient>
            </defs>

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

            <Tooltip content={<ForecastTooltip />} />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-neutral-600)"
              strokeWidth={2}
              fill="url(#rfGradient)"
              dot={<CustomDot />}
              activeDot={{ r: 4, fill: "var(--color-neutral-600)", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}