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

/* ── Rupiah formatter ── */
export function formatRupiah(amount) {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("id-ID").format(abs);
  return amount >= 0 ? `+ Rp ${formatted}` : `- Rp ${formatted}`;
}

/* ── Category badge colors ── */
export const categoryConfig = {
  Operations:     { bg: "#FDE8E8", text: "#C45858" },
  Sales:          { bg: "#DCFCE7", text: "#166534" },
  Rent:           { bg: "#F3E8FD", text: "#7B2D8B" },
  Utilities:      { bg: "#DBEAFE", text: "#1D4ED8" },
  Marketing:      { bg: "#FEF3C7", text: "#B45309" },
  Salary:         { bg: "#FFF7ED", text: "#C2410C" },
  Transportation: { bg: "#CCFBF1", text: "#0F766E" },
  Other:          { bg: "#F3F4F6", text: "#6B7280" },
};

/* ── All Transactions (50 rows) ── */
export const allTransactionsData = [
  /* ── Page 1 (1–10) ─────────────────────────────────────── */
  { id: 1,  name: "Supplier Payment: Green Paper Co.",  category: "Operations",     amount: -2500000,  date: "Oct 24, 2023", status: "Completed" },
  { id: 2,  name: "Client Invoice #88",                 category: "Sales",          amount:  8400000,  date: "Oct 23, 2023", status: "Completed" },
  { id: 3,  name: "Monthly Office Rent",                category: "Rent",           amount: -5000000,  date: "Oct 20, 2023", status: "Completed" },
  { id: 4,  name: "Internet & Cloud Services",          category: "Utilities",      amount: -1200000,  date: "Oct 19, 2023", status: "Pending"   },
  { id: 5,  name: "Workshop Material Sales",            category: "Sales",          amount:  3250000,  date: "Oct 18, 2023", status: "Completed" },
  { id: 6,  name: "Staff Salary — October",             category: "Salary",         amount: -12000000, date: "Oct 17, 2023", status: "Completed" },
  { id: 7,  name: "Digital Marketing Campaign",         category: "Marketing",      amount: -1800000,  date: "Oct 15, 2023", status: "Completed" },
  { id: 8,  name: "Client Invoice #87",                 category: "Sales",          amount:  6750000,  date: "Oct 14, 2023", status: "Completed" },
  { id: 9,  name: "Office Supply Restock",              category: "Operations",     amount: -450000,   date: "Oct 12, 2023", status: "Completed" },
  { id: 10, name: "Vehicle Fuel & Maintenance",         category: "Transportation", amount: -320000,   date: "Oct 11, 2023", status: "Completed" },

  /* ── Page 2 (11–20) ────────────────────────────────────── */
  { id: 11, name: "Client Invoice #86",                 category: "Sales",          amount:  5100000,  date: "Oct 10, 2023", status: "Pending"   },
  { id: 12, name: "Electricity Bill — October",         category: "Utilities",      amount: -890000,   date: "Oct 9, 2023",  status: "Completed" },
  { id: 13, name: "Freelancer Payment — Design",        category: "Operations",     amount: -2200000,  date: "Oct 8, 2023",  status: "Completed" },
  { id: 14, name: "Retail Product Sales — Week 1",      category: "Sales",          amount:  9800000,  date: "Oct 7, 2023",  status: "Completed" },
  { id: 15, name: "Courier & Shipping Fees",            category: "Transportation", amount: -275000,   date: "Oct 6, 2023",  status: "Completed" },
  { id: 16, name: "Google Ads — October",               category: "Marketing",      amount: -950000,   date: "Oct 5, 2023",  status: "Completed" },
  { id: 17, name: "Water & Sanitation Bill",            category: "Utilities",      amount: -320000,   date: "Oct 4, 2023",  status: "Completed" },
  { id: 18, name: "Client Invoice #85",                 category: "Sales",          amount:  4200000,  date: "Oct 3, 2023",  status: "Completed" },
  { id: 19, name: "Warehouse Storage Rent",             category: "Rent",           amount: -3500000,  date: "Oct 1, 2023",  status: "Completed" },
  { id: 20, name: "Team Training & Workshop",           category: "Operations",     amount: -1500000,  date: "Sep 30, 2023", status: "Completed" },

  /* ── Page 3 (21–30) ────────────────────────────────────── */
  { id: 21, name: "Client Invoice #84",                 category: "Sales",          amount:  7300000,  date: "Sep 28, 2023", status: "Completed" },
  { id: 22, name: "Printer Ink & Stationery",           category: "Operations",     amount: -350000,   date: "Sep 27, 2023", status: "Completed" },
  { id: 23, name: "Staff Salary — September",           category: "Salary",         amount: -12000000, date: "Sep 25, 2023", status: "Completed" },
  { id: 24, name: "Instagram Ads Campaign",             category: "Marketing",      amount: -1200000,  date: "Sep 24, 2023", status: "Pending"   },
  { id: 25, name: "Client Invoice #83",                 category: "Sales",          amount:  5500000,  date: "Sep 22, 2023", status: "Completed" },
  { id: 26, name: "Office Rent — September",            category: "Rent",           amount: -5000000,  date: "Sep 20, 2023", status: "Completed" },
  { id: 27, name: "Software Subscription (SaaS)",       category: "Utilities",      amount: -780000,   date: "Sep 19, 2023", status: "Completed" },
  { id: 28, name: "Bulk Raw Material Purchase",         category: "Operations",     amount: -4800000,  date: "Sep 18, 2023", status: "Completed" },
  { id: 29, name: "Client Invoice #82",                 category: "Sales",          amount:  3900000,  date: "Sep 16, 2023", status: "Completed" },
  { id: 30, name: "Delivery Truck Rental",              category: "Transportation", amount: -600000,   date: "Sep 15, 2023", status: "Completed" },

  /* ── Page 4 (31–40) ────────────────────────────────────── */
  { id: 31, name: "Product Launch Event",               category: "Marketing",      amount: -2500000,  date: "Sep 14, 2023", status: "Completed" },
  { id: 32, name: "Client Invoice #81",                 category: "Sales",          amount:  6100000,  date: "Sep 12, 2023", status: "Completed" },
  { id: 33, name: "HVAC Maintenance",                   category: "Operations",     amount: -750000,   date: "Sep 11, 2023", status: "Completed" },
  { id: 34, name: "Internet Service — September",       category: "Utilities",      amount: -450000,   date: "Sep 10, 2023", status: "Completed" },
  { id: 35, name: "Client Invoice #80",                 category: "Sales",          amount:  8900000,  date: "Sep 8, 2023",  status: "Pending"   },
  { id: 36, name: "Employee Health Insurance",          category: "Salary",         amount: -2100000,  date: "Sep 7, 2023",  status: "Completed" },
  { id: 37, name: "Grab for Business — Rides",          category: "Transportation", amount: -420000,   date: "Sep 6, 2023",  status: "Completed" },
  { id: 38, name: "Annual License Renewal",             category: "Operations",     amount: -1350000,  date: "Sep 5, 2023",  status: "Completed" },
  { id: 39, name: "Client Invoice #79",                 category: "Sales",          amount:  4500000,  date: "Sep 3, 2023",  status: "Completed" },
  { id: 40, name: "Meeting Room Rental",                category: "Rent",           amount: -800000,   date: "Sep 1, 2023",  status: "Completed" },

  /* ── Page 5 (41–50) ────────────────────────────────────── */
  { id: 41, name: "Client Invoice #78",                 category: "Sales",          amount:  7200000,  date: "Aug 30, 2023", status: "Completed" },
  { id: 42, name: "Office Cleaning Service",            category: "Operations",     amount: -550000,   date: "Aug 28, 2023", status: "Completed" },
  { id: 43, name: "Staff Salary — August",              category: "Salary",         amount: -12000000, date: "Aug 25, 2023", status: "Completed" },
  { id: 44, name: "SEO & Content Marketing",            category: "Marketing",      amount: -1600000,  date: "Aug 24, 2023", status: "Completed" },
  { id: 45, name: "Client Invoice #77",                 category: "Sales",          amount:  5800000,  date: "Aug 22, 2023", status: "Completed" },
  { id: 46, name: "Office Rent — August",               category: "Rent",           amount: -5000000,  date: "Aug 20, 2023", status: "Completed" },
  { id: 47, name: "Electricity Bill — August",          category: "Utilities",      amount: -950000,   date: "Aug 18, 2023", status: "Completed" },
  { id: 48, name: "Packaging Material Purchase",        category: "Operations",     amount: -1100000,  date: "Aug 16, 2023", status: "Completed" },
  { id: 49, name: "Client Invoice #76",                 category: "Sales",          amount:  3600000,  date: "Aug 14, 2023", status: "Completed" },
  { id: 50, name: "Airport Taxi — Business Trip",       category: "Transportation", amount: -280000,   date: "Aug 12, 2023", status: "Completed" },
];