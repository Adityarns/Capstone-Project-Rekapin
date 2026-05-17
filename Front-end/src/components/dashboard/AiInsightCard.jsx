/**
 * ============================================================
 *    REKAPIN — AI Insight Card
 *    src/components/dashboard/AiInsightCard.jsx
 * ============================================================
 *
 * @format
 */

import { aiInsight } from "../../data/dashboardData";
import "./AiInsightCard.css";

const IconSparkle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.2L12 16.4l-6.2 4.5 2.4-7.2L2 9.2h7.6L12 2z" />
  </svg>
);

const IconArrow = () => (
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
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default function AiInsightCard() {
  const { title, message, action } = aiInsight;

  return (
    <div className="ai-card" role="region" aria-label="AI Insight">
      <div className="ai-card__deco" aria-hidden="true" />

      <div className="ai-card__header">
        <span className="ai-card__icon" aria-hidden="true">
          <IconSparkle />
        </span>
        <span className="ai-card__label">{title}</span>
      </div>

      <p className="ai-card__message">{message}</p>

      <button type="button" className="ai-card__cta">
        {action} <IconArrow />
      </button>
    </div>
  );
}
