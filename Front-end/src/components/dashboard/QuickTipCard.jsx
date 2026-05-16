/**
 * ============================================================
 *    REKAPIN — Quick Tip Card
 *    src/components/dashboard/QuickTipCard.jsx
 * ============================================================
 *
 * @format
 */

import { quickTipData } from "../../data/dashboardData";
import "./QuickTipCard.css";

const IconBulb = () => (
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
    <line x1="9" y1="18" x2="15" y2="18" />
    <line x1="10" y1="22" x2="14" y2="22" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
  </svg>
);

export default function QuickTipCard() {
  const { message } = quickTipData;

  return (
    <div className="qtip-card">
      <p className="qtip-card__label">QUICK TIP</p>
      <div className="qtip-card__body">
        <span className="qtip-card__icon" aria-hidden="true">
          <IconBulb />
        </span>
        <p className="qtip-card__message">{message}</p>
      </div>
    </div>
  );
}
