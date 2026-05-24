/**
 * ============================================================
 *    REKAPIN — Income Statement Table
 *    src/components/reports/IncomeStatement.jsx
 *
 *    Row types:
 *    "category" → bold, no indent (Revenues, Gross Profit)
 *    "section"  → label only, no amounts (Operating Expenses)
 *    "line"     → indented data row
 *    "subtotal" → bold totals row (Total Operating Expenses)
 *    "total"    → highlighted maroon row (Net Income)
 * ============================================================
 */

import {
  incomeStatementRows,
  formatAccounting,
  formatVariance,
} from "../../data/reportsData";
import "./IncomeStatement.css";

/* ── Variance cell — colored by sign ── */
function VarianceCell({ value }) {
  if (value === undefined || value === null) return <td className="is-td is-td--right" />;

  const cls =
    value > 0
      ? "is-variance is-variance--positive"
      : value < 0
      ? "is-variance is-variance--negative"
      : "is-variance is-variance--neutral";

  return (
    <td className="is-td is-td--right">
      <span className={cls}>{formatVariance(value)}</span>
    </td>
  );
}

/* ── Single row renderer ── */
function StatementRow({ row }) {
  const { type, label, indent, q3, q2, variance } = row;

  /* "section" rows — label only, no amounts, no variance */
  if (type === "section") {
    return (
      <tr className="is-row is-row--section">
        <td className="is-td is-td--label is-label--section" colSpan={4}>
          {label}
        </td>
      </tr>
    );
  }

  /* "total" row — Net Income highlight */
  if (type === "total") {
    return (
      <tr className="is-row is-row--total">
        <td className="is-td is-td--label is-label--total">{label}</td>
        <td className="is-td is-td--right is-td--total">{formatAccounting(q3)}</td>
        <td className="is-td is-td--right is-td--total">{formatAccounting(q2)}</td>
        <td className="is-td is-td--right is-td--total">
          <span className="is-variance is-variance--total">
            {formatVariance(variance)}
          </span>
        </td>
      </tr>
    );
  }

  /* Standard rows */
  const labelCls = [
    "is-td",
    "is-td--label",
    indent   ? "is-label--indent"  : "",
    type === "category" || type === "subtotal" ? "is-label--bold" : "",
  ].filter(Boolean).join(" ");

  return (
    <tr className={`is-row ${type === "subtotal" ? "is-row--subtotal" : ""}`}>
      <td className={labelCls}>{label}</td>
      <td className="is-td is-td--right">{formatAccounting(q3)}</td>
      <td className="is-td is-td--right">{formatAccounting(q2)}</td>
      <VarianceCell value={variance} />
    </tr>
  );
}

/* ── Main component ── */
export default function IncomeStatement({ currentPeriod = "Q3 2023", previousPeriod = "Q2 2023" }) {
  return (
    <div className="is-card">

      {/* Card header */}
      <div className="is-card__header">
        <div>
          <h3 className="is-card__title">Income Statement</h3>
          <p className="is-card__subtitle">SAK EMKM Standard Format</p>
        </div>
      </div>

      {/* Scrollable table wrapper */}
      <div className="is-table-wrap">
        <table className="is-table">
          <thead>
            <tr>
              <th className="is-th is-th--desc">Account Description</th>
              <th className="is-th is-th--right">{currentPeriod} (Rp)</th>
              <th className="is-th is-th--right">{previousPeriod} (Rp)</th>
              <th className="is-th is-th--right">Variance</th>
            </tr>
          </thead>
          <tbody>
            {incomeStatementRows.map((row, idx) => (
              <StatementRow key={`${row.type}-${idx}`} row={row} />
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}