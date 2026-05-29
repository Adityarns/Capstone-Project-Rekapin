import { nanoid } from "nanoid";
import { Pool } from "pg";
import bcrypt from "bcrypt";

class UserRepositories {
  constructor() {
    this.pool = new Pool();
  }

  async addUser({ username, email, password }) {
    const user_id = nanoid(16);
    const created_at = new Date().toISOString();
    const updated_at = created_at;
    const query = {
      text: `INSERT INTO users(user_id, username, email, password, created_at, updated_at)
             VALUES($1, $2, $3, $4, $5, $6)
             RETURNING user_id, username, email`,
      values: [user_id, username, email, password, created_at, updated_at],
    };
    const results = await this.pool.query(query);
    return results.rows[0];
  }

  async verifyEmail(email) {
    const query = {
      text: "SELECT * FROM users WHERE email = $1",
      values: [email],
    };
    const results = await this.pool.query(query);
    return results.rows.length > 0;
  }

  async verifyUserCredential(email, password) {
    const query = {
      text: "SELECT user_id, password FROM users WHERE email = $1",
      values: [email],
    };
    const result = await this.pool.query(query);
    if (!result.rows.length) return null;

    const { password: hashedPassword } = result.rows[0];
    const match = await bcrypt.compare(password, hashedPassword);
    if (!match) return null;

    return result.rows[0].user_id;
  }

  async getUserById(userId) {
    const query = {
      text: `SELECT u.user_id, u.username, u.email, t.role ,u.avatar_url FROM users u LEFT JOIN team_members t ON u.user_id = t.user_id WHERE u.user_id = $1`,
      values: [userId],
    };
    const results = await this.pool.query(query);
    return results.rows[0];
  }

  async getUserById(userId) {
    const query = {
      text: `
      SELECT 
        u.user_id, 
        u.username, 
        u.email, 
        u.avatar_url,
        t.business_id,
        b.business_name,
        t.role 
      FROM users u 
      LEFT JOIN team_members t ON u.user_id = t.user_id 
      LEFT JOIN businesses b ON t.business_id = b.business_id
      WHERE u.user_id = $1
    `,
      values: [userId],
    };

    const results = await this.pool.query(query);

    return results.rows.length > 0 ? results.rows[0] : null;
  }

  async editUserById({ userId, ...payload }) {
    const updated_at = new Date().toISOString();
    payload.updated_at = updated_at;
    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }
    const fields = Object.keys(payload).filter(
      (key) => payload[key] !== undefined,
    );
    if (fields.length === 0) return null;
    const setClause = fields.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const query = {
      text: `UPDATE users SET ${setClause} WHERE user_id = $${fields.length + 1}
             RETURNING user_id, username, email, avatar_url`,
      values: [...fields.map((key) => payload[key]), userId],
    };
    const results = await this.pool.query(query);
    return results.rows[0];
  }

  // Ambil avatar_url lama sebelum diganti
  async getAvatarUrl(userId) {
    const query = {
      text: `SELECT avatar_url FROM users WHERE user_id = $1`,
      values: [userId],
    };
    const results = await this.pool.query(query);
    return results.rows[0]?.avatar_url || null;
  }

  async getPasswordByUserId(userId) {
    const query = {
      text: `SELECT password FROM users WHERE user_id = $1`,
      values: [userId],
    };
    const results = await this.pool.query(query);
    return results.rows[0]?.password || null;
  }

  async updatePassword({ userId, newPassword }) {
    const updated_at = new Date().toISOString();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const query = {
      text: `UPDATE users
             SET password = $1, updated_at = $2
              WHERE user_id = $3
              RETURNING user_id, username, email, avatar_url`,
      values: [hashedPassword, updated_at, userId],
    };
    const results = await this.pool.query(query);
    return results.rows[0] || null;
  }

  async updateAvatar({ userId, avatarUrl }) {
    const updated_at = new Date().toISOString();
    const query = {
      text: `UPDATE users
             SET avatar_url = $1, updated_at = $2
             WHERE user_id = $3
             RETURNING user_id, username, email, avatar_url`,
      values: [avatarUrl, updated_at, userId],
    };
    const results = await this.pool.query(query);
    return results.rows[0] || null;
  }
}

export default new UserRepositories();
