import { Router } from "express";
import {
  getFinancialSummary,
  getRevenueForecast,
  getIncomeStatement,
} from "../controller/report-controller.js";
import authenticateToken from "../../../middlewares/auth.js"; // Sesuaikan middleware pelindung token Anda

const router = Router();

router.get(
  "/reports/:businessId/financial-summary",
  authenticateToken,
  getFinancialSummary,
);
router.get(
  "/reports/:businessId/revenue-forecast",
  authenticateToken,
  getRevenueForecast,
);
router.get(
  "/reports/:businessId/income-statement",
  authenticateToken,
  getIncomeStatement,
);

export default router;
