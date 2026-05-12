import { nanoid } from "nanoid";
import { Pool } from "pg";
import bcrypt from "bcrypt";

class UserRepositories {
  constructor() {
    this.pool = new Pool();
  }
  async addUser({ username, businessName, invitationCode, email, password }) {
    const user_id = nanoid(16);
    const created_at = new Date().toISOString();
    const updated_at = created_at;
    const query = {
      text: `INSERT INTO users(user_id, username, email, password, created_at, updated_at) VALUES($1, $2, $3, $4, $5, $6) RETURNING user_id, username, email `,
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

    if (!result.rows.length) {
      return null;
    }
    const { password: hashedPassword } = result.rows[0];
    const match = await bcrypt.compare(password, hashedPassword);
    if (!match) {
      return null;
    }

    return result.rows[0].user_id;
  }

  async getUserById(user_id) {
    const query = {
      text: `SELECT user_id, username, email, created_at FROM users WHERE user_id = $1`,
      values: [user_id],
    };
    const results = await this.pool.query(query);
    return results.rows[0];
  }
}

export default new UserRepositories();
