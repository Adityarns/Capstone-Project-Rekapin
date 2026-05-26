import CarbonRepositories from "../repositories/carbon-repositories.js";
import { calculateCarbonWithAI } from "../../../service/Models//ai-service.js";
import response from "../../../utils/response.js";
import { InvariantError, NotFoundError } from "../../../exceptions/index.js";

// ============================================================
//  GET CARBON SUMMARY
//  Untuk tampilan utama halaman Carbon Tracking:
//  - Total carbon footprint
//  - Progress terhadap goal
//  - Persentase perubahan dari bulan lalu
// ============================================================
export const getCarbonSummary = async (req, res, next) => {
  const { businessId } = req.params;

  const summary = await CarbonRepositories.getCarbonSummary(businessId);
  if (!summary) {
    return next(new NotFoundError("Ringkasan karbon tidak ditemukan"));
  } 
  return response(res, 200, "Carbon summary berhasil diambil", summary);
};

// ============================================================
//  GET CARBON LOGS
//  History log karbon dari semua transaksi
// ============================================================
export const getCarbonLogs = async (req, res, next) => {
  const { businessId } = req.params;

  const logs = await CarbonRepositories.getCarbonLogsByBusinessId(businessId);
  if (!logs) {
    return next(new NotFoundError("Log karbon tidak ditemukan"));
  }
  return response(res, 200, "Carbon logs berhasil diambil", { logs });
};

// ============================================================
//  SET CARBON GOAL
//  Owner set target karbon untuk periode tertentu
//  Contoh: target 2.0 tons CO2e untuk Q3 2026
// ============================================================
export const setCarbonGoal = async (req, res, next) => {
  const { businessId, targetTco2e, periodStart, periodEnd } = req.validated;

  if (new Date(periodEnd) <= new Date(periodStart)) {
    return next(
      new InvariantError("Tanggal akhir harus setelah tanggal mulai"),
    );
  }

  const goal = await CarbonRepositories.createCarbonGoal({
    businessId,
    targetTco2e,
    periodStart,
    periodEnd,
  });

  return response(res, 201, "Target karbon berhasil disimpan", goal);
};

// ============================================================
//  GET ACTIVE CARBON GOAL
//  Ambil target karbon yang sedang aktif
// ============================================================
export const getActiveCarbonGoal = async (req, res, next) => {
  const { businessId } = req.params;

  const goal = await CarbonRepositories.getActiveCarbonGoal(businessId);
  if (!goal) {
    return next(new NotFoundError("Belum ada target karbon yang aktif"));
  }

  return response(res, 200, "Target karbon ditemukan", goal);
};

// ============================================================
//  CALCULATE CARBON (Internal — dipanggil dari addTransaction)
//  Tidak diekspos sebagai endpoint — hanya dipakai di controller
//  transaksi setelah transaksi berhasil disimpan
// ============================================================
export const calculateAndLogCarbon = async ({
  businessId,
  userId,
  transactionId,
  description,
  quantity,
  categoryName,
  transactionDate,
}) => {
  try {
    // Kirim ke Python API
    const carbonResult = await calculateCarbonWithAI({
      description,
      quantity,
    });

    // Simpan hasil ke carbon_logs
    const carbonLog = await CarbonRepositories.createCarbonLog({
      businessId,
      userId,
      transactionId,
      logDate: transactionDate,
      categoryType: categoryName,
      quantity,
      carbonTotal: carbonResult.estimated_emission_ton_co2 ?? 0,
    });

    return carbonLog;
  } catch (error) {
    // Jangan gagalkan transaksi hanya karena carbon log gagal
    // Cukup log errornya saja
    console.error("Carbon calculation failed:", error.message);
    return null;
  }
};
