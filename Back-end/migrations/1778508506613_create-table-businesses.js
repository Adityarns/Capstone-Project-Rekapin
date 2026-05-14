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
  pgm.createTable("businesses", {
    business_id: {
      type: "VARCHAR(50)",
      primaryKey: true,
    },
    owner_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "users(user_id)",
      onDelete: "CASCADE",
    },
    business_name: {
      type: "VARCHAR(255)",
      notNull: true,
    },
    invitation_code: {
      type: "VARCHAR(20)",
      notNull: true,
      unique: true,
    },
    industry: {
      type: "VARCHAR(100)",
    },
    phone_number: {
      type: "VARCHAR(20)",
    },
    address: {
      type: "TEXT",
    },
    created_at: {
      type: "TEXT",
      notNull: true,
    },
    updated_at: {
      type: "TEXT",
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
  pgm.dropTable("businesses");
};
