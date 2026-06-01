import { Pool } from "pg";
import { nanoid } from "nanoid";

class TeamMemberRepositories {
  constructor() {
    this.pool = new Pool();
  }

  async addTeamMember({ businessId, userId, role }) {
    const team_member_id = nanoid(16);
    const joined_at = new Date().toISOString();
    const query = {
      text: `INSERT INTO team_members (team_member_id, business_id, user_id, role, joined_at)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING team_member_id`,
      values: [team_member_id, businessId, userId, role, joined_at],
    };
    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async isMember({ businessId, userId }) {
    const query = {
      text: `SELECT team_member_id FROM team_members
             WHERE business_id = $1 AND user_id = $2`,
      values: [businessId, userId],
    };
    const result = await this.pool.query(query);
    return result.rows.length > 0;
  }

  async getTeamMembersById(businessId) {
    const query = {
      text: `SELECT users.user_id, users.username, users.email, team_members.role, users.avatar_url FROM team_members JOIN users ON team_members.user_id = users.user_id WHERE team_members.business_id = $1`,
      values: [businessId],
    };
    const results = await this.pool.query(query);
    return results.rows;
  }

  async deleteTeamMembersById(userId, businessId) {
    const query = {
      text: "DELETE FROM team_members USING users WHERE team_members.user_id = users.user_id AND team_members.user_id = $1 AND team_members.business_id = $2 RETURNING users.username, users.email, team_members.user_id, team_members.role",
      values: [userId, businessId],
    };
    const results = await this.pool.query(query);
    return results.rows[0];
  }

  async createInvitation({ businessId, email, role, inviteCode, expiredAt }) {
    const id = nanoid(16);
    const query = {
      text: `INSERT INTO team_invitations 
             (invitation_id, business_id, email, role, invitation_code, expired_at) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
      values: [id, businessId, email, role, inviteCode, expiredAt],
    };
    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async getInvitationsByEmail(email) {
    const query = {
      text: `
        SELECT 
          ti.invitation_id, 
          ti.business_id, 
          b.business_name, 
          ti.role, 
          ti.invitation_code, 
          ti.expired_at
        FROM team_invitations ti
        JOIN businesses b ON ti.business_id = b.business_id
        WHERE ti.email = $1 AND ti.expired_at > NOW()
      `,
      values: [email],
    };
    const result = await this.pool.query(query);
    return result.rows; // Akan mengembalikan array kosong [] jika tidak ada undangan
  }

  // Perbaiki fungsi delete agar bisa menerima invitation_code
  async deleteInvitationByCode(inviteCode) {
    const query = {
      text: `DELETE FROM team_invitations WHERE invitation_code = $1 RETURNING *`,
      values: [inviteCode],
    };
    const result = await this.pool.query(query);
    return result.rows[0];
  }
}

export default new TeamMemberRepositories();
