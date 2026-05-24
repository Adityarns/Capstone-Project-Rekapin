/**
 * ============================================================
 *    REKAPIN — Reports Header
 *    src/components/reports/ReportsHeader.jsx
 *
 *    Props:
 *    - quarter:         string  — selected quarter value
 *    - onQuarterChange: fn
 * ============================================================
 */

import { QUARTER_OPTIONS } from "../../data/reportsData";
import "./ReportsHeader.css";

/* ── Icons ── */
const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8"  y1="2" x2="8"  y2="6" />
    <line x1="3"  y1="10" x2="21" y2="10" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconTable = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18" />
  </svg>
);

/* ── Component ── */
export default function ReportsHeader({ quarter, onQuarterChange }) {
  const selectedLabel =
    QUARTER_OPTIONS.find((q) => q.value === quarter)?.label ?? quarter;

  return (
    <div className="rpt-header">

      {/* Left: title + subtitle */}
      <div className="rpt-header__left">
        <h1 className="rpt-header__title">Financial Reports</h1>
        <p className="rpt-header__subtitle">
          Summary of your business performance and impact.
        </p>
      </div>

      {/* Right: controls */}
      <div className="rpt-header__controls">

        {/* Quarter selector */}
        <div className="rpt-quarter-wrap">
          <span className="rpt-quarter-icon" aria-hidden="true">
            <IconCalendar />
          </span>
          <select
            className="rpt-quarter-select"
            value={quarter}
            onChange={(e) => onQuarterChange(e.target.value)}
            aria-label="Select quarter"
          >
            {QUARTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="rpt-quarter-chevron" aria-hidden="true">
            <IconChevronDown />
          </span>
        </div>

        {/* Export PDF */}
        <button
          type="button"
          className="rpt-btn rpt-btn--outline"
          onClick={() => console.log("Export PDF — TODO")}
        >
          <IconDownload />
          Export PDF
        </button>

        {/* Export Excel */}
        <button
          type="button"
          className="rpt-btn rpt-btn--primary"
          onClick={() => console.log("Export Excel — TODO")}
        >
          <IconTable />
          Export Excel
        </button>

      </div>
    </div>
  );
}