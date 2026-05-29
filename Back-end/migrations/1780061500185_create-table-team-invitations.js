/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable("team_invitations", {
    invitation_id: {
      type: "VARCHAR(16)",
      primaryKey: true,
    },
    business_id: {
      type: "VARCHAR(16)",
      notNull: true,
      references: "businesses(business_id)",
      onDelete: "CASCADE",
    },
    email: {
      type: "VARCHAR(255)",
      notNull: true,
    },
    role: {
      type: "VARCHAR(50)",
      notNull: true,
    },
    invitation_code: {
      type: "VARCHAR(255)",
      notNull: true,
    },
    expired_at: {
      type: "TIMESTAMP",
      notNull: true,
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("team_invitations");
};
