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
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const { businessId } = useParams(); // Membaca URL saat ini
  const { user, isLoading } = useAuth(); // Ambil data user global

  useEffect(() => {
    // ── KONDISI PENJAGA UTAMA ────────────────────────────────
    // Jangan lakukan navigasi apa pun jika sesi masih memuat (loading)
    if (isLoading || !user) return;

    // Jika URL saat ini bertuliskan 'undefined' DAN data bisnis asli sudah siap dari API
    if ((!businessId || businessId === "undefined") && user.business_id) {
      // Paksa rute URL untuk memperbarui dirinya ke ID bisnis yang sah!
      navigate(`/dashboard/${user.business_id}`, { replace: true });
    }
  }, [businessId, user, isLoading, navigate]);
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
