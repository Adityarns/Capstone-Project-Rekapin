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

  async getBusinessById(businessId) {
    const query = {
      text: `SELECT business_id, owner_id, business_name, industry, phone_number, address, modal FROM businesses WHERE business_id = $1`,
      values: [businessId],
    };
    const results = await this.pool.query(query);
    return results.rows[0];
  }

  async checkBusinessModal(businessId) {
    const query = {
      text: `SELECT modal FROM businesses WHERE business_id = $1`,
      values: [businessId],
    };
    const results = await this.pool.query(query);
    return results.rows[0] ? results.rows[0].modal : null;
  }

  async editBusinessById({ businessId, ...payload }) {
    const updated_at = new Date().toISOString();
    payload.updated_at = updated_at;
    const fields = Object.keys(payload).filter(
      (key) => payload[key] !== undefined,
    );
    if (fields.length === 0) return null;
    const setClause = fields.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const query = {
      text: `UPDATE businesses SET ${setClause} WHERE business_id = $${fields.length + 1} RETURNING business_name, industry, phone_number, address, modal`,
      values: [...fields.map((key) => payload[key]), businessId],
    };
    const results = await this.pool.query(query);
    return results.rows[0];
  }

  async findByInvitationCode(invitationCode) {
    const query = {
      text: `SELECT business_id, business_name FROM businesses WHERE invitation_code = $1`,
      values: [invitationCode],
    };
    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async findBusinessIdByUserId(userId) {
    const query = {
      text: `SELECT business_id FROM businesses WHERE owner_id = $1
             UNION
             SELECT business_id FROM team_members WHERE user_id = $1
             LIMIT 1`,
      values: [userId],
    };
    const result = await this.pool.query(query);
    return result.rows[0]; // Mengembalikan objek { business_id: "..." } atau undefined
  }

  async verifyBusinessAccess(userId, businessId) {
    const query = {
      text: `SELECT 1 FROM businesses 
           WHERE business_id = $1 AND owner_id = $2
           UNION
           SELECT 1 FROM team_members
           WHERE business_id = $1 AND user_id = $2`,
      values: [businessId, userId],
    };

    const result = await this.pool.query(query);
    return result.rows.length > 0;
  }

  async getBusinessProfileById(businessId) {
    const query = {
      text: `SELECT business_name, invitation_code FROM businesses WHERE business_id = $1`,
      values: [businessId],
    };
    const result = await this.pool.query(query);
    return result.rows[0];
  }

  // ============================================================
  // WORKSPACE SELECTION: Tarik semua bisnis milik user (Owner & Employee)
  // ============================================================
  async getAccessibleBusinesses(userId) {
    const query = {
      text: `
        SELECT b.business_id, b.business_name, 'owner' AS role
        FROM businesses b
        WHERE b.owner_id = $1
        
        UNION
        
        SELECT b.business_id, b.business_name, tm.role
        FROM team_members tm
        JOIN businesses b ON tm.business_id = b.business_id
        WHERE tm.user_id = $1
      `,
      values: [userId],
    };

    const result = await this.pool.query(query);
    return result.rows;
  }
}

export default new BusinessRepositories();
