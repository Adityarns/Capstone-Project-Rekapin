/**
 * ============================================================
 *    REKAPIN — Income Statement Table
 *    src/components/reports/IncomeStatement.jsx
 *
 *    Renders backend data structure or fallback to mock data
 * ============================================================
 */

import {
  incomeStatementRows,
  formatAccounting,
  formatVariance,
} from "../../data/reportsData";
import "./IncomeStatement.css";

/* ── Format Rp with full number, no abbreviation ── */
function formatRpFull(value) {
  if (value === undefined || value === null) return "";
  return value.toLocaleString("id-ID");
}

/* ── Variance cell — colored by sign ── */
function VarianceCell({ value }) {
  if (value === undefined || value === null)
    return <td className="is-td is-td--right" />;

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
        <td className="is-td is-td--right is-td--total">
          {formatAccounting(q3)}
        </td>
        <td className="is-td is-td--right is-td--total">
          {formatAccounting(q2)}
        </td>
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
    indent ? "is-label--indent" : "",
    type === "category" || type === "subtotal" ? "is-label--bold" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <tr className={`is-row ${type === "subtotal" ? "is-row--subtotal" : ""}`}>
      <td className={labelCls}>{label}</td>
      <td className="is-td is-td--right">{formatAccounting(q3)}</td>
      <td className="is-td is-td--right">{formatAccounting(q2)}</td>
      <VarianceCell value={variance} />
    </tr>
  );
}

/* ── Backend data row renderer ── */
function BackendStatementRow({
  label,
  current,
  previous,
  variance,
  type = "line",
  indent = false,
  isBold = false,
  isTotal = false,
}) {
  if (type === "section") {
    return (
      <tr className="is-row is-row--section">
        <td className="is-td is-td--label is-label--section" colSpan={4}>
          {label}
        </td>
      </tr>
    );
  }

  const labelCls = [
    "is-td",
    "is-td--label",
    indent ? "is-label--indent" : "",
    isBold || isTotal ? "is-label--bold" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (isTotal) {
    return (
      <tr className="is-row is-row--total">
        <td className="is-td is-td--label is-label--total">{label}</td>
        <td className="is-td is-td--right is-td--total">
          {formatRpFull(current)}
        </td>
        <td className="is-td is-td--right is-td--total">
          {formatRpFull(previous)}
        </td>
        <td className="is-td is-td--right is-td--total">
          <span className="is-variance is-variance--total">
            {formatVariance(variance)}
          </span>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`is-row ${isBold ? "is-row--subtotal" : ""}`}>
      <td className={labelCls}>{label}</td>
      <td className="is-td is-td--right">{formatRpFull(current)}</td>
      <td className="is-td is-td--right">{formatRpFull(previous)}</td>
      <VarianceCell value={variance} />
    </tr>
  );
}

/* ── Convert backend data to rows ── */
function buildBackendRows(data) {
  if (!data || !data.statement) return [];

  const st = data.statement;
  const rows = [];

  // Revenues
  rows.push({
    type: "category",
    label: "Revenues",
    current: st.revenues?.current,
    previous: st.revenues?.previous,
    variance: st.revenues?.variance,
    isBold: true,
  });

  // COGS
  if (st.cogs && (st.cogs.current !== 0 || st.cogs.previous !== 0)) {
    rows.push({
      type: "line",
      label: "Cost of Goods Sold",
      current: st.cogs.current,
      previous: st.cogs.previous,
      variance: st.cogs.variance,
      indent: true,
    });
  }

  // Gross Profit
  rows.push({
    type: "subtotal",
    label: "Gross Profit",
    current: st.gross_profit?.current,
    previous: st.gross_profit?.previous,
    variance: st.gross_profit?.variance,
    isBold: true,
  });

  // Operating Expenses section
  rows.push({
    type: "section",
    label: "Operating Expenses",
  });

  // Operating Expense items
  const opex = st.operating_expenses || {};

  Object.keys(opex).forEach((categoryName) => {
    const expense = opex[categoryName];

    // Hanya tampilkan jika ada nilainya di kuartal saat ini atau sebelumnya
    if (expense.current !== 0 || expense.previous !== 0) {
      rows.push({
        type: "line",
        label: categoryName, // Label akan langsung memakai nama asli dari database
        current: expense.current,
        previous: expense.previous,
        variance: expense.variance,
        indent: true,
      });
    }
  });

  if (
    opex.utilities &&
    (opex.utilities.current !== 0 || opex.utilities.previous !== 0)
  ) {
    rows.push({
      type: "line",
      label: "Utilities",
      current: opex.utilities.current,
      previous: opex.utilities.previous,
      variance: opex.utilities.variance,
      indent: true,
    });
  }

  if (
    opex.transportation &&
    (opex.transportation.current !== 0 || opex.transportation.previous !== 0)
  ) {
    rows.push({
      type: "line",
      label: "Transportation",
      current: opex.transportation.current,
      previous: opex.transportation.previous,
      variance: opex.transportation.variance,
      indent: true,
    });
  }

  if (
    opex.other_expenses &&
    (opex.other_expenses.current !== 0 || opex.other_expenses.previous !== 0)
  ) {
    rows.push({
      type: "line",
      label: "Other Expenses",
      current: opex.other_expenses.current,
      previous: opex.other_expenses.previous,
      variance: opex.other_expenses.variance,
      indent: true,
    });
  }

  // Total Operating Expenses
  rows.push({
    type: "subtotal",
    label: "Total Operating Expenses",
    current: st.total_operating_expenses?.current,
    previous: st.total_operating_expenses?.previous,
    variance: st.total_operating_expenses?.variance,
    isBold: true,
  });

  // Net Income
  rows.push({
    type: "total",
    label: "Net Income",
    current: st.net_income?.current,
    previous: st.net_income?.previous,
    variance: st.net_income?.variance,
    isTotal: true,
  });

  return rows;
}

/* ── Main component ── */
export default function IncomeStatement({
  data = null,
  currentPeriod = "Q3 2023",
  previousPeriod = "Q2 2023",
}) {
  const useBackendData = data && data.statement;
  const rows = useBackendData ? buildBackendRows(data) : incomeStatementRows;

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
            {rows.map((row, idx) => {
              if (useBackendData) {
                return (
                  <BackendStatementRow
                    key={`${row.type}-${idx}`}
                    label={row.label}
                    current={row.current}
                    previous={row.previous}
                    variance={row.variance}
                    type={row.type}
                    indent={row.indent}
                    isBold={row.isBold}
                    isTotal={row.isTotal}
                  />
                );
              } else {
                return <StatementRow key={`${row.type}-${idx}`} row={row} />;
              }
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
