/**
 * ============================================================
 *    REKAPIN — Dashboard Home Page
 *    src/pages/dashboard/Dashboard.jsx
 * ============================================================
 *
 * @format
 */

import { formatRupiahFull } from "../../data/dashboardData";

import SummaryCard from "../../components/dashboard/SummaryCard";
import CashFlowChart from "../../components/dashboard/CashFlowChart";
import AiInsightCard from "../../components/dashboard/AiInsightCard";
import SustainabilityCard from "../../components/dashboard/SustainabilityCard";
import RecentTransactions from "../../components/dashboard/RecentTransactions";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getCarbonSummary,
  getDashboardReportSummary,
} from "../../services/dashboardService";

function formatCarbonKg(valueInKg) {
  const kgValue = parseFloat(valueInKg);
  if (!Number.isFinite(kgValue)) return "0.00 kg CO2";
  return `${kgValue.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} kg CO2`;
}

import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const { businessId } = useParams(); // Membaca URL saat ini
  const { user, isLoading: authLoading } = useAuth(); // Ambil data user global

  // ── State untuk data dashboard ────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState({
    totalIncome: { value: 0, change: 0, positive: true },
    totalExpense: { value: 0, change: 0, positive: false },
    netCashFlow: { value: 0, change: 0, positive: true },
    carbonFootprint: { value: "0.00 kg CO2", change: 0, positive: true },
  });
  const [chartData, setChartData] = useState([]);

  // ── Cek validasi businessId dan fetch data ────────────────
  useEffect(() => {
    // Jangan lakukan navigasi apa pun jika sesi masih memuat (loading)
    if (authLoading || !user) return;

    // Jika URL saat ini bertuliskan 'undefined' DAN data bisnis asli sudah siap dari API
    if ((!businessId || businessId === "undefined") && user.business_id) {
      // Paksa rute URL untuk memperbarui dirinya ke ID bisnis yang sah!
      navigate(`/dashboard/${user.business_id}`, { replace: true });
    }
  }, [businessId, user, authLoading, navigate]);

  // ── Fetch data dashboard dari backend ──────────────────────
  useEffect(() => {
    if (!businessId || businessId === "undefined" || authLoading) return;

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [carbonData, reportData] = await Promise.all([
          getCarbonSummary(businessId),
          getDashboardReportSummary(businessId),
        ]);

        const reportSummary = reportData.summary || {};
        const reportCashFlow = Array.isArray(reportData.cash_flow)
          ? reportData.cash_flow
          : [];

        const incomeFromReport =
          reportSummary.total_revenue ??
          reportCashFlow.reduce(
            (sum, row) => sum + (parseFloat(row.inflow) || 0),
            0,
          );
        const expenseFromReport = reportCashFlow.reduce(
          (sum, row) => sum + (parseFloat(row.outflow) || 0),
          0,
        );
        const netFromReport =
          reportSummary.net_income ?? incomeFromReport - expenseFromReport;

        const carbonKgValue =
          reportSummary.carbon_footprint_kg ??
          (reportSummary.carbon_footprint_tons !== undefined
            ? reportSummary.carbon_footprint_tons * 1000
            : (carbonData.total_carbon_kg || 0) * 1000);
        const carbonChange =
          reportSummary.carbon_variance_percent ||
          carbonData.change_percent ||
          0;

        setSummaryData({
          totalIncome: {
            value: incomeFromReport,
            change: reportSummary.revenue_variance_percent || 0,
            positive: (reportSummary.revenue_variance_percent ?? 0) >= 0,
          },
          totalExpense: {
            value: expenseFromReport,
            change: 0,
            positive: false,
          },
          netCashFlow: {
            value: netFromReport,
            change: reportSummary.net_income_variance_percent || 0,
            positive: netFromReport >= 0,
          },
          carbonFootprint: {
            value: formatCarbonKg(carbonKgValue),
            change: carbonChange,
            positive: carbonChange <= 0,
          },
        });

        setChartData(
          reportCashFlow.map((item) => ({
            month: item.month,
            income: parseFloat(item.inflow) || 0,
            expense: parseFloat(item.outflow) || 0,
          })),
        );
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "Gagal memuat data dashboard");
        // Tetap tampilkan dashboard dengan data default
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [businessId, authLoading]);

  const { totalIncome, totalExpense, netCashFlow, carbonFootprint } =
    summaryData;

  return (
    <div className="dashboard">
      {/* ── Loading State ── */}
      {isLoading && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Memuat data dashboard...</p>
        </div>
      )}

      {/* ── Error State ── */}
      {error && (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#fee",
            borderLeft: "4px solid #f44",
            marginBottom: "20px",
            borderRadius: "4px",
          }}
        >
          <p style={{ color: "#c33", margin: 0 }}>⚠️ {error}</p>
        </div>
      )}

      {/* ── Main Dashboard Content ── */}
      {!isLoading && (
        <>
          {/* ── Row 1: 4 Summary Cards ── */}
          <section
            className="dashboard__summary"
            aria-label="Financial summary"
          >
            <SummaryCard
              label="TOTAL INCOME"
              value={formatRupiahFull(totalIncome.value)}
              change={totalIncome.change}
              positive={totalIncome.positive}
            />
            <SummaryCard
              label="TOTAL EXPENSE"
              value={formatRupiahFull(totalExpense.value)}
              change={totalExpense.change}
              positive={totalExpense.positive}
            />
            <SummaryCard
              label="NET CASH FLOW"
              value={formatRupiahFull(netCashFlow.value)}
              change={netCashFlow.change}
              positive={netCashFlow.positive}
              showTrend
            />
            <SummaryCard
              label="CARBON FOOTPRINT"
              value={carbonFootprint.value}
              change={carbonFootprint.change}
              positive={carbonFootprint.positive}
              isCarbon
            />
          </section>

          {/* ── Row 2: Chart + Right Column ── */}
          <div className="dashboard__main">
            <section aria-label="Cash flow trend">
              <CashFlowChart data={chartData} />
            </section>

            <aside className="dashboard__right-col" aria-label="Insights">
              <AiInsightCard />
              <SustainabilityCard />
            </aside>
          </div>

          {/* ── Row 3: Recent Transactions ── */}
          <section aria-label="Recent transactions">
            <RecentTransactions />
          </section>
        </>
      )}
    </div>
  );
}
