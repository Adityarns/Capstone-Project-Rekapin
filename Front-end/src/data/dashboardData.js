/**
 * ============================================================
 *    REKAPIN — Dashboard Mock Data
 *    src/data/dashboardData.js
 *
 *    Data statis untuk development UI.
 *    Ganti dengan real API call saat integrasi backend.
 * ============================================================
 * @format
 */

export const summaryData = {
  totalIncome: {
    label: "TOTAL INCOME",
    value: 24500000,
    change: +12,
    trend: "up",
  },
  totalExpense: {
    label: "TOTAL EXPENSE",
    value: 18200000,
    change: +5,
    trend: "up",
  },
  netCashFlow: {
    label: "NET CASH FLOW",
    value: 6300000,
    change: null,
    trend: "up",
  },
  carbonFootprint: {
    label: "CARBON FOOTPRINT",
    value: 1.2,
    unit: "tons",
    change: -8,
    changeLabel: "vs last mo",
    trend: "down",
  },
};

export const cashFlowData = [
  { month: "Mar", income: 18500000, expense: 14200000 },
  { month: "Apr", income: 21000000, expense: 16800000 },
  { month: "May", income: 19800000, expense: 15600000 },
  { month: "Jun", income: 23500000, expense: 17900000 },
  { month: "Jul", income: 17200000, expense: 13400000 },
  { month: "Aug", income: 22100000, expense: 16500000 },
  { month: "Sep", income: 25800000, expense: 19200000 },
  { month: "Oct", income: 24500000, expense: 18200000 },
];

export const aiInsight = {
  type: "warning",
  title: "Expense Warning",
  message:
    "Your utility costs are 15% higher than last month. Consider reviewing energy usage for potential savings.",
  action: "View Analysis",
  actionHref: "/reports",
};

export const sustainabilityData = {
  score: 84,
  maxScore: 100,
  label: "Excellent",
  description:
    "You are performing 12% better than similar MSMEs in your region.",
};

export const quickTip = {
  message: "You have a surplus; pay suppliers early for a 2% discount.",
};

export const recentTransactions = [
  {
    id: "TRX-001",
    name: "Supplier Payment",
    category: "Operations",
    amount: -2500000,
    date: "2023-10-24",
  },
  {
    id: "TRX-002",
    name: "Client Invoice #88",
    category: "Sales",
    amount: +8400000,
    date: "2023-10-23",
  },
  {
    id: "TRX-003",
    name: "Monthly Office Rent",
    category: "Rent",
    amount: -5000000,
    date: "2023-10-20",
  },
  {
    id: "TRX-004",
    name: "Equipment Purchase",
    category: "Operations",
    amount: -3200000,
    date: "2023-10-18",
  },
  {
    id: "TRX-005",
    name: "Freelance Service",
    category: "Sales",
    amount: +4750000,
    date: "2023-10-17",
  },
];

/* ── Helpers ── */
export function formatRupiah(amount, compact = false) {
  const abs = Math.abs(amount);
  if (compact) {
    if (abs >= 1_000_000) return `Rp ${(abs / 1_000_000).toFixed(1)}jt`;
    if (abs >= 1_000) return `Rp ${(abs / 1_000).toFixed(0)}rb`;
    return `Rp ${abs}`;
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(abs);
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const categoryConfig = {
  Operations: {
    bg: "var(--color-neutral-200)",
    text: "var(--color-neutral-700)",
  },
  Sales: { bg: "var(--color-accent-100)", text: "var(--color-accent-700)" },
  Rent: { bg: "var(--color-primary-100)", text: "var(--color-primary-700)" },
  Utilities: { bg: "var(--color-warning-light)", text: "var(--color-warning)" },
  Other: { bg: "var(--color-neutral-100)", text: "var(--color-neutral-600)" },
};
