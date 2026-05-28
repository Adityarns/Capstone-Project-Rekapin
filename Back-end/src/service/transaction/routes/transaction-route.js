import { Router } from "express";
import {
  addTransaction,
  createCategory,
  getTransactionsByBusinessId,
  editTransaction,
  deleteTransaction,
  getTransactionById,
  getCategoriesByType,
  scanTransactionReceipt,
} from "../controller/transaction-controller.js";
import validate from "../../../middlewares/validator.js";
import {
  transactionSchema,
  transactionUpdateSchema,
  categorySchema,
} from "../validator/transaction-validator.js";
import authenticateToken from "../../../middlewares/auth.js";
import multer from "multer";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// Categories
router.get("/transactions/categories", getCategoriesByType);
router.post(
  "/transactions/categories",
  validate(categorySchema),
  createCategory,
);

// Scan Receipt
router.post(
  "/transactions/scan",
  authenticateToken,
  upload.single("receipt"),
  scanTransactionReceipt,
);

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
