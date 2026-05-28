import FinancialReportService from "../service/report-service.js";
import { forecastExpenseWithAI } from "../../Models/ai-service.js";
import response from "../../../utils/response.js";

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
    // Panggil logika AI Anda di sini seperti biasa
    return response(res, 200, "Revenue forecast berhasil diambil", {});
  } catch (error) {
    next(error);
  }
};
