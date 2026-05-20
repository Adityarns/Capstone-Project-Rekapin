/**
 * ============================================================
 *    REKAPIN — AI Assistant Panel
 *    src/components/transactions/AiAssistantPanel.jsx
 * ============================================================
 *
 * @format
 */

import { aiFeatures, aiCarbonNote } from "../../data/transactionData";
import "./AiAssistantPanel.css";

/* ── Icons ── */
const IconSparkle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.2L12 16.4l-6.2 4.5 2.4-7.2L2 9.2h7.6L12 2z" />
  </svg>
);

const IconCircleCheck = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const IconLeafSmall = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

export default function AiAssistantPanel() {
  return (
    <aside className="ai-panel">
      {/* ── Header ── */}
      <div className="ai-panel__header">
        <div className="ai-panel__icon-wrap" aria-hidden="true">
          <IconSparkle />
        </div>
        <div className="ai-panel__title-group">
          <h3 className="ai-panel__title">AI Assistant</h3>
          <span className="ai-panel__badge">ACTIVE</span>
        </div>
      </div>

      {/* ── Description ── */}
      <p className="ai-panel__desc">
        Upload a receipt and our AI will automatically extract the amount, date,
        and suggest a category for you.
      </p>

      {/* ── Feature list ── */}
      <ul className="ai-panel__features" role="list">
        {aiFeatures.map((feature) => (
          <li key={feature} className="ai-panel__feature">
            <span className="ai-panel__feature-icon" aria-hidden="true">
              <IconCircleCheck />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      {/* ── Carbon note card ── */}
      <div className="ai-panel__note">
        <span className="ai-panel__note-icon" aria-hidden="true">
          <IconLeafSmall />
        </span>
        <p className="ai-panel__note-text">{aiCarbonNote}</p>
      </div>
    </aside>
  );
}
