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
    date,
    type,
    description,
    userId,
    businessId,
    categoryId,
  }) {
    const transaction_id = nanoid(16);
    const updated_at = date;
    const query = {
      text: `INSERT INTO transactions
               (transaction_id, transaction_title, amount, quantity, transaction_date, transaction_type,
                description, user_id, business_id, category_id, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING transaction_id, transaction_title, amount, quantity, transaction_date,
                       transaction_type, description, user_id, business_id, category_id`,
      values: [
        transaction_id,
        title,
        amount,
        quantity,
        date,
        type,
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
               t.transaction_title,
               t.amount,
               t.quantity,
               t.transaction_date,
               t.transaction_type,
               t.description,
               t.user_id,
               u.username AS username,
               t.business_id,
               t.category_id,
               c.category_name,
               c.category_type
             FROM transactions t
             LEFT JOIN transaction_categories c ON t.category_id = c.transaction_categories_id
             LEFT JOIN users u ON t.user_id = u.user_id
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
                t.transaction_title,
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
    return results.rows[0];
  }

  async editTransaction({ transactionId, ...payload }) {
    const columnMapping = {
      title: "transaction_title",
      amount: "amount",
      quantity: "quantity",
      date: "transaction_date",
      type: "transaction_type",
      description: "description",
      businessId: "business_id",
      categoryId: "category_id",
    };

    const updated_at = new Date().toISOString();
    payload.updated_at = updated_at;

    const dbPayload = {};
    for (const key in payload) {
      if (payload[key] !== undefined) {
        const dbKey = columnMapping[key] || key; // Gunakan mapping jika ada, jika tidak gunakan nama aslinya
        dbPayload[dbKey] = payload[key];
      }
    }

    const fields = Object.keys(dbPayload);
    if (fields.length === 0) return null;

    const setClause = fields.map((key, i) => `${key} = $${i + 1}`).join(", ");

    const query = {
      text: `UPDATE transactions
           SET ${setClause}
           WHERE transaction_id = $${fields.length + 1}
           RETURNING transaction_id, transaction_title, amount, quantity, transaction_date,
                     transaction_type, description, business_id, category_id`,
      values: [...fields.map((key) => dbPayload[key]), transactionId],
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

  async createCategory({
    category_name,
    category_type,
    is_carbon_tracked = false,
  }) {
    const transaction_categories_id = nanoid(16);
    const query = {
      text: `INSERT INTO transaction_categories
               (transaction_categories_id, category_name, category_type, is_carbon_tracked)
             VALUES ($1, $2, $3, $4)
              RETURNING transaction_categories_id, category_name, category_type, is_carbon_tracked`,
      values: [
        transaction_categories_id,
        category_name,
        category_type,
        is_carbon_tracked,
      ],
    };
    const results = await this.pool.query(query);
    return results.rows[0];
  }

  async getCategoriesByType(type) {
    const query = {
      text: `SELECT transaction_categories_id, category_name, category_type, is_carbon_tracked
              FROM transaction_categories
              WHERE category_type = $1`,
      values: [type],
    };
    const results = await this.pool.query(query);
    return results.rows;
  }

  async getCategoryById(categoryId) {
    const query = {
      text: `SELECT transaction_categories_id, category_name, category_type, is_carbon_tracked FROM transaction_categories WHERE transaction_categories_id = $1`,
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
