import { Router } from "express";
import {
  getCarbonSummary,
  getCarbonLogs,
  setCarbonGoal,
  getActiveCarbonGoal,
} from "../controller/carbon-controller.js";
import authenticateToken from "../../../middlewares/auth.js";
import validate from "../../../middlewares/validator.js";
import { carbonGoalSchema } from "../validator/carbon-validator.js";

const router = Router();

// Summary — untuk tampilan utama halaman Carbon Tracking
router.get("/carbon/:businessId/summary", authenticateToken, getCarbonSummary);

// Logs — history log karbon dari transaksi
router.get("/carbon/:businessId/logs", authenticateToken, getCarbonLogs);

// Goal — target karbon
router.get("/carbon/:businessId/goal", authenticateToken, getActiveCarbonGoal);

router.post(
  "/carbon/goal",
  authenticateToken,
  validate(carbonGoalSchema),
  setCarbonGoal,
);

export default router;
