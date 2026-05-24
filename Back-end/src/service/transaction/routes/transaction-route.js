import { Router } from "express";
import {
  addTransaction,
  createCategory,
  getTransactionsByBusinessId,
  editTransaction,
  deleteTransaction,
} from "../controller/transaction-controller.js";
import validate from "../../../middlewares/validator.js";
import { categorySchema } from "../validator/transaction-validator.js";
import authenticateToken from "../../../middlewares/auth.js";

const router = Router();
router.post("/transactions", authenticateToken, addTransaction);
router.post(
  "/transactions/categories",
  validate(categorySchema),
  createCategory,
);
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

// router.patch(
//   "/transactions/:transactionId/image",
//   authenticateToken,
//   upload.single("image"),
//   uploadTransactionImg,
// );

export default router;
