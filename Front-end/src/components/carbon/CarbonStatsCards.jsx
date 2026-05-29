/**
 * ============================================================
 *    REKAPIN — Carbon Stats Cards
 *    src/components/carbon/CarbonStatsCards.jsx
 *
 *    Card 1: Total Carbon Footprint
 *    Card 2: Sustainability Progress
 *    Card 3: Carbon Breakdown (Electricity + Transportation)
 * ============================================================
 */

import { carbonSummary } from "../../data/carbonData";
import "./CarbonStatsCards.css";

/* ── Icons ── */
const IconTrendDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const IconLeaf = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

/* ── Card 1: Total Footprint ── */
function FootprintCard({ data }) {
  return (
    <div className="ct-card ct-card--footprint">
      <div className="ct-card__top">
        <p className="ct-card__label">TOTAL CARBON FOOTPRINT</p>
        <span className="ct-card__eco-icon"><IconLeaf /></span>
      </div>

      <div className="ct-card__value-row">
        <span className="ct-card__value">
          {data.value}
          <span className="ct-card__unit"> {data.unit}</span>
        </span>
      </div>

      <div className="ct-card__meta-row">
        <span className="ct-card__trend ct-card__trend--good">
          <IconTrendDown />
          {Math.abs(data.change)}% {data.period}
        </span>
        <span className="ct-card__meta-label">This Month</span>
      </div>
    </div>
  );
}

/* ── Card 2: Sustainability Progress ── */
function ProgressCard({ data }) {
  const pct = (data.score / data.maxScore) * 100;
  const targetPct = (data.target / data.maxScore) * 100;

  return (
    <div className="ct-card ct-card--progress">
      <p className="ct-card__label">SUSTAINABILITY PROGRESS</p>

      <div className="ct-card__score-row">
        <span className="ct-card__value">{data.score}</span>
        <span className={`ct-card__score-label ct-card__score-label--${data.label.toLowerCase()}`}>
          {data.label}
        </span>
      </div>

      {/* Progress track with target marker */}
      <div className="ct-progress-wrap">
        <div className="ct-progress-bar" role="progressbar"
          aria-valuenow={data.score} aria-valuemin={0} aria-valuemax={data.maxScore}>
          <div className="ct-progress-fill" style={{ width: `${pct}%` }} />
          {/* Target line */}
          <div className="ct-progress-target" style={{ left: `${targetPct}%` }}
            title={`Target: ${data.target}`} />
        </div>
        <div className="ct-progress-labels">
          <span>0</span>
          <span>Target {data.target}</span>
          <span>{data.maxScore}</span>
        </div>
      </div>

      <p className="ct-card__desc">{data.description}</p>
    </div>
  );
}

/* ── Card 3: Carbon Breakdown ── */
function BreakdownCard({ items }) {
  return (
    <div className="ct-card ct-card--breakdown">
      <p className="ct-card__label">CARBON BREAKDOWN</p>

      <div className="ct-breakdown-list">
        {items.map((item) => (
          <div key={item.id} className="ct-breakdown-item">
            <div className="ct-breakdown-item__header">
              <div className="ct-breakdown-item__label-group">
                <span
                  className="ct-breakdown-item__dot"
                  style={{ backgroundColor: item.color }}
                />
                <span className="ct-breakdown-item__label">
                  {item.label}
                  {item.note && (
                    <span className="ct-breakdown-item__note"> ({item.note})</span>
                  )}
                </span>
              </div>
              <div className="ct-breakdown-item__values">
                <span className="ct-breakdown-item__pct">{item.percentage}%</span>
                <span className="ct-breakdown-item__val">{item.value} {item.unit}</span>
              </div>
            </div>

            {/* Horizontal progress bar */}
            <div className="ct-breakdown-bar">
              <div
                className="ct-breakdown-bar__fill"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main export ── */
export default function CarbonStatsCards() {
  const { totalFootprint, sustainabilityScore, carbonBreakdown } = carbonSummary;

  return (
    <div className="ct-cards-grid">
      <FootprintCard  data={totalFootprint} />
      <ProgressCard   data={sustainabilityScore} />
      <BreakdownCard  items={carbonBreakdown} />
    </div>
  );
}