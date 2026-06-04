import { nanoid } from "nanoid";
import { pool } from "../../../config/db.js";

class AuthenticationsRepositories {
  constructor() {
    this.pool = pool;
  }

  async addRefreshToken({ userId, tokenHash, expiresAt }) {
    const refresh_token_id = nanoid(16);
    const query = {
      text: `INSERT INTO refresh_tokens (refresh_token_id, user_id, token_hash, expires_at)
             VALUES ($1, $2, $3, $4)
             RETURNING refresh_token_id`,
      values: [refresh_token_id, userId, tokenHash, expiresAt],
    };
    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async deleteRefreshToken(tokenHash) {
    const query = {
      text: `UPDATE refresh_tokens
             SET is_revoked = TRUE
             WHERE token_hash = $1`,
      values: [tokenHash],
    };
    await this.pool.query(query);
  }

  async verifyRefreshToken(tokenHash) {
    const query = {
      text: `SELECT refresh_token_id, user_id, is_revoked, expires_at
             FROM refresh_tokens
             WHERE token_hash = $1`,
      values: [tokenHash],
    };
    const result = await this.pool.query(query);

    if (!result.rows.length) return false;

    const token = result.rows[0];

    if (token.is_revoked || new Date(token.expires_at) < new Date()) {
      return false;
    }

    return token;
  }
}
export default new AuthenticationsRepositories();
