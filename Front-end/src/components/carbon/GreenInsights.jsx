/**
 * ============================================================
 *    REKAPIN — Green Insights Section
 *    src/components/carbon/GreenInsights.jsx
 *
 *    Static demo template — no AI/ML yet.
 *    Data dari carbonData.js (reusable dummy).
 * ============================================================
 */

import { greenInsights } from "../../data/carbonData";
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
  return (
    <div className="gi-card">

      {/* Top: category badge + impact level */}
      <div className="gi-card__top">
        <span className="gi-card__category">{insight.category}</span>
        <span className={`gi-card__impact gi-card__impact--${insight.impactLevel}`}>
          {insight.impact}
        </span>
      </div>

      {/* Emoji icon + title */}
      <div className="gi-card__heading">
        <span className="gi-card__emoji" aria-hidden="true">
          {insight.emoji}
        </span>
        <h3 className="gi-card__title">{insight.title}</h3>
      </div>

      {/* Description */}
      <p className="gi-card__desc">{insight.description}</p>

      {/* Saving estimate */}
      <div className="gi-card__saving">
        <span className="gi-card__saving-icon" aria-hidden="true">
          <IconSaving />
        </span>
        <span className="gi-card__saving-label">Est. saving:</span>
        <span className="gi-card__saving-value">{insight.saving}</span>
      </div>

    </div>
  );
}

export default function GreenInsights() {
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
        <span className="gi-section__badge">Demo Template</span>
      </div>

      <p className="gi-section__subtitle">
        Actionable recommendations to reduce your environmental impact.
        AI-powered insights coming soon.
      </p>

      {/* Insight cards */}
      <div className="gi-cards-grid">
        {greenInsights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>

    </section>
  );
}