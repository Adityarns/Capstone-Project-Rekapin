import { Pool } from "pg";

class TeamMemberRepositories {
  constructor() {
    this.pool = new Pool();
  }

  async addTeamMember({ businessId, userId, role }) {
    const query = {
      text: `INSERT INTO team_members (business_id, user_id, role)
             VALUES ($1, $2, $3)
             RETURNING id`,
      values: [businessId, userId, role],
    };
    const result = await this.pool.query(query);
    return result.rows[0];
  }
}

export default new TeamMemberRepositories();
