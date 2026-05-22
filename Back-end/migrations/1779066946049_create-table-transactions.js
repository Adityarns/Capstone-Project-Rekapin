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
  pgm.createTable("transactions", {
    transaction_id: {
      type: "VARCHAR(16)",
      primaryKey: true,
    },
    transaction_title: {
      type: "VARCHAR(50)",
      notNull: true,
    },
    amount: {
      type: "DECIMAL(14,2)",
      notNull: true,
    },
    transaction_date: {
      type: "VARCHAR(50)",
      notNull: true,
    },
    transaction_type: {
      type: "VARCHAR(50)",
      notNull: true,
    },
    descriptions: {
      type: "VARCHAR(50)",
      notNull: true,
    },
    user_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "users(user_id)",
      onDelete: "CASCADE",
    },
    business_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "businesses(business_id)",
      onDelete: "CASCADE",
    },
    category_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "transaction_categories(transaction_categories_id)",
      onDelete: "CASCADE",
    },
    quantity: {
      type: "INT",
    },
    update_at: {
      type: "VARCHAR(50)",
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
  pgm.dropTable("transactions");
};
