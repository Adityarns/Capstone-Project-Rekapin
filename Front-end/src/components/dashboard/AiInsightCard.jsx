/**
 * ============================================================
 *    REKAPIN — AI Insight Card
 *    src/components/dashboard/AiInsightCard.jsx
 *
 *    Card berwarna maroon gelap dengan:
 *    - Label "AI INSIGHT" + sparkle icon
 *    - Pesan insight/warning
 *    - CTA link "View Analysis →"
 *    - Decorative star shape di background (CSS only)
 * ============================================================
 *
 * @format
 */

import { aiInsightData } from "../../data/dashboardData";
import "./AiInsightCard.css";

/* ── Sparkle / AI Icon ── */
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
  const { title, message, action } = aiInsightData;

  return (
    <div className="ai-card" role="region" aria-label="AI Insight">
      {/* Decorative background star — CSS only, aria-hidden */}
      <div className="ai-card__deco" aria-hidden="true" />

      {/* Header */}
      <div className="ai-card__header">
        <span className="ai-card__icon" aria-hidden="true">
          <IconSparkle />
        </span>
        <span className="ai-card__label">{title}</span>
      </div>

      {/* Message */}
      <p className="ai-card__message">{message}</p>

      {/* CTA */}
      <button type="button" className="ai-card__cta">
        {action} <IconArrow />
      </button>
    </div>
  );
}
