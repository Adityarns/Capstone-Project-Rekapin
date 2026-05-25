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
               AND log_date::timestamp BETWEEN $2::timestamp AND $3::timestamp`,
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
               AND log_date::timestamp >= date_trunc('month', NOW() - INTERVAL '1 month')
               AND log_date::timestamp < date_trunc('month', NOW())`,
      values: [businessId],
    };
    const result = await this.pool.query(query);
    return result.rows[0];
  }

  // ============================================================
  //  CARBON GOALS
  // ============================================================

  async createCarbonGoal({ businessId, targetTco2e, periodStart, periodEnd }) {
    const carbon_goal_id = nanoid(16);
    const created_at = new Date().toISOString();

    await this.pool.query(
      `UPDATE carbon_goals SET is_active = false WHERE business_id = $1`,
      [businessId],
    );

    const query = {
      text: `INSERT INTO carbon_goals
               (carbon_goal_id, business_id, target_carbon_reduction,
                period_start, period_end, is_active, created_at)
             VALUES ($1, $2, $3, $4, $5, true, $6)
             RETURNING *`,
      values: [
        carbon_goal_id,
        businessId,
        targetTco2e,
        periodStart,
        periodEnd,
        created_at,
      ],
    };
    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async getActiveCarbonGoal(businessId) {
    const query = {
      text: `SELECT * FROM carbon_goals
             WHERE business_id = $1
               AND is_active = true
             LIMIT 1`,
      values: [businessId],
    };
    const result = await this.pool.query(query);
    return result.rows[0] || null;
  }

  // ============================================================
  //  CARBON SUMMARY
  //  Untuk tampilan utama halaman Carbon Tracking
  // ============================================================
  async getCarbonSummary(businessId) {
    const goal = await this.getActiveCarbonGoal(businessId);

    const now = new Date();
    const periodStart =
      goal?.period_start ??
      new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
    const periodEnd = goal?.period_end ?? now.toISOString().split("T")[0];

    const { total_carbon } = await this.getTotalCarbonByBusinessId({
      businessId,
      startDate: periodStart,
      endDate: periodEnd,
    });

    const { total_carbon: last_month_carbon } =
      await this.getLastMonthCarbon(businessId);

    const targetTco2e = goal?.target_carbon_reduction ?? null;
    const progressPercent =
      targetTco2e && total_carbon
        ? Math.min(Math.round((total_carbon / 1000 / targetTco2e) * 100), 100)
        : 0;

    const changePercent =
      last_month_carbon > 0
        ? Math.round(
            ((total_carbon - last_month_carbon) / last_month_carbon) * 100,
          )
        : null;

    return {
      total_carbon_kg: parseFloat(total_carbon),
      total_carbon_tons: parseFloat((total_carbon / 1000).toFixed(2)),
      change_percent: changePercent,
      goal: goal
        ? {
            target_carbon_reduction: parseFloat(targetTco2e),
            progress_percent: progressPercent,
            period_start: periodStart,
            period_end: periodEnd,
          }
        : null,
    };
  }
}

export default new CarbonRepositories();
