import { Router } from "express";
import {
  addTransaction,
  createCategory,
  getTransactionsByBusinessId,
  editTransaction,
  deleteTransaction,
  getTransactionById,
  getCategoriesByType,
} from "../controller/transaction-controller.js";
import validate from "../../../middlewares/validator.js";
import {
  transactionSchema,
  transactionUpdateSchema,
  categorySchema,
} from "../validator/transaction-validator.js";
import authenticateToken from "../../../middlewares/auth.js";

const router = Router();

// Categories
router.get("/transactions/categories", authenticateToken, getCategoriesByType);
router.post("/transactions/categories", authenticateToken, createCategory);

// Scan Receipt
// router.post(
//   "/transactions/scan-receipt",
//   authenticateToken,
//   upload.single("receipt"),
//   scanReceipt,
// );

// Transactions
router.post(
  "/transactions",
  authenticateToken,
  validate(transactionSchema),
  addTransaction,
);

router.get(
  "/transactions/business/:businessId",
  authenticateToken,
  getTransactionsByBusinessId,
);

router.get(
  "/transactions/:transactionId",
  authenticateToken,
  getTransactionById,
);

router.put(
  "/transactions/:transactionId",
  authenticateToken,
  validate(transactionUpdateSchema),
  editTransaction,
);

router.delete(
  "/transactions/:transactionId",
  authenticateToken,
  deleteTransaction,
);

export default router;
