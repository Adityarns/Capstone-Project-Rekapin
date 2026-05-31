/**
 * ============================================================
 * REKAPIN — Revenue Forecast Chart
 * src/components/reports/RevenueForecast.jsx
 * ============================================================
 */

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import "./RevenueForecast.css";

/* ── Custom dot — visible only on the forecast transition point (Titik Terakhir) ── */
const CustomDot = (props) => {
  const { cx, cy, index, dataLength } = props;
  // Hanya tampilkan titik berkedip di data paling ujung (prediksi AI)
  if (index !== dataLength - 1) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="var(--color-bg-surface)"
      stroke="var(--color-accent-600)" // Warna titik dibuat mencolok
      strokeWidth={2}
    />
  );
};

/* ── Tooltip dengan Format Rupiah ── */
function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const formattedValue = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(payload[0].value);

  return (
    <div className="rpt-fc-tooltip">
      <p className="rpt-fc-tooltip__label">{label}</p>
      <p className="rpt-fc-tooltip__val">{formattedValue}</p>
    </div>
  );
}

/* ── Main component ── */
export default function RevenueForecast({ forecast, historical = [] }) {
  // 1. Susun data grafik (Ambil histori pemasukan)
  const chartData = historical.map((item) => ({
    month: item.month,
    revenue: item.inflow,
  }));

  // 2. Siapkan lencana (Badge) default
  let badgeText = "AI Engine Offline";
  let badgeColor = "var(--color-neutral-500)";

  // 3. Jahit data prediksi AI ke ujung grafik historis
  if (forecast && chartData.length > 0) {
    const lastHistoricalRevenue = chartData[chartData.length - 1].revenue;
    const predictedRevenue = forecast.predictedRevenueNextHorizon;

    // Tambahkan titik prediksi ke array grafik
    chartData.push({
      month: "Next 30D",
      revenue: predictedRevenue,
    });

    // Hitung persentase dinamis
    if (lastHistoricalRevenue > 0) {
      const diff = predictedRevenue - lastHistoricalRevenue;
      const pct = (diff / lastHistoricalRevenue) * 100;
      const isPositive = pct >= 0;

      badgeText = `Predicted ${isPositive ? "+" : ""}${pct.toFixed(1)}% next 30 days`;
      badgeColor = isPositive
        ? "var(--color-accent-600)"
        : "var(--color-error)"; // Ganti warna CSS error Anda jika beda
    } else {
      badgeText = `Predicted Growth next 30 days`;
      badgeColor = "var(--color-accent-600)";
    }
  } else if (!forecast && chartData.length > 0) {
    badgeText = "Historical Data Only";
  }

  // Fallback jika tidak ada data sama sekali
  if (chartData.length === 0) {
    return (
      <div className="rpt-fc-card">
        <div className="rpt-fc-card__header">
          <h3 className="rpt-fc-card__title">Revenue Forecast</h3>
        </div>
        <div style={{ padding: "20px", color: "var(--color-text-muted)" }}>
          Belum ada data transaksi yang cukup untuk prediksi.
        </div>
      </div>
    );
  }

  return (
    <div className="rpt-fc-card">
      {/* Header */}
      <div className="rpt-fc-card__header">
        <h3 className="rpt-fc-card__title">Revenue Forecast</h3>
        <span
          className="rpt-fc-card__badge"
          style={{ color: badgeColor, borderColor: badgeColor }}
        >
          {badgeText}
        </span>
      </div>

      {/* Chart */}
      <div className="rpt-fc-card__chart">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={chartData}
            margin={{ top: 16, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="rfGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-accent-400)"
                  stopOpacity={0.25}
                />
                <stop
                  offset="90%"
                  stopColor="var(--color-accent-400)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>

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

            <Tooltip content={<ForecastTooltip />} />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-neutral-600)"
              strokeWidth={2}
              fill="url(#rfGradient)"
              dot={(props) => (
                <CustomDot {...props} dataLength={chartData.length} />
              )}
              activeDot={{
                r: 4,
                fill: "var(--color-neutral-600)",
                strokeWidth: 0,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
