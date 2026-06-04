import { nanoid } from "nanoid";
import { pool } from "../../../config/db.js";
import bcrypt from "bcrypt";

class UserRepositories {
  constructor() {
    this.pool = pool;
  }

  normalizeEmail(email) {
    return String(email || "")
      .trim()
      .toLowerCase();
  }

  async addUser({ username, email, password }) {
    const normalizedEmail = this.normalizeEmail(email);
    const user_id = nanoid(16);
    const created_at = new Date().toISOString();
    const updated_at = created_at;
    const query = {
      text: `INSERT INTO users(user_id, username, email, password, created_at, updated_at)
             VALUES($1, $2, $3, $4, $5, $6)
             RETURNING user_id, username, email`,
      values: [
        user_id,
        username,
        normalizedEmail,
        password,
        created_at,
        updated_at,
      ],
    };
    const results = await this.pool.query(query);
    return results.rows[0];
  }

  async verifyEmail(email) {
    const normalizedEmail = this.normalizeEmail(email);
    const query = {
      text: "SELECT user_id FROM users WHERE email = $1",
      values: [normalizedEmail],
    };
    const results = await this.pool.query(query);
    return results.rows.length > 0;
  }

  async verifyUserCredential(email, password) {
    const normalizedEmail = this.normalizeEmail(email);
    const query = {
      // 1. Tambahkan user_id ke dalam perintah SELECT
      text: "SELECT user_id, email, password FROM users WHERE email = $1",
      values: [normalizedEmail],
    };

    const result = await this.pool.query(query);

    // 2. Cara yang benar untuk mengecek apakah email tidak ditemukan
    if (result.rows.length === 0) {
      return null; // Biarkan Controller yang menangani lemparan Error-nya
    }

    const { password: hashedPassword, user_id } = result.rows[0];

    // 3. Bandingkan kata sandi
    const match = await bcrypt.compare(password, hashedPassword);
    if (!match) {
      return null;
    }

    // 4. Kembalikan user_id yang sekarang sudah valid
    return user_id;
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
    // Jika tidak ada hasil, kembalikan objek minimal agar tidak error
    return results.rows[0] || null;
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
