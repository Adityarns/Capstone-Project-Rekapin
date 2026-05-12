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
  pgm.createTable("refresh_tokens", {
    refresh_token_id: {
      type: "VARCHAR(50)",
      primaryKey: true,
    },
    user_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "users(user_id)",
      onDelete: "CASCADE",
    },
    token_hash: {
      type: "TEXT",
      notNull: true,
      unique: true,
    },
    expires_at: {
      type: "TIMESTAMPTZ",
      notNull: true,
    },
    is_revoked: {
      type: "BOOLEAN",
      notNull: true,
      default: false,
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("refresh_tokens");
};
