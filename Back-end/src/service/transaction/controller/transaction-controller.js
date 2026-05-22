import { scanReceiptWithAI } from "../../../service/Ai Models/ai-service.js";
import response from "../../../utils/response.js";
import { InvariantError, NotFoundError } from "../../../exceptions/index.js";
import TransactionRepositories from "../repositories/transaction-repositories.js";

export const scanReceipt = async (req, res, next) => {
  if (!req.file) {
    return next(new InvariantError("File struk tidak ditemukan"));
  }

  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return next(
      new InvariantError(
        "Format file tidak didukung. Gunakan JPG, PNG, atau WebP",
      ),
    );
  }

  const base64Image = req.file.buffer.toString("base64");
  const mediaType = req.file.mimetype;

  // Cukup ganti isi ai-service.js nanti ketika model sudah siap
  const extractedData = await scanReceiptWithAI({ base64Image, mediaType });

  return response(res, 200, "Struk berhasil dianalisis", extractedData);
};

export const addTransaction = async (req, res, next) => {
  const {
    title,
    amount,
    transaction_date,
    transaction_type,
    description,
    businessId,
    categoryId,
  } = req.validated;
  const userId = req.user.id;

  // Validasi tipe transaksi harus cocok dengan kategori
  const category = await TransactionRepositories.getCategoryById(categoryId);
  if (!category) {
    return next(new InvariantError("Kategori tidak ditemukan"));
  }
  if (category.type !== transaction_type) {
    return next(
      new InvariantError(
        `Kategori "${category.name}" hanya bisa digunakan untuk ${category.type === "income" ? "pemasukan" : "pengeluaran"}`,
      ),
    );
  }

  const newTransaction = await TransactionRepositories.createTransaction({
    title,
    amount,
    transaction_date,
    transaction_type,
    description,
    userId,
    businessId,
    categoryId,
  });

  if (!newTransaction) {
    return next(new InvariantError("Gagal menambahkan transaksi"));
  }

  return response(res, 201, "Transaksi berhasil ditambahkan", newTransaction);
};

export const getTransactionsByBusinessId = async (req, res, next) => {
  const { businessId } = req.params;
  const transactions =
    await TransactionRepositories.getTransactionByBusinessId(businessId);
  if (!transactions) {
    return next(
      new NotFoundError("Transaksi tidak ditemukan untuk bisnis ini"),
    );
  }
  return response(res, 200, "Transaksi berhasil diambil", { transactions });
};

export const getTransactionById = async (req, res, next) => {
  const { transactionId } = req.params;
  const transaction =
    await TransactionRepositories.getTransactionById(transactionId);
  if (!transaction) {
    return next(new NotFoundError("Transaksi tidak ditemukan"));
  }
  return response(res, 200, "Transaksi berhasil diambil", transaction);
};

export const editTransaction = async (req, res, next) => {
  const { transactionId } = req.params;
  const payload = req.validated;

  const updatedTransaction = await TransactionRepositories.editTransaction({
    transactionId,
    ...payload,
  });

  if (!updatedTransaction) {
    return next(new InvariantError("Gagal memperbarui transaksi"));
  }

  return response(
    res,
    200,
    "Transaksi berhasil diperbarui",
    updatedTransaction,
  );
};

export const deleteTransaction = async (req, res, next) => {
  const { transactionId } = req.params;

  const deletedTransaction =
    await TransactionRepositories.deleteTransaction(transactionId);

  if (!deletedTransaction) {
    return next(new InvariantError("Gagal menghapus transaksi"));
  }

  return response(res, 200, "Transaksi berhasil dihapus", deletedTransaction);
};
