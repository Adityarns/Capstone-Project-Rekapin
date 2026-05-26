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
  pgm.createTable("carbon_goals", {
    carbon_goal_id: {
      type: "varchar(16)",
      primaryKey: true,
    },
    business_id: {
      type: "varchar(16)",
      notNull: true,
      references: "businesses",
      onDelete: "cascade",
    },
    target_carbon_reduction: {
      type: "DOUBLE PRECISION",
      notNull: true,
    },
    period_start: {
      type: "VARCHAR(50)",
      notNull: true,
    },
    period_end: {
      type: "VARCHAR(50)",
      notNull: true,
    },
    is_active: {
      type: "BOOLEAN",
      notNull: true,
      default: true,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("carbon_goals");
};
