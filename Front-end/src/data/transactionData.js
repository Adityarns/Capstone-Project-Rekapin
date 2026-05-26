/**
 * ============================================================
 *    REKAPIN — Transaction Page Data
 *    src/data/transactionData.js
 * ============================================================
 *
 * @format
 */

/* ── Categories per transaction type ── */
export const expenseCategories = [
  "Operations",
  "Rent",
  "Utilities",
  "Marketing",
  "Salary",
  "Transportation",
  "Inventory",
  "Electricity",
  "Fuel",
  "Other Expense",
];

export const incomeCategories = [
  "Sales",
  "Services",
  "Investment",
  "Subscription",
  "Other Income",
];

/* ── AI Assistant panel content ── */
export const aiFeatures = [
  "Reduces manual data entry",
  "Improves category accuracy",
  "Flags potential carbon impacts",
];

export const aiCarbonNote =
  "Transactions categorized accurately help improve your overall carbon tracking score.";

/* ── Title placeholders per type ── */
export const titlePlaceholders = {
  expense: [
    "e.g. Electricity Bill May",
    "e.g. Supplier Payment",
    "e.g. Monthly Office Rent",
  ],
  income: [
    "e.g. Product Sales Batch A",
    "e.g. Client Invoice #88",
    "e.g. Service Fee — October",
  ],
};
