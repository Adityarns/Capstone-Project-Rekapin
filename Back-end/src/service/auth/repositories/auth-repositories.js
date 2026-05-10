import { Pool } from "pg";

class AuthenticationsRepositories {
  constructor() {
    this.pool = new Pool();
  }

  async addRefreshToken({ userId, tokenHash, expiresAt }) {
    const query = {
      text: `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
             VALUES ($1, $2, $3)
             RETURNING id`,
      values: [userId, tokenHash, expiresAt],
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
      text: `SELECT id, user_id, is_revoked, expires_at
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

  async deleteAllRefreshTokensByUserId(userId) {
    const query = {
      text: `UPDATE refresh_tokens
             SET is_revoked = TRUE
             WHERE user_id = $1
               AND is_revoked = FALSE`,
      values: [userId],
    };
    await this.pool.query(query);
  }
}

export default new AuthenticationsRepositories();
