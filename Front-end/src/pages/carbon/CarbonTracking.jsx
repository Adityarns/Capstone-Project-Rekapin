/**
 * ============================================================
 *    REKAPIN — Carbon Tracking Page
 *    src/pages/carbon/CarbonTracking.jsx
 *
 *    Renders inside DashboardLayout <Outlet />.
 *    Sidebar + Topbar stay untouched.
 *
 *    Layout (top → bottom):
 *    1. CarbonHeader   — title, subtitle, Verified badge
 *    2. CarbonStatsCards — 3 metric cards
 *    3. GreenInsights  — 3 static insight cards
 * ============================================================
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { carbonService } from "../../services/carbonService";
import CarbonHeader from "../../components/carbon/CarbonHeader";
import CarbonStatsCards from "../../components/carbon/CarbonStatsCards";
import GreenInsights from "../../components/carbon/GreenInsights";
import "./CarbonTracking.css";

export default function CarbonTracking() {
  const { businessId } = useParams();
  const [carbonSummary, setCarbonSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await carbonService.getCarbonSummary(businessId);
        setCarbonSummary(response.data);
      } catch (err) {
        setError(err.message || "Failed to load carbon data");
      } finally {
        setLoading(false);
      }
    };
    if (businessId) {
      fetchData();
    }
  }, [businessId]);

  if (loading) {
    return (
      <div
        className="ct-page"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <p style={{ color: "var(--color-text-muted)" }}>
          Loading carbon data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="ct-page"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  // Transform API data for UI components
  const formatTotalFootprint = () => {
    return {
      value: carbonSummary?.total_carbon_kg || 0,
      unit: "kgCO2e",
      change: carbonSummary?.change_percent || 0,
      positive: (carbonSummary?.change_percent || 0) <= 0,
      period: "vs last month",
    };
  };

  const formatSustainabilityScore = () => {
    if (!carbonSummary?.goal || carbonSummary.goal.progress_percent === null) {
      return {
        score: 0,
        maxScore: 100,
        target: 90,
        label: "No Data",
        description: "Need at least one full month of data to set a baseline.",
      };
    }

    const progressPercent = carbonSummary.goal.progress_percent;
    const isExcellent = progressPercent <= 75;
    const isGood = progressPercent <= 100;
    const calculatedScore = isExcellent ? 95 : isGood ? 80 : 60;
    const calculatedLabel = isExcellent
      ? "Excellent"
      : isGood
        ? "Good"
        : "Fair";

    let description =
      "Your carbon emissions remain stable compared to last month.";
    const changePercent = carbonSummary.change_percent;

    if (changePercent !== null && changePercent !== undefined) {
      if (changePercent < 0) {
        description = `You reduced carbon emissions by ${Math.abs(changePercent)}% compared to last month. Keep it up!`;
      } else if (changePercent > 0) {
        description = `Carbon emissions increased by ${changePercent}% from last month. Try to reduce consumption.`;
      }
    }

    return {
      score: calculatedScore,
      maxScore: 100,
      target: 90,
      label: calculatedLabel,
      description,
    };
  };

  const formatCarbonBreakdown = () => {
    const colors = [
      "var(--color-primary-600)",
      "var(--color-accent-500)",
      "#FF9800",
      "#4CAF50",
    ];
    return (carbonSummary?.breakdown || []).map((item, index) => ({
      id: item.category.toLowerCase(),
      label: item.category,
      value: item.total_carbon,
      percentage: parseFloat(item.percentage) || 0,
      unit: "kgCO2e",
      color: colors[index % colors.length],
    }));
  };

  const formattedSummary = {
    totalFootprint: formatTotalFootprint(),
    sustainabilityScore: formatSustainabilityScore(),
    carbonBreakdown: formatCarbonBreakdown(),
  };

  return (
    <div className="ct-page">
      <CarbonHeader />
      <CarbonStatsCards summary={formattedSummary} />
      <GreenInsights insights={carbonSummary?.insights || []} />
    </div>
  );
}
