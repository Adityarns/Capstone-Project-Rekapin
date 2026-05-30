/**
 * ============================================================
 *    REKAPIN — Reports Mock Data
 *    src/data/reportsData.js
 * ============================================================
 */

/* ── Quarter options ── */
const currentYear = new Date().getFullYear();
export const QUARTER_OPTIONS = [
  { value: `Q1-${currentYear}`, label: `Q1 ${currentYear}` },
  { value: `Q2-${currentYear}`, label: `Q2 ${currentYear}` },
  { value: `Q3-${currentYear}`, label: `Q3 ${currentYear}` },
  { value: `Q4-${currentYear}`, label: `Q4 ${currentYear}` },
];

/* ── Summary metric cards ── */
export const reportsSummary = {
  totalRevenue: {
    label: "TOTAL REVENUE",
    value: 124500000,
    change: 12,
    positive: true,
  },
  netIncome: {
    label: "NET INCOME",
    value: 42100000,
    change: 8,
    positive: true,
  },
  carbonFootprint: {
    label: "CARBON FOOTPRINT",
    value: "2.4 tCO2e",
    change: -5,
    onTrack: true,
  },
};

/* ── Cash Flow Overview — grouped bars ── */
export const cashFlowOverviewData = [
  { month: "Jul", inflow: 28000000, outflow: 18000000 },
  { month: "Aug", inflow: 32000000, outflow: 12000000 },
  { month: "Sep", inflow: 38000000, outflow: 16000000 },
  { month: "Oct", inflow: 24000000, outflow: 14000000 },
];

/* ── Revenue Forecast — area chart ── */
export const revenueForecastData = [
  { month: "Jul", revenue: 22 },
  { month: "Aug", revenue: 28 },
  { month: "Sep", revenue: 32 },
  { month: "Oct", revenue: 38 },
  { month: "Nov", revenue: 45 }, // predicted
];

/* ── Income Statement rows ──
 *
 *  type:
 *  "category"  → bold section label (no amounts shown for section headers)
 *  "line"      → indented data row
 *  "subtotal"  → bold totals row
 *  "section"   → section label only (Operating Expenses header)
 *  "total"     → highlighted Net Income row (maroon background)
 * ── */
export const incomeStatementRows = [
  {
    type: "category",
    label: "Revenues",
    q3: 124500000,
    q2: 111000000,
    variance: 12.1,
  },
  {
    type: "line",
    indent: true,
    label: "Cost of Goods Sold",
    q3: -45200000,
    q2: -42000000,
    variance: -7.6,
  },
  {
    type: "subtotal",
    label: "Gross Profit",
    q3: 79300000,
    q2: 69000000,
    variance: 14.9,
  },
  {
    type: "section",
    label: "Operating Expenses",
  },
  {
    type: "line",
    indent: true,
    label: "Salaries and Wages",
    q3: -22000000,
    q2: -22000000,
    variance: 0.0,
  },
  {
    type: "line",
    indent: true,
    label: "Rent Expense",
    q3: -8000000,
    q2: -8000000,
    variance: 0.0,
  },
  {
    type: "line",
    indent: true,
    label: "Utilities",
    q3: -3500000,
    q2: -3200000,
    variance: -9.3,
  },
  {
    type: "line",
    indent: true,
    label: "Other Expenses",
    q3: -3700000,
    q2: -2500000,
    variance: -48.0,
  },
  {
    type: "subtotal",
    label: "Total Operating Expenses",
    q3: -37200000,
    q2: -35700000,
    variance: -4.2,
  },
  {
    type: "total",
    label: "Net Income",
    q3: 42100000,
    q2: 33300000,
    variance: 26.4,
  },
];

/* ── Format helpers ── */

/** Rp 124.5M short format for summary cards */
export function formatRpShort(value) {
  if (value >= 1_000_000_000)
    return `Rp ${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
  return `Rp ${value.toLocaleString("id-ID")}`;
}

/** Accounting format: negative as (45,200,000), positive as 124,500,000 */
export function formatAccounting(value) {
  if (value === undefined || value === null) return "";
  const abs = Math.abs(value).toLocaleString("id-ID");
  return value < 0 ? `(${abs})` : abs;
}

/** Variance: +12.1% or -7.6% */
export function formatVariance(value) {
  if (value === 0 || value === undefined) return "0.0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
