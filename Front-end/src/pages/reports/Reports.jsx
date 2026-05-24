/**
 * ============================================================
 *    REKAPIN — Financial Reports Page
 *    src/pages/reports/Reports.jsx
 *
 *    Renders inside DashboardLayout <Outlet />.
 *    Sidebar + Topbar stay untouched.
 *
 *    Layout (top → bottom):
 *    1. ReportsHeader   — title, quarter dropdown, export buttons
 *    2. ReportsSummaryCards — 3 metric cards
 *    3. Charts row      — CashFlowOverview (left) + RevenueForecast (right)
 *    4. IncomeStatement — SAK EMKM table
 * ============================================================
 */

import { useState } from "react";

import ReportsHeader       from "../../components/reports/ReportsHeader";
import ReportsSummaryCards from "../../components/reports/ReportsSummaryCards";
import CashFlowOverview    from "../../components/reports/CashFlowOverview";
import RevenueForecast     from "../../components/reports/RevenueForecast";
import IncomeStatement     from "../../components/reports/IncomeStatement";

import { QUARTER_OPTIONS } from "../../data/reportsData";
import "./Reports.css";

export default function Reports() {
  const [quarter, setQuarter] = useState(QUARTER_OPTIONS[0].value);

  /* Derive period labels for IncomeStatement columns */
  const currentLabel  = QUARTER_OPTIONS.find((q) => q.value === quarter)?.label ?? "Q3 2023";
  const prevIndex     = QUARTER_OPTIONS.findIndex((q) => q.value === quarter) + 1;
  const previousLabel = QUARTER_OPTIONS[prevIndex]?.label ?? "Q2 2023";

  return (
    <div className="rpt-page">

      {/* 1 — Header */}
      <ReportsHeader
        quarter={quarter}
        onQuarterChange={setQuarter}
      />

      {/* 2 — Summary cards */}
      <ReportsSummaryCards />

      {/* 3 — Charts row */}
      <div className="rpt-charts-row">
        <CashFlowOverview />
        <RevenueForecast />
      </div>

      {/* 4 — Income Statement */}
      <IncomeStatement
        currentPeriod={currentLabel}
        previousPeriod={previousLabel}
      />

    </div>
  );
}