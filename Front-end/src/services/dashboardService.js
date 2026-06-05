/**
 * ============================================================
 * REKAPIN — Dashboard Service
 * src/services/dashboardService.js
 * ============================================================
 */

import { api } from "./api";

const getCurrentQuarter = () => {
  const month = new Date().getMonth() + 1;
  if (month <= 3) return "Q1";
  if (month <= 6) return "Q2";
  if (month <= 9) return "Q3";
  return "Q4";
};

const buildReportQuery = (quarter, year) => {
  const params = new URLSearchParams();
  if (quarter) params.set("quarter", quarter);
  if (year) params.set("year", String(year));
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

// ── Carbon Summary ─────────────────────────────────────────

export async function getCarbonSummary(businessId) {
  try {
    const res = await api.get(`/carbon/${businessId}/summary`);

    // Auto-deteksi struktur JSON (menangani jika Axios sudah mengupas res.data)
    const jsonBody = res.data !== undefined ? res.data : res;
    return jsonBody?.data || jsonBody || {};
  } catch (error) {
    console.error("Gagal mengambil carbon summary:", error);
    return {};
  }
}

export async function getDashboardReportSummary(businessId) {
  try {
    const quarter = getCurrentQuarter();
    const year = new Date().getFullYear();
    const res = await api.get(
      `/reports/${businessId}/financial-summary${buildReportQuery(
        quarter,
        year,
      )}`,
    );

    const jsonBody = res.data !== undefined ? res.data : res;
    return jsonBody?.data || jsonBody || {};
  } catch (error) {
    console.error("Gagal mengambil report summary untuk dashboard:", error);
    return {};
  }
}

export async function getCarbonLogs(businessId) {
  try {
    const res = await api.get(`/carbon/${businessId}/logs`);

    // Auto-deteksi struktur JSON (menangani jika Axios sudah mengupas res.data)
    const jsonBody = res.data !== undefined ? res.data : res;
    return jsonBody?.logs || [];
  } catch (error) {
    console.error("Gagal mengambil carbon logs:", error);
    return [];
  }
}

// ── Transactions ───────────────────────────────────────────

export async function getTransactionsForDashboard(businessId) {
  try {
    const res = await api.get(`/transactions/business/${businessId}`);

    // Auto-deteksi struktur JSON
    const jsonBody = res.data !== undefined ? res.data : res;

    // Cari array transaksi di berbagai kemungkinan letaknya
    const payload = jsonBody?.data?.transactions || jsonBody?.transactions;

    if (Array.isArray(payload)) {
      return payload;
    }

    return [];
  } catch (error) {
    console.error("Gagal mengambil transaksi dashboard:", error);
    return [];
  }
}

// ── Helper Functions ─────────────────────────────────────

export function calculateFinancialSummary(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      totalIncome: { value: 0, change: 0, positive: true },
      totalExpense: { value: 0, change: 0, positive: false },
      netCashFlow: { value: 0, change: 0, positive: true },
    };
  }

  let totalIncome = 0;
  let totalExpense = 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  transactions.forEach((txn) => {
    // 1. Ekstrak string tanggal (Cegah error jika null)
    const dateString = txn.transaction_date || txn.date;
    if (!dateString) return;

    // 2. Normalisasi pemrosesan tanggal (Ambil bagian YYYY-MM saja agar kebal dari isu TimeZone)
    // Format dari DB: "2026-05-30T07:00:00.000+07:00" -> Ekstrak jadi "2026-05"
    const yearMonthMatch = String(dateString).match(/^(\d{4})-(\d{2})/);

    if (yearMonthMatch) {
      const txnYear = parseInt(yearMonthMatch[1], 10);
      const txnMonth = parseInt(yearMonthMatch[2], 10) - 1; // Kurangi 1 karena indeks bulan di JS dimulai dari 0 (0-11)

      // Hanya kalkulasikan nominal jika bulan dan tahun cocok dengan saat ini
      if (txnYear === currentYear && txnMonth === currentMonth) {
        const amount = parseFloat(txn.amount) || 0;
        const type = (txn.transaction_type || txn.type || "").toLowerCase();

        if (type === "income") totalIncome += amount;
        if (type === "expense") totalExpense += amount;
      }
    }
  });

  const netCashFlow = totalIncome - totalExpense;

  return {
    totalIncome: { value: totalIncome, change: 0, positive: true },
    totalExpense: { value: totalExpense, change: 0, positive: false },
    netCashFlow: { value: netCashFlow, change: 0, positive: netCashFlow >= 0 },
  };
}

export function getRecentTransactions(transactions, limit = 5) {
  if (!Array.isArray(transactions)) return [];

  return (
    transactions
      .map((txn) => {
        // Standarisasi properti agar komponen antarmuka mudah membacanya
        const rawDate =
          txn.transaction_date || txn.date || new Date().toISOString();
        const parsedAmount = parseFloat(txn.amount) || 0;
        const type = (txn.transaction_type || txn.type || "").toLowerCase();

        return {
          id: txn.transaction_id || txn.id || Math.random().toString(),
          name: txn.transaction_title || txn.title || "Transaksi",
          category: txn.category_name || txn.category || "Lainnya",
          amount: type === "income" ? parsedAmount : -Math.abs(parsedAmount), // Pengeluaran harus minus
          rawDateString: rawDate, // Disimpan untuk proses sortir
          username: txn.username || "—",
          // Merender tanggal ke format lokalisasi Indonesia
          date: new Date(rawDate).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        };
      })
      // Mensortir berdasarkan tanggal terbaru (descending)
      .sort((a, b) => new Date(b.rawDateString) - new Date(a.rawDateString))
      // Batasi jumlah transaksi sesuai limit (default: 5 atau 10 di antarmuka Anda)
      .slice(0, limit)
  );
}

export function convertCarbonKgToTons(carbonKg) {
  const kg = parseFloat(carbonKg);
  // Pencegahan agar tidak mengembalikan NaN jika nilai kosong atau invalid
  if (isNaN(kg)) return 0;

  return Math.round((kg / 1000) * 100) / 100;
}

export async function getPendingInvitations() {
  try {
    const res = await api.get(`/invitations`);
    const jsonBody = res.data !== undefined ? res.data : res;
    // Mengamankan jalur ekstraksi array undangan
    return (
      jsonBody?.data?.invitations ||
      jsonBody?.invitations ||
      jsonBody?.data ||
      []
    );
  } catch (error) {
    console.error("Gagal mengambil daftar undangan aktif:", error);
    throw error;
  }
}

export async function acceptTeamInvitation(inviteCode) {
  try {
    const res = await api.post(`/invitations/${inviteCode}/accept`);
    const jsonBody = res.data !== undefined ? res.data : res;
    return jsonBody?.data || jsonBody || {};
  } catch (error) {
    console.error("Gagal menerima undangan tim:", error);
    throw error;
  }
}

export async function rejectTeamInvitation(inviteCode) {
  try {
    const res = await api.delete(`/invitations/${inviteCode}`);
    const jsonBody = res.data !== undefined ? res.data : res;
    return jsonBody?.data || jsonBody || {};
  } catch (error) {
    console.error("Gagal menolak undangan tim:", error);
    throw error;
  }
}
