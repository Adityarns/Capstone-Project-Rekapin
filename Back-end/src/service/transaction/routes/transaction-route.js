import { Router } from "express";
import {
  addTransaction,
  getTransactionsByBusinessId,
  editTransaction,
  deleteTransaction,
} from "../controller/transaction-controller.js";
import authenticateToken from "../../../middlewares/auth.js";

const router = Router();
router.post("/transactions", authenticateToken, addTransaction);
router.get(
  "/transactions/business/:business_id",
  authenticateToken,
  getTransactionsByBusinessId,
);
router.put("/transactions/:transactionId", authenticateToken, editTransaction);
router.delete(
  "/transactions/:transactionId",
  authenticateToken,
  deleteTransaction,
);

export default router;
