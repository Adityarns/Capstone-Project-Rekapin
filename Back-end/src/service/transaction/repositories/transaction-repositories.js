import { Pool } from "pg";
import { nanoid } from "nanoid";

class TransactionRepositories {
  constructor() {
    this.pool = new Pool();
  }

  async createTransaction({
    title,
    amount,
    quantity,
    transaction_date,
    transaction_type,
    description,
    userId,
    businessId,
    categoryId,
  }) {
    const transaction_id = nanoid(16);
    const updated_at = transaction_date;
    const query = {
      text: `INSERT INTO transactions
               (transaction_id, title, amount, quantity, transaction_date, transaction_type,
                description, user_id, business_id, category_id, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING transaction_id, title, amount, quantity, transaction_date,
                       transaction_type, description, user_id, business_id, category_id`,
      values: [
        transaction_id,
        title,
        amount,
        quantity,
        transaction_date,
        transaction_type,
        description,
        userId,
        businessId,
        categoryId,
        updated_at,
      ],
    };
    const results = await this.pool.query(query);
    return results.rows[0];
  }

  async getTransactionByBusinessId(businessId) {
    const query = {
      text: `SELECT
               t.transaction_id,
               t.title,
               t.amount,
               t.transaction_date,
               t.transaction_type,
               t.description,
               t.user_id,
               t.business_id,
               t.category_id,
               c.name AS category_name,
               c.type AS category_type
             FROM transactions t
             LEFT JOIN transaction_categories c ON t.category_id = c.id
             WHERE t.business_id = $1
             ORDER BY t.transaction_date DESC`,
      values: [businessId],
    };
    const results = await this.pool.query(query);
    return results.rows;
  }

  async getTransactionById(transactionId) {
    const query = {
      text: `SELECT
                t.transaction_id,
                t.title,
                t.amount,
                t.quantity,
                t.transaction_date,
                t.transaction_type,
                t.description,
                t.user_id,
                t.business_id,
                t.category_id
              FROM transactions t
              WHERE t.transaction_id = $1`,
      values: [transactionId],
    };
    const results = await this.pool.query(query);
    return results.rows[0] || null;
  }

  async editTransaction({ transactionId, ...payload }) {
    const updated_at = new Date().toISOString();
    payload.updated_at = updated_at;

    const fields = Object.keys(payload).filter(
      (key) => payload[key] !== undefined,
    );
    if (fields.length === 0) return null;

    const setClause = fields.map((key, i) => `${key} = $${i + 1}`).join(", ");

    const query = {
      text: `UPDATE transactions
             SET ${setClause}
             WHERE transaction_id = $${fields.length + 1}
             RETURNING transaction_id, title, amount, transaction_date,
                       transaction_type, description, user_id, business_id, category_id`,
      values: [...fields.map((key) => payload[key]), transactionId],
    };
    const results = await this.pool.query(query);
    return results.rows[0];
  }

  async deleteTransaction(transactionId) {
    const query = {
      text: `DELETE FROM transactions
             WHERE transaction_id = $1
             RETURNING transaction_id`,
      values: [transactionId],
    };
    const results = await this.pool.query(query);
    return results.rows[0];
  }

  // Untuk validasi tipe transaksi vs kategori di controller
  async getCategoryById(categoryId) {
    const query = {
      text: `SELECT id, name, type FROM transaction_categories WHERE id = $1`,
      values: [categoryId],
    };
    const results = await this.pool.query(query);
    return results.rows[0] || null;
  }

  // async uploadTransactionImage({ userId, transactionUrl }) {
  //   const query = {
  //     text: `INSERT INTO transactions (image_url)
  //            VALUES ($1)
  //            WHERE user_id = $2
  //            RETURNING image_url`,
  //     values: [transactionUrl, userId],
  //   };
  //   const results = await this.pool.query(query);
  //   return results.rows[0] || null;
  // }
}

export default new TransactionRepositories();
