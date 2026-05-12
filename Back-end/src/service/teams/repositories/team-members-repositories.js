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
}

export default new TeamMemberRepositories();
