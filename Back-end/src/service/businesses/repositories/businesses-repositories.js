import { Pool } from "pg";
import crypto from "crypto";

class BusinessRepositories {
  constructor() {
    this.pool = new Pool();
  }

  // Generate kode undangan unik, contoh: REKAPIN-A3F9
  generateInvitationCode() {
    const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
    return `REKAPIN-${suffix}`;
  }

  async addBusiness({ ownerId, businessName }) {
    const invitationCode = this.generateInvitationCode();
    const query = {
      text: `INSERT INTO businesses (owner_id, business_name, invitation_code)
             VALUES ($1, $2, $3)
             RETURNING id, invitation_code`,
      values: [ownerId, businessName, invitationCode],
    };
    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async editBusinessById({ id, ...payload }) {
    const fields = Object.keys(payload).filter(
      (key) => payload[key] !== undefined,
    );
    if (fields.length === 0) return null;
    const setClause = fields.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const query = {
      text: `UPDATE businesses SET ${setClause} WHERE id = $${fields.length + 1} RETURNING id, business_name`,
      values: [...fields.map((key) => payload[key]), id],
    };
    const results = await this.pool.query(query);
    return results.rows[0];
  }

  async findByInvitationCode(invitationCode) {
    const query = {
      text: `SELECT id FROM businesses WHERE invitation_code = $1`,
      values: [invitationCode],
    };
    const result = await this.pool.query(query);
    return result.rows[0] || null;
  }
}

export default new BusinessRepositories();
