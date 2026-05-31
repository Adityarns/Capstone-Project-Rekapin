/**
 * ============================================================
 *    REKAPIN — Sustainability Score Card
 *    src/components/dashboard/SustainabilityCard.jsx
 * ============================================================
 *
 * @format
 */

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getCarbonSummary } from "../../services/dashboardService";
import "./SustainabilityCard.css";

export default function SustainabilityCard() {
  const { businessId } = useParams();
  const [score, setScore] = useState(84);
  const [label, setLabel] = useState("Excellent");
  const [description, setDescription] = useState(
    "You are performing 12% better than similar MSMEs in your region.",
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!businessId || businessId === "undefined") return;

    const fetchCarbonData = async () => {
      try {
        setIsLoading(true);
        const carbonData = await getCarbonSummary(businessId);

        // Hitung sustainability score berdasarkan carbon goal progress
        let calculatedScore = 50;
        let calculatedLabel = "Fair";

        if (carbonData.goal && carbonData.goal.progress_percent !== null) {
          // Jika on-track, score lebih tinggi
          const progressPercent = carbonData.goal.progress_percent;

          if (progressPercent <= 75) {
            calculatedScore = 95;
            calculatedLabel = "Excellent";
          } else if (progressPercent <= 100) {
            calculatedScore = 80;
            calculatedLabel = "Good";
          } else {
            calculatedScore = 60;
            calculatedLabel = "Fair";
          }
        }

        setScore(calculatedScore);
        setLabel(calculatedLabel);

        // Update description berdasarkan carbon change
        if (carbonData.change_percent !== null) {
          if (carbonData.change_percent < 0) {
            setDescription(
              `You reduced carbon emissions by ${Math.abs(carbonData.change_percent)}% compared to last month. Keep it up!`,
            );
          } else if (carbonData.change_percent > 0) {
            setDescription(
              `Carbon emissions increased by ${carbonData.change_percent}% from last month. Try to reduce consumption.`,
            );
          } else {
            setDescription(
              "Your carbon emissions remain stable compared to last month.",
            );
          }
        }
      } catch (err) {
        console.error("Error fetching sustainability data:", err);
        // Keep default values on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarbonData();
  }, [businessId]);

  const maxScore = 100;
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

      <p className="sustain-card__desc">
        {isLoading ? "Loading..." : description}
      </p>
    </div>
  );
}
