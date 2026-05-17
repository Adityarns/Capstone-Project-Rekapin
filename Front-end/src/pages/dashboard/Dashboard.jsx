/**
 * ============================================================
 *    REKAPIN — Dashboard Home Page
 *    src/pages/dashboard/Dashboard.jsx
 * ============================================================
 *
 * @format
 */

import {
  summaryData,
  cashFlowData,
  formatRupiahShort,
} from "../../data/dashboardData";

import SummaryCard from "../../components/dashboard/SummaryCard";
import CashFlowChart from "../../components/dashboard/CashFlowChart";
import AiInsightCard from "../../components/dashboard/AiInsightCard";
import SustainabilityCard from "../../components/dashboard/SustainabilityCard";
import QuickTipCard from "../../components/dashboard/QuickTipCard";
import RecentTransactions from "../../components/dashboard/RecentTransactions";

import "./Dashboard.css";

export default function Dashboard() {
  const { totalIncome, totalExpense, netCashFlow, carbonFootprint } =
    summaryData;

  return (
    <div className="dashboard">
      {/* ── Row 1: 4 Summary Cards ── */}
      <section className="dashboard__summary" aria-label="Financial summary">
        <SummaryCard
          label="TOTAL INCOME"
          value={formatRupiahShort(totalIncome.value)}
          change={totalIncome.change}
          positive={totalIncome.positive}
        />
        <SummaryCard
          label="TOTAL EXPENSE"
          value={formatRupiahShort(totalExpense.value)}
          change={totalExpense.change}
          positive={totalExpense.positive}
        />
        <SummaryCard
          label="NET CASH FLOW"
          value={formatRupiahShort(netCashFlow.value)}
          change={netCashFlow.change}
          positive={netCashFlow.positive}
          showTrend
        />
        <SummaryCard
          label="CARBON FOOTPRINT"
          value={`${carbonFootprint.value} ${carbonFootprint.unit}`}
          change={carbonFootprint.change}
          positive={carbonFootprint.positive}
          isCarbon
        />
      </section>

      {/* ── Row 2: Chart + Right Column ── */}
      <div className="dashboard__main">
        <section aria-label="Cash flow trend">
          <CashFlowChart data={cashFlowData} />
        </section>

        <aside className="dashboard__right-col" aria-label="Insights">
          <AiInsightCard />
          <SustainabilityCard />
          <QuickTipCard />
        </aside>
      </div>

      {/* ── Row 3: Recent Transactions ── */}
      <section aria-label="Recent transactions">
        <RecentTransactions />
      </section>
    </div>
  );
}
