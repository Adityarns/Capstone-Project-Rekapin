import {
  scanReceiptWithAI,
  calculateCarbonWithAI,
} from "../../models/ai-service.js";
import response from "../../../utils/response.js";
import { InvariantError, NotFoundError } from "../../../exceptions/index.js";
import TransactionRepositories from "../repositories/transaction-repositories.js";
import CarbonRepositories from "../../carbon/repositories/carbon-repositories.js";
import CacheService from "../../cache/redis-cache.js";

const cacheService = new CacheService();

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

  // 1. Pengecekan Boolean yang Tahan Banting
  const isTracked =
    category.is_carbon_tracked === true ||
    category.is_carbon_tracked === "true" ||
    category.is_carbon_tracked === 1;

  if (isTracked) {
    try {
      let emissionInKg = 0;

      // 2. Amankan nilai quantity (Ubah ke angka, jika kosong jadikan 1 sebagai acuan)
      const safeQuantity = Number(quantity) || 1;

      // 3. Pengecekan nama yang tidak peduli huruf besar/kecil
      const catName = (category.category_name || "").toLowerCase();

      if (catName === "electricity" || catName === "listrik") {
        // Perhitungan Manual: kWh * 0.85 = kg CO2
        emissionInKg = safeQuantity * 0.85;
      } else {
        // Perhitungan via AI untuk Fuel / Transportation
        const carbonResult = await calculateCarbonWithAI({
          description: description || title,
          quantity: safeQuantity,
        });

        const emissionInTons = carbonResult?.estimated_emission_ton_co2 || 0;
        emissionInKg = emissionInTons * 1000;
      }

      // 4. Proses Simpan
      await CarbonRepositories.createCarbonLog({
        businessId,
        userId,
        transactionId: newTransaction.transaction_id,
        logDate: date,
        categoryType: category.category_name,
        quantity: safeQuantity,
        carbonTotal: emissionInKg,
      });

      console.log(
        `📦 [DEBUG] Karbon berhasil dicatat: ${emissionInKg} kg untuk transaksi ${title}`,
      );
    } catch (error) {
      // 5. JANGAN DITELAN! Cetak error aslinya agar Anda tahu apa yang rusak
      console.error(
        "❌ [FATAL] Gagal menghitung atau menyimpan jejak karbon:",
        error,
      );
    }
  }

  // Hapus semua cache yang berhubungan
  await cacheService.del(`transactions_${businessId}`);
  await cacheService.del(`carbonSummary_${businessId}`);
  await cacheService.del(`carbonLogs_${businessId}`);
  await cacheService.delPattern(`financialSummary_${businessId}_*`); // Hapus semua financial summary untuk business ini
  await cacheService.delPattern(`incomeStatement_${businessId}_*`); // Hapus semua income statement untuk business ini
  await cacheService.del(`revenueForecast_${businessId}`);
  await cacheService.delPattern(`revenue_forecast_${businessId}_*`);

  return response(res, 201, "Transaksi berhasil ditambahkan", newTransaction);
};

export const getTransactionsByBusinessId = async (req, res, next) => {
  const { businessId } = req.params;
  const cachedTransactions = await cacheService.get(
    `transactions_${businessId}`,
  );
  if (cachedTransactions) {
    res.setHeader("X-Data-Source", "cache");
    const parsedData =
      typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;
    return response(res, 200, "Transaksi berhasil diambil (cache)", {
      transactions: parsedData,
    });
  }
  const transactions =
    await TransactionRepositories.getTransactionByBusinessId(businessId);
  if (!transactions) {
    return next(
      new NotFoundError("Transaksi tidak ditemukan untuk bisnis ini"),
    );
  }
  await cacheService.set(
    `transactions_${businessId}`,
    JSON.stringify(transactions),
  );
  res.setHeader("X-Data-Source", "database");
  return response(res, 200, "Transaksi berhasil diambil", { transactions });
};

export const getTransactionById = async (req, res, next) => {
  const { transactionId } = req.params;
  const cachedTransaction = await cacheService.get(
    `transaction_${transactionId}`,
  );
  if (cachedTransaction) {
    res.setHeader("X-Data-Source", "cache");
    const parsedData =
      typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;
    return response(res, 200, "Transaksi berhasil diambil (cache)", parsedData);
  }
  const transaction =
    await TransactionRepositories.getTransactionById(transactionId);
  if (!transaction) {
    return next(new NotFoundError("Transaksi tidak ditemukan"));
  }
  await cacheService.set(
    `transaction_${transactionId}`,
    JSON.stringify(transaction),
  );
  res.setHeader("X-Data-Source", "database");
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
  await cacheService.del(`transaction_${transactionId}`); // Hapus cache transaksi yang diupdate
  await cacheService.del(`transactions_${updatedTransaction.business_id}`);
  await cacheService.del(`carbonSummary_${updatedTransaction.business_id}`); // Hapus cache ringkasan karbon
  await cacheService.del(`carbonLogs_${updatedTransaction.business_id}`); // Hapus cache log karbon
  await cacheService.delPattern(
    `financialSummary_${updatedTransaction.business_id}_*`,
  );
  await cacheService.delPattern(
    `incomeStatement_${updatedTransaction.business_id}_*`,
  );
  await cacheService.del(`revenueForecast_${updatedTransaction.business_id}`);
  await cacheService.delPattern(
    `revenue_forecast_${updatedTransaction.business_id}_*`,
  );
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
  await cacheService.del(`transaction_${transactionId}`); // Hapus cache transaksi yang dihapus
  await cacheService.del(`transactions_${deletedTransaction.business_id}`); // Hapus cache list transaksi untuk bisnis ini
  await cacheService.del(`carbonSummary_${deletedTransaction.business_id}`); // Hapus cache ringkasan karbon
  await cacheService.del(`carbonLogs_${deletedTransaction.business_id}`); // Hapus cache log karbon
  await cacheService.delPattern(
    `financialSummary_${deletedTransaction.business_id}_*`,
  );
  await cacheService.delPattern(
    `incomeStatement_${deletedTransaction.business_id}_*`,
  );
  await cacheService.del(`revenueForecast_${deletedTransaction.business_id}`);
  await cacheService.delPattern(
    `revenue_forecast_${deletedTransaction.business_id}_*`,
  );
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
