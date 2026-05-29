import {
  scanReceiptWithAI,
  calculateCarbonWithAI,
} from "../../models/ai-service.js";
import response from "../../../utils/response.js";
import { InvariantError, NotFoundError } from "../../../exceptions/index.js";
import TransactionRepositories from "../repositories/transaction-repositories.js";
import CarbonRepositories from "../../carbon/repositories/carbon-repositories.js";

export const createCategory = async (req, res, next) => {
  const {
    category_name,
    category_type,
    is_carbon_tracked = false,
  } = req.validated;
  const newCategory = await TransactionRepositories.createCategory({
    category_name,
    category_type,
    is_carbon_tracked,
  });
  if (!newCategory) {
    return next(new InvariantError("Gagal menambahkan kategori"));
  }
  return response(res, 201, "Kategori berhasil ditambahkan", newCategory);
};

export const getCategoriesByType = async (req, res, next) => {
  const { type } = req.query;
  const categories = await TransactionRepositories.getCategoriesByType(type);
  if (!categories) {
    return next(new NotFoundError("Kategori tidak ditemukan"));
  }
  return response(res, 200, "Kategori berhasil diambil", { categories });
};

export const addTransaction = async (req, res, next) => {
  const {
    title,
    amount,
    quantity,
    date,
    type,
    description,
    businessId,
    categoryId,
  } = req.validated;
  const userId = req.user.user_id;

  // ================================================
  //  Validasi kategori vs tipe transaksi
  // ================================================
  const category = await TransactionRepositories.getCategoryById(categoryId);
  if (!category) {
    return next(new InvariantError("Kategori tidak ditemukan"));
  }
  if (category.category_type !== type) {
    return next(
      new InvariantError(
        `Kategori ini hanya untuk ${category.category_type === "income" ? "pemasukan" : "pengeluaran"}`,
      ),
    );
  }

  // ================================================
  //  Simpan transaksi
  // ================================================
  const newTransaction = await TransactionRepositories.createTransaction({
    title,
    amount,
    quantity,
    date,
    type,
    description,
    userId,
    businessId,
    categoryId,
  });

  if (!newTransaction) {
    return next(new InvariantError("Gagal menambahkan transaksi"));
  }

  // ================================================
  //  Kalkulasi karbon otomatis
  //  Hanya untuk kategori yang is_carbon_tracked = true
  //  (Electricity dan Fuel)
  // ================================================
  if (category.is_carbon_tracked === true) {
    try {
      const carbonResult = await calculateCarbonWithAI({
        description: description || title,
        quantity: quantity,
      });

      await CarbonRepositories.createCarbonLog({
        businessId,
        userId,
        transactionId: newTransaction.transaction_id,
        logDate: date,
        categoryType: category.category_name,
        quantity,
        carbonTotal: carbonResult.estimated_emission_ton_co2 ?? 0,
      });
    } catch (error) {
      // Kalau kalkulasi karbon gagal, transaksi tetap tersimpan
      // Tidak perlu return error — carbon log bisa dihitung ulang nanti
      console.error("Carbon calculation failed:", error.message);
    }
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

export const scanTransactionReceipt = async (req, res, next) => {
  try {
    // 1. Pastikan file dikirim dari Postman
    if (!req.file) {
      return next(new InvariantError("File struk (receipt) tidak ditemukan"));
    }

    // 2. Konversi Buffer biner dari Multer ke format teks Base64
    const base64Image = req.file.buffer.toString("base64");
    const mediaType = req.file.mimetype; // Mengekstrak "image/jpeg" atau "image/png"

    // 3. Panggil fungsi AI Service dengan parameter objek yang sesuai
    const aiResult = await scanReceiptWithAI({ base64Image, mediaType });

    // 4. Kembalikan hasil ekstraksi AI ke Postman
    return response(res, 200, "Struk berhasil dipindai oleh AI", aiResult);
  } catch (error) {
    next(error);
  }
};
