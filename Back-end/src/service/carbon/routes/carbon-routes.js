import { Router } from "express";
import {
  getCarbonSummary,
  getCarbonLogs,
} from "../controller/carbon-controller.js";
import authenticateToken from "../../../middlewares/auth.js";

const router = Router();

// Summary — untuk tampilan utama halaman Carbon Tracking
router.get("/carbon/:businessId/summary", authenticateToken, getCarbonSummary);

// Logs — history log karbon dari transaksi
router.get("/carbon/:businessId/logs", authenticateToken, getCarbonLogs);

export default router;
