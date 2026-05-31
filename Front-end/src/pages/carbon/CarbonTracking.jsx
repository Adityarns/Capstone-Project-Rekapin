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
      <div className="ct-page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Loading carbon data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ct-page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
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
    if (!carbonSummary?.goal) {
      return {
        score: 0,
        maxScore: 100,
        target: 0,
        label: "No Data",
        change: 0,
        description: "Need at least one full month of data to set a baseline."
      };
    }
    
    // Invert progress so that emitting less (e.g. 80%) gives a better score (e.g. 100 - 80 = 20)
    // Or just show progress as how much of the allowance is left. 
    // Wait, the original UI showed "Score 84, Target 90". So higher is better.
    // If progress_percent is how much emission we made compared to baseline, 
    // say progress_percent = 60%, score = 100 - 60 = 40? 
    // Actually, let's just make score = 100 - progress_percent, and target = 20 (meaning target is 80% emission)
    const emissionPct = carbonSummary.goal.progress_percent || 0;
    const score = Math.max(0, 100 - emissionPct);
    
    return {
      score: score,
      maxScore: 100,
      target: 20, // Example target (e.g., target is to reduce emissions by 20%)
      label: carbonSummary.goal.is_on_track ? "On Track" : "Needs Work",
      change: 0,
      description: carbonSummary.goal.is_on_track 
        ? "You are emitting less than your baseline target." 
        : "You have exceeded your baseline target."
    };
  };

  const formatCarbonBreakdown = () => {
    const colors = ["var(--color-primary-600)", "var(--color-accent-500)", "#FF9800", "#4CAF50"];
    return (carbonSummary?.breakdown || []).map((item, index) => ({
      id: item.category.toLowerCase(),
      label: item.category,
      value: item.total_carbon,
      percentage: parseFloat(item.percentage) || 0,
      unit: "kgCO2e",
      color: colors[index % colors.length]
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