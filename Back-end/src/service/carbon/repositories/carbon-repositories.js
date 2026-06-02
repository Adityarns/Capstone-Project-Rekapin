import { Pool } from "pg";
import { nanoid } from "nanoid";

class CarbonRepositories {
  constructor() {
    this.pool = new Pool();
  }

  // ============================================================
  //  CARBON LOGS
  // ============================================================

  async createCarbonLog({
    businessId,
    userId,
    transactionId,
    logDate,
    categoryType,
    quantity,
    carbonTotal,
  }) {
    const carbon_log_id = nanoid(16);
    const created_at = new Date().toISOString();
    const query = {
      text: `INSERT INTO carbon_logs
               (carbon_log_id, business_id, user_id, transaction_id,
                log_date, category, quantity, carbon_total, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
      values: [
        carbon_log_id,
        businessId,
        userId,
        transactionId,
        logDate,
        categoryType,
        quantity,
        carbonTotal,
        created_at,
      ],
    };
    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async getCarbonLogsByBusinessId(businessId) {
    const query = {
      text: `SELECT
               cl.carbon_log_id,
               cl.log_date,
               cl.category,
               cl.quantity,
               cl.carbon_total,
               cl.transaction_id,
               t.transaction_title
             FROM carbon_logs cl
             LEFT JOIN transactions t ON cl.transaction_id = t.transaction_id
             WHERE cl.business_id = $1
             ORDER BY cl.log_date DESC`,
      values: [businessId],
    };
    const result = await this.pool.query(query);
    return result.rows;
  }

  async getTotalCarbonByBusinessId({ businessId, startDate, endDate }) {
    const query = {
      text: `SELECT
               COALESCE(SUM(carbon_total), 0) AS total_carbon,
               COUNT(*) AS total_logs
             FROM carbon_logs
             WHERE business_id = $1
               AND log_date::timestamptz >= $2::timestamptz
               AND log_date::timestamptz < $3::timestamptz`,
      values: [businessId, startDate, endDate],
    };
    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async getLastMonthCarbon(businessId) {
    const query = {
      text: `SELECT COALESCE(SUM(carbon_total), 0) AS total_carbon
             FROM carbon_logs
             WHERE business_id = $1
               AND log_date::timestamptz >= date_trunc('month', NOW() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta' - INTERVAL '1 month'
               AND log_date::timestamptz < date_trunc('month', NOW() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'`,
      values: [businessId],
    };
    const result = await this.pool.query(query);
    return result.rows[0];
  }

  // ============================================================
  //  BASELINE — Total karbon bulan pertama bisnis ada data
  //  Dijadikan target otomatis untuk bulan berikutnya
  // ============================================================
  async getBaselineCarbon(businessId) {
    const query = {
      text: `SELECT
               COALESCE(SUM(carbon_total), 0) AS baseline_carbon,
               date_trunc('month', MIN(log_date::timestamptz)) AS first_month
             FROM carbon_logs
             WHERE business_id = $1
               AND log_date::timestamptz < date_trunc('month', NOW() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'`,
      values: [businessId],
    };
    const result = await this.pool.query(query);

    const { baseline_carbon, first_month } = result.rows[0];

    // Belum ada data bulan sebelumnya → belum bisa hitung baseline
    if (!first_month) return null;

    return parseFloat(baseline_carbon);
  }

  // ============================================================
  //  CARBON BREAKDOWN PER KATEGORI
  //  Untuk chart Carbon Breakdown di UI
  // ============================================================
  async getCarbonBreakdown(businessId) {
    const now = new Date();
    // Gunakan rentang [startOfMonth, startOfNextMonth) sehingga semua log
    // pada bulan berjalan akan tercakup tanpa tergantung pada jam "sekarang".
    const firstDayThisMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();
    const startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    ).toISOString();

    const query = {
      text: `SELECT
               category,
               ROUND(COALESCE(SUM(carbon_total), 0)::NUMERIC, 2) AS total_carbon,
               ROUND(
                 (COALESCE(SUM(carbon_total), 0) /
                 NULLIF(SUM(SUM(carbon_total)) OVER (), 0) * 100)::NUMERIC
               , 1) AS percentage
             FROM carbon_logs
             WHERE business_id = $1
              AND log_date::timestamptz >= $2::timestamptz
              AND log_date::timestamptz < $3::timestamptz
             GROUP BY category
             ORDER BY total_carbon DESC`,
      values: [businessId, firstDayThisMonth, startOfNextMonth],
    };
    const result = await this.pool.query(query);
    return result.rows;
  }

  // ============================================================
  //  CARBON SUMMARY
  // ============================================================
  async getCarbonSummary(businessId) {
    const now = new Date();
    const firstDayThisMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();
    const startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    ).toISOString();

    const { total_carbon } = await this.getTotalCarbonByBusinessId({
      businessId,
      startDate: firstDayThisMonth,
      endDate: startOfNextMonth,
    });

    const { total_carbon: last_month_carbon } =
      await this.getLastMonthCarbon(businessId);
    const baseline_carbon = await this.getBaselineCarbon(businessId);

    const changePercent =
      last_month_carbon > 0
        ? Math.round(
            ((total_carbon - last_month_carbon) / last_month_carbon) * 100,
          )
        : null;

    const progressPercent =
      baseline_carbon && baseline_carbon > 0
        ? Math.min(Math.round((total_carbon / baseline_carbon) * 100), 100)
        : null;

    const breakdown = await this.getCarbonBreakdown(businessId);

    return {
      total_carbon_kg: parseFloat(Number(total_carbon).toFixed(2)),
      last_month_carbon_kg: parseFloat(Number(last_month_carbon).toFixed(2)),
      change_percent: changePercent,
      goal: baseline_carbon
        ? {
            baseline_carbon_kg: parseFloat(Number(baseline_carbon).toFixed(2)),
            progress_percent: progressPercent,
            is_on_track: total_carbon < baseline_carbon,
          }
        : null,
      breakdown,
    };
  }
}

export default new CarbonRepositories();
