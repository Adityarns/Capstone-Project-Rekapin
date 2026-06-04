import FinancialReportService from "../service/report-service.js";
import FinancialReportRepositories from "../repositories/report-repositories.js";
import { forecastRevenueWithAI } from "../../models/ai-service.js";
import { InvariantError } from "../../../exceptions/index.js";
import response from "../../../utils/response.js";
import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";
import excelJS from "exceljs";
import CacheService from "../../cache/redis-cache.js";
import businessesRepositories from "../../businesses/repositories/businesses-repositories.js";

const cacheService = new CacheService();

export const getFinancialSummary = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { quarter = "Q2", year = 2026 } = req.query;
    const cacheKey = `financialSummary_${businessId}_${quarter}_${year}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      res.setHeader("X-Data-Source", "cache");
      const parsedData =
        typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;
      return response(
        res,
        200,
        "Financial summary berhasil diambil (cache)",
        parsedData,
      );
    }

    const data = await FinancialReportService.calculateSummary({
      businessId,
      quarter,
      year: parseInt(year),
    });
    await cacheService.set(
      `financialSummary_${businessId}_${quarter}_${year}`,
      JSON.stringify(data),
    );
    res.setHeader("X-Data-Source", "database");
    return response(res, 200, "Financial summary berhasil diambil", data);
  } catch (error) {
    next(error);
  }
};

export const getIncomeStatement = async (req, res, next) => {
  const { businessId } = req.params;
  const { quarter = "Q2", year = 2026 } = req.query;
  const cacheKey = `incomeStatement_${businessId}_${quarter}_${year}`;
  const cachedData = await cacheService.get(cacheKey);
  if (cachedData) {
    res.setHeader("X-Data-Source", "cache");
    const parsedData =
      typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;
    return response(
      res,
      200,
      "Income statement SAK EMKM berhasil diambil (cache)",
      parsedData,
    );
  }
  const data = await FinancialReportService.generateStatement({
    businessId,
    quarter,
    year: parseInt(year),
  });
  if (!data) {
    return next(new InvariantError("Gagal menghasilkan income statement"));
  }
  await cacheService.set(
    `incomeStatement_${businessId}_${quarter}_${year}`,
    JSON.stringify(data),
  );
  res.setHeader("X-Data-Source", "database");
  return response(res, 200, "Income statement SAK EMKM berhasil diambil", data);
};

export const getRevenueForecast = async (req, res, next) => {
  try {
    const { businessId } = req.params;

    if (!businessId) {
      return next(new InvariantError("Business ID harus disediakan"));
    }
    const cacheKey = `revenueForecast_${businessId}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      res.setHeader("X-Data-Source", "cache");
      const parsedData =
        typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;
      return response(
        res,
        200,
        "Revenue forecast berhasil diambil (cache)",
        parsedData,
      );
    }
    const rawHistory =
      await FinancialReportRepositories.getDailyIncomeLast30Days(businessId);

    const dailyRevenue = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);

      // Ambil format YYYY-MM-DD dari tanggal target
      // Penyesuaian ke zona waktu lokal (WIB) agar tidak meleset
      const dateStr = targetDate.toLocaleDateString("en-CA", {
        timeZone: "Asia/Jakarta",
      });

      // Cari apakah di database ada pendapatan pada tanggal ini
      const record = rawHistory.find((r) => {
        const rDate = new Date(r.transaction_date).toLocaleDateString("en-CA", {
          timeZone: "Asia/Jakarta",
        });
        return rDate === dateStr;
      });

      // Jika ada, masukkan nominalnya. Jika tidak ada, paksa menjadi 0.
      dailyRevenue.push(record ? parseFloat(record.total_amount) : 0.0);
    }

    // 3. Panggil fungsi jembatan AI dari ai-service.js
    const aiResult = await forecastRevenueWithAI({ dailyRevenue });

    // 4. Susun struktur data respons
    const formattedData = {
      businessId,
      // Ubah log ini untuk membuktikan bahwa kita sudah mengirimkan tepat 30 data harian
      historicalDaysAnalyzed: dailyRevenue.length,
      forecast: {
        predictedRevenueNextHorizon: aiResult.predicted_revenue_next_horizon,
        predictedDailyAvg: aiResult.predicted_daily_avg,
        windowDays: aiResult.window_days,
        confidenceNote: aiResult.confidence_note,
      },
    };
    await cacheService.set(
      `revenueForecast_${businessId}`,
      JSON.stringify(formattedData),
    );
    res.setHeader("X-Data-Source", "database");
    return response(
      res,
      200,
      "AI Revenue Forecast berhasil dihitung menggunakan model Bidirectional LSTM",
      formattedData,
    );
  } catch (error) {
    if (
      error.message &&
      (error.message.includes("fetch") ||
        error.message.includes("ECONNREFUSED"))
    ) {
      return response(
        res,
        502,
        "AI Engine server sedang offline, pastikan backend Python Anda sudah berjalan",
        null,
      );
    }
    next(error);
  }
};

export const exportReportExcel = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    // Nilai fallback Q2 dan 2026
    const { quarter = "Q2", year = 2026 } = req.query;
    const isModalExist =
      await businessesRepositories.checkBusinessModal(businessId);
    if (
      isModalExist === null ||
      isModalExist === undefined ||
      Number(isModalExist) === 0
    ) {
      return next(new InvariantError("Data modal bisnis tidak ditemukan"));
    }

    // 1. Delegasikan tugas perakitan dokumen ke Service
    const { buffer, fileName } =
      await FinancialReportService.generateExcelReport({
        businessId,
        quarter,
        year: parseInt(year),
      });

    // 2. Set instruksi header agar peramban langsung mengunduh file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    // 3. Kirim data biner Excel secara lugas
    return res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
};

export const exportReportPDF = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { quarter = "Q2", year = 2026 } = req.query;
    const isModalExist =
      await businessesRepositories.checkBusinessModal(businessId);
    if (
      isModalExist === null ||
      isModalExist === undefined ||
      Number(isModalExist) === 0
    ) {
      return next(new InvariantError("Data modal bisnis tidak ditemukan"));
    }
    // 1. Panggil metode pencetakan PDF dari Service
    const { buffer, fileName } = await FinancialReportService.generatePDFReport(
      {
        businessId,
        quarter,
        year: parseInt(year),
      },
    );

    // 2. Atur Header HTTP untuk dokumen PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    // 3. Kirim data biner PDF
    return res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
};
