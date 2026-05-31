/**
 * ============================================================
 *    REKAPIN — Green Insights Section
 *    src/components/carbon/GreenInsights.jsx
 *
 *    Static demo template — no AI/ML yet.
 *    Data dari carbonData.js (reusable dummy).
 * ============================================================
 */

import "./GreenInsights.css";

const IconSparkle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.2L12 16.4l-6.2 4.5 2.4-7.2L2 9.2h7.6L12 2z" />
  </svg>
);

const IconSaving = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

function InsightCard({ insight }) {
  // Try to determine impact level from text if not provided directly
  const impactLevel = insight.impactLevel || "medium";
  const impact = insight.impact || "Medium Impact";
  const emoji = insight.emoji || (insight.icon === "lightning" ? "⚡" : insight.icon === "Transportation" ? "🚚" : "♻️");

  return (
    <div className="gi-card">

      {/* Top: category badge + impact level */}
      <div className="gi-card__top">
        <span className="gi-card__category">{insight.category || insight.title.split(" ")[0]}</span>
        <span className={`gi-card__impact gi-card__impact--${impactLevel}`}>
          {impact}
        </span>
      </div>

      {/* Emoji icon + title */}
      <div className="gi-card__heading">
        <span className="gi-card__emoji" aria-hidden="true">
          {emoji}
        </span>
        <h3 className="gi-card__title">{insight.title}</h3>
      </div>

      {/* Description */}
      <p className="gi-card__desc">{insight.description}</p>

      {/* Saving estimate */}
      {insight.saving && (
        <div className="gi-card__saving">
          <span className="gi-card__saving-icon" aria-hidden="true">
            <IconSaving />
          </span>
          <span className="gi-card__saving-label">Est. saving:</span>
          <span className="gi-card__saving-value">{insight.saving}</span>
        </div>
      )}

    </div>
  );
}

export default function GreenInsights({ insights = [] }) {
  return (
    <section className="gi-section">

      {/* Section header */}
      <div className="gi-section__header">
        <div className="gi-section__title-group">
          <span className="gi-section__icon" aria-hidden="true">
            <IconSparkle />
          </span>
          <h2 className="gi-section__title">Green Insights</h2>
        </div>
        <span className="gi-section__badge">AI Powered</span>
      </div>

      <p className="gi-section__subtitle">
        Actionable recommendations to reduce your environmental impact.
      </p>

      {/* Insight cards */}
      <div className="gi-cards-grid">
        {insights.map((insight, index) => (
          <InsightCard key={insight.id || index} insight={insight} />
        ))}
        {insights.length === 0 && (
          <p style={{ gridColumn: "1 / -1", color: "var(--color-text-muted)" }}>
            No insights available for this month yet.
          </p>
        )}
      </div>

    </section>
  );
}