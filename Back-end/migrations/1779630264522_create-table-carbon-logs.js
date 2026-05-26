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
  pgm.createTable("carbon_logs", {
    carbon_log_id: {
      type: "varchar(16)",
      primaryKey: true,
    },
    business_id: {
      type: "varchar(16)",
      notNull: true,
      references: "businesses",
      onDelete: "cascade",
    },
    user_id: {
      type: "varchar(16)",
      notNull: true,
      references: "users",
      onDelete: "cascade",
    },
    transaction_id: {
      type: "varchar(16)",
      notNull: true,
      references: "transactions",
      onDelete: "cascade",
    },
    log_date: {
      type: "VARCHAR(50)",
      notNull: true,
    },
    category: {
      type: "varchar(50)",
      notNull: true,
    },
    quantity: {
      type: "INT",
      notNull: true,
    },
    carbon_total: {
      type: "DOUBLE PRECISION",
      notNull: true,
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
  pgm.dropTable("carbon_logs");
};
