/**
 * ============================================================
 *    REKAPIN — Reports Summary Cards
 *    src/components/reports/ReportsSummaryCards.jsx
 * ============================================================
 */

import { reportsSummary, formatRpShort } from "../../data/reportsData";
import "./ReportsSummaryCards.css";

/* ── Icons ── */
const IconTrendUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
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
          <span className={`rpt-card__change ${
            positive ? "rpt-card__change--positive" : "rpt-card__change--negative"
          }`}>
            <IconTrendUp />
            {Math.abs(change)}%
          </span>
        )}
      </div>

    </div>
  );
}

/* ── Main component ── */
export default function ReportsSummaryCards() {
  const { totalRevenue, netIncome, carbonFootprint } = reportsSummary;

  return (
    <div className="rpt-cards-grid">
      <MetricCard
        label={totalRevenue.label}
        value={formatRpShort(totalRevenue.value)}
        change={totalRevenue.change}
        positive={totalRevenue.positive}
      />
      <MetricCard
        label={netIncome.label}
        value={formatRpShort(netIncome.value)}
        change={netIncome.change}
        positive={netIncome.positive}
      />
      <MetricCard
        label={carbonFootprint.label}
        value={carbonFootprint.value}
        change={Math.abs(carbonFootprint.change)}
        positive={true}   /* decreasing carbon = positive */
        onTrack={carbonFootprint.onTrack}
        isCarbon
      />
    </div>
  );
}