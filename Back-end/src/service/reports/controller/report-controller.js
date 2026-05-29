import FinancialReportService from "../service/report-service.js";
import FinancialReportRepositories from "../repositories/report-repositories.js";
import { forecastExpenseWithAI } from "../../Models/ai-service.js";
import response from "../../../utils/response.js";
import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";
import excelJS from "exceljs";

export const getFinancialSummary = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { quarter = "Q2", year = 2026 } = req.query;

    const data = await FinancialReportService.calculateSummary({
      businessId,
      quarter,
      year: parseInt(year),
    });
    return response(res, 200, "Financial summary berhasil diambil", data);
  } catch (error) {
    next(error);
  }
};

export const getIncomeStatement = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { quarter = "Q2", year = 2026 } = req.query;

    const data = await FinancialReportService.generateStatement({
      businessId,
      quarter,
      year: parseInt(year),
    });
    return response(
      res,
      200,
      "Income statement SAK EMKM berhasil diambil",
      data,
    );
  } catch (error) {
    next(error);
  }
};

export const getRevenueForecast = async (req, res, next) => {
  try {
    const { businessId } = req.params;

    if (!businessId) {
      return response(
        res,
        400,
        "Business ID wajib disertakan dalam URL parameter",
        null,
      );
    }

    // 1. Tarik riwayat pengeluaran agregat harian
    const rawHistory =
      await FinancialReportRepositories.getDailyExpensesLast30Days(businessId);

    // 2. Ekstrak data hasil kueri menjadi array angka float murni
    let dailyTotals = rawHistory.map((row) => parseFloat(row.total_amount));

    if (dailyTotals.length === 0) {
      dailyTotals = [0.0];
    }

    // 3. Panggil fungsi jembatan AI dari ai-service.js
    const aiResult = await forecastExpenseWithAI({ dailyTotals });

    // 4. Susun struktur data respons
    const formattedData = {
      businessId,
      historicalDaysAnalyzed: rawHistory.length,
      forecast: {
        predictedSpendNextHorizon: aiResult.predicted_spend_next_horizon,
        predictedDailyAvg: aiResult.predicted_daily_avg,
        horizonDays: aiResult.horizon_days,
        windowDays: aiResult.window_days,
        confidenceNote: aiResult.confidence_note,
      },
    };

    return response(
      res,
      200,
      "AI Expense Forecast berhasil dihitung menggunakan model Bidirectional LSTM",
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
