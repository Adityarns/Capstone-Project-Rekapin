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
  pgm.createTable("transaction_categories", {
    transaction_categories_id: {
      type: "VARCHAR(16)",
      primaryKey: true,
    },
    category_name: {
      type: "VARCHAR(50)",
      notNull: true,
    },
    carbon_factor: {
      type: "VARCHAR(50)",
    },
    carbon_unit: {
      type: "VARCHAR(50)",
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("transaction_categories");
};
