/**
 * ============================================================
 *    REKAPIN — Summary Card
 *    src/components/dashboard/SummaryCard.jsx
 * ============================================================
 * @format
 */

import "./SummaryCard.css";

const IconTrendUp = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.25"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconLeaf = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

export default function SummaryCard({
  type,
  label,
  value,
  unit,
  change,
  changeLabel,
  trend,
}) {
  const isCarbon = type === "carbon";

  const formatValue = () => {
    if (isCarbon) return value.toFixed(1);
    // Format angka dengan titik ribuan (Indonesia style)
    return new Intl.NumberFormat("id-ID").format(value);
  };

  const getBadgeClass = () => {
    if (type === "expense") return "sc-badge sc-badge--warn";
    if (isCarbon && change < 0) return "sc-badge sc-badge--good";
    if (isCarbon && change > 0) return "sc-badge sc-badge--warn";
    return "sc-badge sc-badge--good";
  };

  return (
    <article
      className={`summary-card ${isCarbon ? "summary-card--carbon" : ""}`}
    >
      {/* Label + Carbon Icon */}
      <header className="sc-header">
        <span className="sc-label">{label}</span>
        {isCarbon && (
          <span className="sc-leaf-icon" aria-hidden="true">
            <IconLeaf />
          </span>
        )}
      </header>

      {/* Value */}
      <div className="sc-value-row">
        {!isCarbon && <span className="sc-prefix">Rp</span>}
        <span className="sc-value">{formatValue()}</span>
        {isCarbon && <span className="sc-unit">{unit}</span>}
      </div>

      {/* Footer: badge or trending arrow */}
      <footer className="sc-footer">
        {change !== null ? (
          <span className={getBadgeClass()}>
            {change > 0 ? "+" : ""}
            {change}%
            {changeLabel && (
              <span className="sc-badge-sub"> {changeLabel}</span>
            )}
          </span>
        ) : (
          <span
            className={`sc-trend-arrow sc-trend-arrow--${trend}`}
            aria-label="Trending up"
          >
            <IconTrendUp />
          </span>
        )}
      </footer>
    </article>
  );
}
