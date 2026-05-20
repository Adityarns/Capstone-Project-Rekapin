import { Pool } from "pg";
import { nanoid } from "nanoid";

class TransactionRepositories {
  constructor() {
    this.pool = new Pool();
  }
  async createTransaction({
    amount,
    transaction_date,
    transaction_type,
    description,
    user_id,
    businness_id,
    category_id,
  }) {
    const transaction_id = nanoid(16);
    const created_at = new Date().toISOString();
    const query = {
      text: `INSERT INTO transactions(transcation_id, amount, transaction_date, transaction_type, descriptions, user_id, business_id, category_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING transaction, username, password, fullname`,
      values: [id, username, hashedPassword, fullname, created_at, updated_at],
    };
    const results = await this.pool.query(query);
    return results.rows[0];
  }

  async getTransactionByBusinessId(businessId) {
    const query = {
      text: `SELECT * FROM transactions WHERE business_id = $1`,
      values: [businessId],
    };
    const results = await this.pool.query(query);
    return results.rows;
  }
}

export default new TransactionRepositories();
