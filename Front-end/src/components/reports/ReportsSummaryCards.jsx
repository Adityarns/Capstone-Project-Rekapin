/**
 * ============================================================
 *    REKAPIN — Reports Summary Cards
 *    src/components/reports/ReportsSummaryCards.jsx
 * ============================================================
 */

// import { reportsSummary } from "../../data/reportsData";
import "./ReportsSummaryCards.css";

/* ── Icons ── */
const IconTrendUp = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconLeaf = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 8C8 10 5.9 16.17 3.82 19.83A1 1 0 0 0 5 21c8-3 11.17-5.17 13-13z" />
  </svg>
);

/* ── Single card ── */
function formatRp(value) {
  if (value === undefined || value === null) return "";
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatCarbonKg(valueInTons) {
  const kgValue = parseFloat(valueInTons) * 1000;
  if (!Number.isFinite(kgValue)) return "0.00 kg CO2";
  return `${kgValue.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} kg CO2`;
}

function MetricCard({ label, value, change, positive, onTrack, isCarbon }) {
  return (
    <div className="rpt-card">
      {/* Top row: label + badge */}
      <div className="rpt-card__top">
        <p className="rpt-card__label">{label}</p>

        {isCarbon && onTrack && (
          <span className="rpt-card__on-track">
            <IconLeaf />
            On Track
          </span>
        )}
      </div>

      {/* Value + trend */}
      <div className="rpt-card__value-row">
        <span className="rpt-card__value">{value}</span>

        {change !== undefined && (
          <span
            className={`rpt-card__change ${
              positive
                ? "rpt-card__change--positive"
                : "rpt-card__change--negative"
            }`}
          >
            <IconTrendUp />
            {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function ReportsSummaryCards({ summary }) {
  const summaryData = summary
    ? {
        totalRevenue: {
          label: "TOTAL REVENUE",
          value: summary.total_revenue,
          change: summary.revenue_variance_percent,
          positive: summary.revenue_variance_percent >= 0,
        },
        netIncome: {
          label: "NET INCOME",
          value: summary.net_income,
          change: summary.net_income_variance_percent,
          positive: summary.net_income_variance_percent >= 0,
        },
        carbonFootprint: {
          label: "CARBON FOOTPRINT",
          value: formatCarbonKg(summary.carbon_footprint_tons),
          change: summary.carbon_variance_percent,
          positive: summary.carbon_variance_percent <= 0,
          onTrack: summary.is_carbon_on_track,
        },
      }
    : {
        totalRevenue: {
          label: "TOTAL REVENUE",
          value: null,
          change: undefined,
          positive: true,
        },
        netIncome: {
          label: "NET INCOME",
          value: null,
          change: undefined,
          positive: true,
        },
        carbonFootprint: {
          label: "CARBON FOOTPRINT",
          value: "",
          change: undefined,
          positive: true,
          onTrack: false,
        },
      };

  const { totalRevenue, netIncome, carbonFootprint } = summaryData;

  return (
    <div className="rpt-cards-grid">
      <MetricCard
        label={totalRevenue.label}
        value={formatRp(totalRevenue.value)}
        change={totalRevenue.change}
        positive={totalRevenue.positive}
      />
      <MetricCard
        label={netIncome.label}
        value={formatRp(netIncome.value)}
        change={netIncome.change}
        positive={netIncome.positive}
      />
      <MetricCard
        label={carbonFootprint.label}
        value={carbonFootprint.value}
        change={Math.abs(carbonFootprint.change)}
        positive={carbonFootprint.positive}
        onTrack={carbonFootprint.onTrack}
        isCarbon
      />
    </div>
  );
}
