import { scanReceiptWithAI } from "../../../service/Ai Models/ai-service.js";
import response from "../../../utils/response.js";
import { InvariantError, NotFoundError } from "../../../exceptions/index.js";
import TransactionRepositories from "../repositories/transaction-repositories.js";
// import { uploadTransactionImage } from "../../supabase/supabase-service.js";

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

export const createCategory = async (req, res, next) => {
  const { category_name, category_type } = req.validated;
  const newCategory = await TransactionRepositories.createCategory({
    category_name,
    category_type,
  });
  if (!newCategory) {
    return next(new InvariantError("Gagal menambahkan kategori"));
  }
  return response(res, 201, "Kategori berhasil ditambahkan", newCategory);
};

export const addTransaction = async (req, res, next) => {
  const {
    transaction_title,
    amount,
    quantity,
    transaction_date,
    transaction_type,
    description,
    businessId,
    categoryId,
  } = req.validated;
  const userId = req.user.user_id;

  const category = await TransactionRepositories.getCategoryById(categoryId);
  if (!category) {
    return next(new InvariantError("Kategori tidak ditemukan"));
  }

  if (category.category_type !== transaction_type) {
    return next(
      new InvariantError(
        `Kategori ini hanya untuk ${category.category_type === "income" ? "pemasukan" : "pengeluaran"}`,
      ),
    );
  }
  if (
    category.category_name === "electricity" ||
    category.category_name === "fuel"
  ) {
    if (quantity === undefined) {
      return next(
        new InvariantError(
          `Kategori ${category.category_name} memerlukan field quantity`,
        ),
      );
    }
  }
  const newTransaction = await TransactionRepositories.createTransaction({
    transaction_title,
    amount,
    quantity,
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

// export const uploadTransactionImg = async (req, res, next) => {
//   if (!req.file) {
//     return next(new InvariantError("File foto tidak ditemukan"));
//   }

//   const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
//   if (!allowedMimeTypes.includes(req.file.mimetype)) {
//     return next(
//       new InvariantError(
//         "Format file tidak didukung. Gunakan JPG, PNG, atau WebP",
//       ),
//     );
//   }

//   const maxSizeBytes = 2 * 1024 * 1024; // 2MB
//   if (req.file.size > maxSizeBytes) {
//     return next(new InvariantError("Ukuran foto maksimal 2MB"));
//   }

//   const userId = req.user.user_id;

//   // Upload foto baru ke Supabase
//   const transactionUrl = await uploadTransactionImage({
//     userId,
//     fileBuffer: req.file.buffer,
//     mimeType: req.file.mimetype,
//   });

//   // Simpan URL baru ke database
//   const uploadTransaction =
//     await TransactionRepositories.uploadTransactionImage({
//       userId,
//       transactionUrl,
//     });
//   if (!uploadTransaction) {
//     return next(new InvariantError("Gagal memperbarui foto transaksi"));
//   }

//   return response(res, 200, "Foto transaksi berhasil diperbarui", {
//     transactionUrl: uploadTransaction.transactionUrl,
//   });
// };
