import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import ReportsHeader from "../../components/reports/ReportsHeader";
import ReportsSummaryCards from "../../components/reports/ReportsSummaryCards";
import CashFlowOverview from "../../components/reports/CashFlowOverview";
import RevenueForecast from "../../components/reports/RevenueForecast";
import IncomeStatement from "../../components/reports/IncomeStatement";

import { QUARTER_OPTIONS } from "../../data/reportsData";
import {
  getFinancialSummary,
  getIncomeStatement,
  getRevenueForecast,
  exportReportExcel,
  exportReportPDF,
} from "../../services/reportService";
import "./Reports.css";

const getCurrentQuarterValue = () => {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const quarter =
    month <= 3 ? "Q1" : month <= 6 ? "Q2" : month <= 9 ? "Q3" : "Q4";
  return `${quarter}-${year}`;
};

const parseQuarterValue = (value) => {
  const [quarterPart, yearPart] = value.split("-");
  return {
    quarter: quarterPart || "Q3",
    year: parseInt(yearPart, 10) || new Date().getFullYear(),
  };
};

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export default function Reports() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [quarter, setQuarter] = useState(getCurrentQuarterValue());
  const [summary, setSummary] = useState(null);
  const [cashFlow, setCashFlow] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [incomeStatementData, setIncomeStatementData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const currentLabel =
    QUARTER_OPTIONS.find((q) => q.value === quarter)?.label ?? "Q3 2023";
  const prevIndex = QUARTER_OPTIONS.findIndex((q) => q.value === quarter) + 1;
  const previousLabel = QUARTER_OPTIONS[prevIndex]?.label ?? "Q2 2023";

  useEffect(() => {
    const loadReportData = async () => {
      if (!businessId) return;

      const { quarter: quarterKey, year } = parseQuarterValue(quarter);
      setLoading(true);
      setError("");

      try {
        // Jaring pengaman khusus untuk AI (jika server Python mati, halaman tetap render)
        const forecastPromise = getRevenueForecast(businessId).catch((err) => {
          console.warn("AI Forecast offline/error:", err.message);
          return null;
        });

        const [summaryData, incomeData, forecastResponse] = await Promise.all([
          getFinancialSummary(businessId, quarterKey, year),
          getIncomeStatement(businessId, quarterKey, year),
          forecastPromise,
        ]);

        setSummary(summaryData.summary);
        setCashFlow(summaryData.cash_flow || []);
        setIncomeStatementData(incomeData);

        // Ekstrak data forecast dari respons
        setForecast(forecastResponse?.forecast || null);
      } catch (err) {
        setError(err.message || "Gagal memuat data laporan dari backend.");
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [businessId, quarter]);

  const handleExportExcel = async () => {
    if (!businessId) return;

    const { quarter: q, year } = parseQuarterValue(quarter);
    setExporting(true);
    setError("");

    try {
      const blob = await exportReportExcel(businessId, q, year);
      downloadBlob(blob, `Rekapin_Report_${q}_${year}.xlsx`);
    } catch (err) {
      const errorMessage = err.message || "Gagal mengunduh file Excel.";
      setError(errorMessage);

      // JIKA GALAT KARENA MODAL: Alihkan otomatis ke halaman pengaturan setelah 2 detik
      if (errorMessage.toLowerCase().includes("modal")) {
        setError(
          "Data modal bisnis 0 atau belum diisi. Mengalihkan ke halaman pengaturan...",
        );
      }
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!businessId) return;

    const { quarter: q, year } = parseQuarterValue(quarter);
    setExporting(true);
    setError("");

    try {
      const blob = await exportReportPDF(businessId, q, year);
      downloadBlob(blob, `Rekapin_Report_${q}_${year}.pdf`);
    } catch (err) {
      const errorMessage = err.message || "Gagal mengunduh file PDF.";
      setError(errorMessage);

      // JIKA GALAT KARENA MODAL: Alihkan otomatis ke halaman pengaturan setelah 2 detik
      if (errorMessage.toLowerCase().includes("modal")) {
        setError(
          "Data modal bisnis 0 atau belum diisi. Mengalihkan ke halaman pengaturan...",
        );
      }
    } finally {
      setExporting(false);
    }
  };

  const hasTransactions = Boolean(
    (incomeStatementData && incomeStatementData.statement) ||
    (summary &&
      (summary.total_revenue > 0 || (cashFlow && cashFlow.length > 0))),
  );

  return (
    <div className="rpt-page">
      {/* 1 — Header */}
      <ReportsHeader
        quarter={quarter}
        onQuarterChange={setQuarter}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        isExporting={exporting}
      />

      {error && (
        <div
          className="rpt-error"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "between",
            gap: "16px",
          }}
        >
          <span>{error}</span>

          {/* Jika pesan galat mendeteksi kata 'modal', munculkan tombol pintas */}
          {error.toLowerCase().includes("modal") && (
            <button
              type="button"
              className="rpt-error-action-btn"
              onClick={() => navigate(`/profile/${businessId}`)}
              style={{
                background: "#60070d",
                color: "#ffffff",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Isi Modal Sekarang
            </button>
          )}
        </div>
      )}
      {loading && <div className="rpt-loading">Loading report data…</div>}

      {/* 2 — Summary cards */}
      <ReportsSummaryCards summary={summary} />

      {/* 3 — Charts row */}
      <div className="rpt-charts-row">
        <CashFlowOverview data={cashFlow} />
        <RevenueForecast forecast={forecast} historical={cashFlow} />
      </div>

      {/* 4 — Income Statement */}
      {hasTransactions ? (
        <IncomeStatement
          data={incomeStatementData}
          currentPeriod={currentLabel}
          previousPeriod={previousLabel}
        />
      ) : null}
    </div>
  );
}
