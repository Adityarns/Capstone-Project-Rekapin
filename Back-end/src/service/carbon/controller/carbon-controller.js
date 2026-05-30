import CarbonRepositories from "../repositories/carbon-repositories.js";
import { calculateCarbonWithAI } from "../../models/ai-service.js";
import response from "../../../utils/response.js";
import { NotFoundError } from "../../../exceptions/index.js";
import { GREEN_INSIGHTS_BANK } from "../../carbon/insights/insights.js";

// ============================================================
//  GET CARBON SUMMARY
//  Untuk tampilan utama halaman Carbon Tracking
// ============================================================
export const getCarbonSummary = async (req, res, next) => {
  const { businessId } = req.params;

  const summary = await CarbonRepositories.getCarbonSummary(businessId);
  const insights = [];

  // Ambil kategori penyumbang emisi tertinggi bulan ini dari data breakdown Anda
  if (summary.breakdown && summary.breakdown.length > 0) {
    const topCategory = summary.breakdown[0].category; // e.g., "Electricity" atau "Transportation"

    // Cek apakah performa bulan ini lebih buruk atau lebih baik dari bulan lalu
    // Jika change_percent positif (> 0) artinya emisi naik (worse)
    // Jika change_percent negatif (<= 0) artinya emisi turun/stabil (better)
    const status = summary.change_percent > 0 ? "worse" : "better";

    // Ambil teks yang sesuai dari bank data berdasarkan kategori tertinggi dan statusnya
    if (GREEN_INSIGHTS_BANK[topCategory]) {
      insights.push({
        icon: topCategory === "Electricity" ? "lightning" : "Transportation",
        title: GREEN_INSIGHTS_BANK[topCategory][status].title,
        description: GREEN_INSIGHTS_BANK[topCategory][status].description,
      });
    }
  }

  // Selalu sisipkan 1 tips umum (General) sebagai variasi pelengkap di UI
  insights.push({
    icon: "recycle",
    title: GREEN_INSIGHTS_BANK.General.title,
    description: GREEN_INSIGHTS_BANK.General.description,
  });

  // ============================================================
  // GABUNGKAN KE OUTPUT DATA SUMMARY
  // ============================================================
  return response(res, 200, "Carbon summary berhasil diambil", {
    ...summary,
    insights, // <--- Frontend tinggal nge-loop array insights ini untuk komponen Green Insights
  });
};

// ============================================================
//  GET CARBON LOGS
//  History log karbon dari semua transaksi
// ============================================================
export const getCarbonLogs = async (req, res, next) => {
  const { businessId } = req.params;

  const logs = await CarbonRepositories.getCarbonLogsByBusinessId(businessId);

  return response(res, 200, "Carbon logs berhasil diambil", { logs });
};
