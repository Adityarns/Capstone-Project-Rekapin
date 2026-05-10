import { nanoid } from "nanoid";
import { Pool } from "pg";
import bcrypt from "bcrypt";

class UserRepositories {
  constructor() {
    this.pool = new Pool();
  }
  async CreateUser({ name, email, password }) {
    const id = nanoid(16);
    const hashedPassword = await bcrypt.hash(password, 10);
    const created_at = new Date().toISOString();
    const updated_at = created_at;
    const query = {
      text: `INSERT INTO users(user_id, name, email, password, created_at, updated_at) VALUES($1, $2, $3, $4, $5, $6) RETURNING user_id AS id, name, email `,
      values: [id, name, email, hashedPassword, created_at, updated_at],
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
      text: "SELECT user_id AS id, password FROM users WHERE email = $1",
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

    return result.rows[0].id;
  }

  async getUserById(id) {
    const query = {
      text: `SELECT user_id AS id, name, email , created_at FROM users WHERE user_id = $1`,
      values: [id],
    };
    const results = await this.pool.query(query);
    return results.rows[0];
  }
}

export default new UserRepositories();
