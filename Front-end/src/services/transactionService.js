/**
 * ============================================================
 *    REKAPIN — Transaction Service
 *    src/services/transactionService.js
 *
 *    Service layer untuk semua API call terkait transaksi.
 *    Menggunakan api helper dari api.js.
 * ============================================================
 * @format
 */

import { api, apiRequest } from "./api";

// ── Categories ────────────────────────────────────────────────

/**
 * Ambil daftar kategori berdasarkan tipe transaksi.
 * @param {"expense"|"income"} type
 * @returns {Promise<Array>} categories
 */
export async function getCategories(type) {
  const res = await api.get(`/transactions/categories?type=${type}`);
  return res.data.categories;
}

// ── Transactions CRUD ─────────────────────────────────────────

/**
 * Buat transaksi baru.
 * @param {Object} payload - { title, amount, quantity, date, type, description, businessId, categoryId }
 * @returns {Promise<Object>} newTransaction
 */
export async function createTransaction(payload) {
  const res = await api.post("/transactions", payload);
  return res.data;
}

/**
 * Ambil semua transaksi berdasarkan businessId.
 * @param {string} businessId
 * @returns {Promise<Array>} transactions
 */
export async function getTransactions(businessId) {
  const res = await api.get(`/transactions/business/${businessId}`);
  return res.data.transactions;
}

/**
 * Ambil detail transaksi berdasarkan ID.
 * @param {string} transactionId
 * @returns {Promise<Object>} transaction
 */
export async function getTransactionById(transactionId) {
  const res = await api.get(`/transactions/${transactionId}`);
  return res.data;
}

/**
 * Update transaksi.
 * @param {string} transactionId
 * @param {Object} payload - partial fields to update
 * @returns {Promise<Object>} updatedTransaction
 */
export async function updateTransaction(transactionId, payload) {
  const res = await api.put(`/transactions/${transactionId}`, payload);
  return res.data;
}

/**
 * Hapus transaksi.
 * @param {string} transactionId
 * @returns {Promise<Object>} deletedTransaction
 */
export async function deleteTransaction(transactionId) {
  const res = await api.delete(`/transactions/${transactionId}`);
  return res.data;
}

// ── Receipt Scan (AI) ─────────────────────────────────────────

/**
 * Scan receipt image via AI untuk ekstrak data.
 * Menggunakan multipart/form-data.
 * @param {File} file - image file (jpg, png)
 * @returns {Promise<Object>} extracted data from AI
 */
export async function scanReceipt(file) {
  const formData = new FormData();
  formData.append("receipt", file);

  const res = await apiRequest("/transactions/scan", {
    method: "POST",
    body: formData,
  });
  return res.data;
}
