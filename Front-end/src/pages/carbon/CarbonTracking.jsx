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

import CarbonHeader    from "../../components/carbon/CarbonHeader";
import CarbonStatsCards from "../../components/carbon/CarbonStatsCards";
import GreenInsights   from "../../components/carbon/GreenInsights";
import "./CarbonTracking.css";

export default function CarbonTracking() {
  return (
    <div className="ct-page">
      <CarbonHeader />
      <CarbonStatsCards />
      <GreenInsights />
    </div>
  );
}