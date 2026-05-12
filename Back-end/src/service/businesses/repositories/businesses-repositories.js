import { Pool } from "pg";
import { nanoid } from "nanoid";

class BusinessRepositories {
  constructor() {
    this.pool = new Pool();
  }

  async addBusiness({ ownerId, businessName, invitationCode }) {
    const business_id = nanoid(16);
    const created_at = new Date().toISOString();
    const updated_at = created_at;
    const query = {
      text: `INSERT INTO businesses (business_id, owner_id, business_name, invitation_code, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING business_id, invitation_code`,
      values: [
        business_id,
        ownerId,
        businessName,
        invitationCode,
        created_at,
        updated_at,
      ],
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
      text: `UPDATE businesses SET ${setClause} WHERE business_id = $${fields.length + 1} RETURNING business_id, business_name`,
      values: [...fields.map((key) => payload[key]), id],
    };
    const results = await this.pool.query(query);
    return results.rows[0];
  }

  async findByInvitationCode(invitationCode) {
    const query = {
      text: `SELECT business_id FROM businesses WHERE invitation_code = $1`,
      values: [invitationCode],
    };
    const result = await this.pool.query(query);
    return result.rows[0] || null;
  }
}

export default new BusinessRepositories();
