/**
 * ============================================================
 *    REKAPIN — Sustainability Score Card
 *    src/components/dashboard/SustainabilityCard.jsx
 * ============================================================
 *
 * @format
 */

import { sustainabilityData } from "../../data/dashboardData";
import "./SustainabilityCard.css";

export default function SustainabilityCard() {
  const { score, maxScore, label, description } = sustainabilityData;
  const percentage = (score / maxScore) * 100;

  return (
    <div className="sustain-card">
      <p className="sustain-card__label">SUSTAINABILITY SCORE</p>

      <div className="sustain-card__score-row">
        <span className="sustain-card__score">{score}</span>
        <span
          className={`sustain-card__badge sustain-card__badge--${label.toLowerCase()}`}
        >
          {label}
        </span>
      </div>

      <div
        className="sustain-card__bar"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={maxScore}
        aria-label={`Sustainability score: ${score} out of ${maxScore}`}
      >
        <div
          className="sustain-card__bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="sustain-card__desc">{description}</p>
    </div>
  );
}
