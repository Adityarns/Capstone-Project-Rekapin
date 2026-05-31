/**
 * ============================================================
 *    REKAPIN — Dashboard Mock Data
 *    src/data/dashboardData.js
 * ============================================================
 *
 * @format
 */

/* ── Summary Cards ── */
export const summaryData = {
  totalIncome: {
    value: 24500000,
    change: 12,
    positive: true,
  },
  totalExpense: {
    value: 18200000,
    change: 5,
    positive: false,
  },
  netCashFlow: {
    value: 6300000,
    change: 3.2,
    positive: true,
  },
  carbonFootprint: {
    value: 1.2,
    unit: "tons",
    change: -8,
    positive: true,
  },
};

/* ── Cash Flow Chart ── */
export const cashFlowData = [
  { month: "Apr", income: 16500000, expense: 13200000 },
  { month: "Mei", income: 19800000, expense: 14800000 },
  { month: "Jun", income: 17200000, expense: 15600000 },
  { month: "Jul", income: 22100000, expense: 13900000 },
  { month: "Agu", income: 14300000, expense: 16200000 },
  { month: "Sep", income: 20600000, expense: 15100000 },
  { month: "Okt", income: 24500000, expense: 18200000 },
  { month: "Nov", income: 21800000, expense: 16700000 },
];

/* ── AI Insight ── */
export const aiInsight = {
  type: "warning",
  title: "AI INSIGHT",
  message:
    "Expense Warning: Your utility costs are 15% higher than last month. Consider reviewing energy usage for potential savings.",
  action: "View Analysis",
};

/* ── Sustainability Score ── */
export const sustainabilityData = {
  score: 84,
  maxScore: 100,
  label: "Excellent",
  description:
    "You are performing 12% better than similar MSMEs in your region.",
};

/* ── Quick Tip ── */
export const quickTip = {
  message: "You have a surplus; pay suppliers early for a 2% discount.",
};

/* ── Recent Transactions ── */
export const recentTransactions = [
  {
    id: "txn-001",
    name: "Supplier Payment",
    category: "Operations",
    amount: -2500000,
    date: "Oct 24, 2023",
  },
  {
    id: "txn-002",
    name: "Client Invoice #88",
    category: "Sales",
    amount: 8400000,
    date: "Oct 23, 2023",
  },
  {
    id: "txn-003",
    name: "Monthly Office Rent",
    category: "Rent",
    amount: -5000000,
    date: "Oct 20, 2023",
  },
  {
    id: "txn-004",
    name: "Electricity Bill",
    category: "Utilities",
    amount: -850000,
    date: "Oct 19, 2023",
  },
  {
    id: "txn-005",
    name: "Product Sales — Batch 12",
    category: "Sales",
    amount: 14200000,
    date: "Oct 18, 2023",
  },
];

/* ── Category Config (badge colors) ── */
export const categoryConfig = {
  Operations: {
    bg: "var(--color-neutral-200)",
    text: "var(--color-neutral-700)",
  },
  Sales: { bg: "var(--color-accent-100)", text: "var(--color-accent-700)" },
  Rent: { bg: "var(--color-warning-light)", text: "var(--color-warning)" },
  Utilities: { bg: "var(--color-info-light)", text: "var(--color-info)" },
  Other: { bg: "var(--color-neutral-100)", text: "var(--color-neutral-600)" },
};

/* ── Format Helpers ── */
export function formatRupiah(amount) {
  const abs = Math.abs(amount);
  const prefix = amount < 0 ? "- Rp " : "+ Rp ";
  return `${prefix}${abs.toLocaleString("id-ID")}`;
}

// Versi penuh untuk summary cards dashboard (tidak disingkat)
export function formatRupiahFull(amount) {
  const abs = Math.abs(amount);
  return `Rp ${abs.toLocaleString("id-ID")}`;
}

// Versi singkat untuk summary cards (tanpa prefix +/-)
export function formatRupiahShort(amount) {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return `Rp ${(abs / 1_000_000).toFixed(1)} jt`;
  }
  return `Rp ${abs.toLocaleString("id-ID")}`;
}
