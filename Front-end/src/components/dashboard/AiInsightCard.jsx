/**
 * ============================================================
 *    REKAPIN — AI Insight Card
 *    src/components/dashboard/AiInsightCard.jsx
 * ============================================================
 *
 * @format
 */

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getCarbonSummary } from "../../services/dashboardService";
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
  const { businessId } = useParams();
  const [title, setTitle] = useState("AI INSIGHT");
  const [message, setMessage] = useState(
    "Expense Warning: Your utility costs are 15% higher than last month. Consider reviewing energy usage for potential savings.",
  );
  const [action, setAction] = useState("View Analysis");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!businessId || businessId === "undefined") return;

    const fetchInsights = async () => {
      try {
        setIsLoading(true);
        const carbonData = await getCarbonSummary(businessId);

        // Gunakan insights dari backend jika tersedia
        if (carbonData.insights && carbonData.insights.length > 0) {
          const firstInsight = carbonData.insights[0];
          setTitle("AI INSIGHT");
          setMessage(firstInsight.description || message);
          setAction("View Analysis");
        } else if (carbonData.change_percent !== null) {
          // Fallback: buat insight dari carbon change
          if (carbonData.change_percent > 0) {
            setMessage(
              `⚠️ Carbon emissions increased by ${carbonData.change_percent}% this month. Review your spending on high-carbon activities.`,
            );
          } else if (carbonData.change_percent < 0) {
            setMessage(
              `✅ Great job! Carbon emissions decreased by ${Math.abs(carbonData.change_percent)}% compared to last month.`,
            );
          }
        }
      } catch (err) {
        console.error("Error fetching AI insights:", err);
        // Keep default message on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [businessId]);

  return (
    <div className="ai-card" role="region" aria-label="AI Insight">
      <div className="ai-card__deco" aria-hidden="true" />

      <div className="ai-card__header">
        <span className="ai-card__icon" aria-hidden="true">
          <IconSparkle />
        </span>
        <span className="ai-card__label">{title}</span>
      </div>

      <p className="ai-card__message">
        {isLoading ? "Loading insights..." : message}
      </p>

      <button type="button" className="ai-card__cta">
        {action} <IconArrow />
      </button>
    </div>
  );
}
