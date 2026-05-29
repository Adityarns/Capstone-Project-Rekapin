/**
 * ============================================================
 *    REKAPIN — Carbon Tracking Mock Data
 *    src/data/carbonData.js
 * ============================================================
 */

/* ── Summary metrics ── */
export const carbonSummary = {
  totalFootprint: {
    value:    2.4,
    unit:     "tCO2e",
    change:   -8,
    positive: true,    /* decrease = good */
    period:   "vs last month",
  },
  sustainabilityScore: {
    score:       84,
    maxScore:    100,
    target:      90,
    label:       "Excellent",
    change:      6,
    description: "Performing 12% better than similar MSMEs in your region.",
  },
  carbonBreakdown: [
    {
      id:          "electricity",
      label:       "Electricity",
      value:       1.44,
      percentage:  60,
      unit:        "tCO2e",
      color:       "var(--color-primary-600)",
    },
    {
      id:          "transportation",
      label:       "Transportation",
      value:       0.96,
      percentage:  40,
      unit:        "tCO2e",
      note:        "Includes fuel",
      color:       "var(--color-accent-500)",
    },
  ],
};

/* ── Monthly trend (for sparkline / future chart) ── */
export const carbonTrendData = [
  { month: "Jun", value: 3.2 },
  { month: "Jul", value: 2.9 },
  { month: "Aug", value: 2.7 },
  { month: "Sep", value: 2.6 },
  { month: "Oct", value: 2.4 },
];

/* ── Green Insights — static demo, no AI/ML yet ── */
export const greenInsights = [
  {
    id:          "insight-1",
    emoji:       "⚡",
    title:       "Optimize Off-Peak Usage",
    description:
      "Shifting 30% of electricity usage to off-peak hours (10PM–6AM) could reduce your energy carbon footprint by up to 18%.",
    impact:      "High Impact",
    impactLevel: "high",
    category:    "Electricity",
    saving:      "0.26 tCO2e / mo",
  },
  {
    id:          "insight-2",
    emoji:       "🚚",
    title:       "Route Consolidation",
    description:
      "Combining delivery routes and optimizing logistics scheduling could cut transportation emissions by up to 22%.",
    impact:      "Medium Impact",
    impactLevel: "medium",
    category:    "Transportation",
    saving:      "0.21 tCO2e / mo",
  },
  {
    id:          "insight-3",
    emoji:       "♻️",
    title:       "Waste Diversion Program",
    description:
      "Implementing proper waste segregation and partnering with certified recyclers can help reduce scope 3 emissions significantly.",
    impact:      "Medium Impact",
    impactLevel: "medium",
    category:    "Operations",
    saving:      "0.15 tCO2e / mo",
  },
];