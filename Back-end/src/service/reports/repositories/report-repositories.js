import { Pool } from "pg";

class FinancialReportRepositories {
  constructor() {
    this.pool = new Pool();
  }

  // ============================================================
  // 1. DATA TRANSAKSI BERDASARKAN RENTANG TANGGAL
  // Mengambil akumulasi nominal per tipe dan nama kategori
  // Digunakan untuk menyusun tabel Income Statement (Laba Rugi)
  // ============================================================
  async getFinancialDataByPeriod(businessId, startDate, endDate) {
    const query = {
      text: `SELECT 
               t.transaction_type AS type, c.category_name AS category_name,
               COALESCE(SUM(CAST(t.amount AS NUMERIC)), 0) AS total_amount
             FROM transactions t
             JOIN transaction_categories c ON t.category_id = c.transaction_categories_id
             WHERE t.business_id = $1 
               AND t.transaction_date::timestamptz BETWEEN $2::timestamptz AND $3::timestamptz
             GROUP BY t.transaction_type, c.category_name`,
      values: [businessId, startDate, endDate],
    };

    const result = await this.pool.query(query);
    return result.rows;
  }

  // ============================================================
  // 2. CASH FLOW OVERVIEW (BULANAN)
  // Mengelompokkan Inflow & Outflow per bulan dalam rentang waktu tertentu
  // Sesuai untuk kebutuhan bar chart di UI (Jul, Aug, Sep, Oct)
  // ============================================================
  async getMonthlyCashFlow(businessId, startDate, endDate) {
    const query = {
      text: `SELECT 
               TO_CHAR(t.transaction_date::timestamptz, 'Mon') AS month_name,
               EXTRACT(MONTH FROM t.transaction_date::timestamptz) AS month_num,
               COALESCE(SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END), 0) AS inflow,
               COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END), 0) AS outflow
             FROM transactions t
             WHERE t.business_id = $1
               AND t.transaction_date::timestamptz BETWEEN $2::timestamptz AND $3::timestamptz
             GROUP BY month_name, month_num
             ORDER BY month_num ASC`,
      values: [businessId, startDate, endDate],
    };

    const result = await this.pool.query(query);
    return result.rows;
  }

  // ============================================================
  // 3. TOTAL CARBON FOOTPRINT PERIODE TERPILIH
  // Mengambil total emisi karbon untuk disinkronkan ke Summary Card
  // ============================================================
  async getDailyExpensesLast30Days(businessId) {
    const query = {
      text: `SELECT 
               DATE(t.transaction_date::timestamptz) AS transaction_date,
               COALESCE(SUM(CAST(t.amount AS NUMERIC)), 0) AS total_amount
             FROM transactions t
             WHERE t.business_id = $1 
               AND t.transaction_type = 'expense'
               AND t.transaction_date::timestamptz >= CURRENT_DATE - INTERVAL '30 days'
             GROUP BY DATE(t.transaction_date::timestamptz)
             ORDER BY transaction_date ASC`,
      values: [businessId],
    };

    const result = await this.pool.query(query);
    return result.rows;
  }

  async getCarbonTotalByPeriod(businessId, startDate, endDate) {
    const query = {
      text: `SELECT 
               COALESCE(SUM(carbon_total), 0) AS total_carbon
             FROM carbon_logs
             WHERE business_id = $1
               AND log_date::timestamptz BETWEEN $2::timestamptz AND $3::timestamptz`,
      values: [businessId, startDate, endDate],
    };

    const result = await this.pool.query(query);
    return result.rows[0];
  }
}

export default new FinancialReportRepositories();
