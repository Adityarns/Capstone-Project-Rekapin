/**
 * ============================================================
 * REKAPIN — Income Statement Table
 * src/components/reports/IncomeStatement.jsx
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

/* ── Variance cell — colored by sign and sentiment ── */
function VarianceCell({ value, isExpenseRow }) {
  if (value === undefined || value === null)
    return <td className="is-td is-td--right" />;

  // Jika tidak ada perubahan (0)
  if (value === 0) {
    return (
      <td className="is-td is-td--right">
        <span className="is-variance is-variance--neutral">0.0%</span>
      </td>
    );
  }

  // Sentimen Akuntansi:
  // Untuk Pendapatan (Income): Plus itu Bagus (Hijau), Minus itu Buruk (Merah)
  // Untuk Pengeluaran (Expense): Minus itu Bagus (Hijau), Plus itu Buruk (Merah)
  let isGood = value > 0;
  if (isExpenseRow) {
    isGood = value < 0;
  }

  const cls = isGood
    ? "is-variance is-variance--positive"
    : "is-variance is-variance--negative";

  const displayValue =
    value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;

  return (
    <td className="is-td is-td--right">
      <span className={cls}>{displayValue}</span>
    </td>
  );
}

/* ── Single row renderer (For Mock Data) ── */
function StatementRow({ row }) {
  const { type, label, indent, q3, q2, variance } = row;

  if (type === "section") {
    return (
      <tr className="is-row is-row--section">
        <td className="is-td is-td--label is-label--section" colSpan={4}>
          {label}
        </td>
      </tr>
    );
  }

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
      {/* Fallback untuk mock data, asumsikan pengeluaran jika indentasinya masuk (sub-item) */}
      <VarianceCell value={variance} isExpenseRow={indent} />
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
  isExpenseRow = false, // Menerima properti penentu jenis akun
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
      {/* Mengirim status ke komponen pewarna sel */}
      <VarianceCell value={variance} isExpenseRow={isExpenseRow} />
    </tr>
  );
}

/* ── Convert backend data to rows ── */
function buildBackendRows(data) {
  if (!data || !data.statement) return [];

  const st = data.statement;
  const rows = [];

  // Revenues (Bukan pengeluaran)
  rows.push({
    type: "category",
    label: "Revenues",
    current: st.revenues?.current,
    previous: st.revenues?.previous,
    variance: st.revenues?.variance,
    isBold: true,
    isExpenseRow: false,
  });

  // COGS (Pengeluaran)
  if (st.cogs && (st.cogs.current !== 0 || st.cogs.previous !== 0)) {
    rows.push({
      type: "line",
      label: "Cost of Goods Sold",
      current: st.cogs.current,
      previous: st.cogs.previous,
      variance: st.cogs.variance,
      indent: true,
      isExpenseRow: true,
    });
  }

  // Gross Profit (Bukan pengeluaran)
  rows.push({
    type: "subtotal",
    label: "Gross Profit",
    current: st.gross_profit?.current,
    previous: st.gross_profit?.previous,
    variance: st.gross_profit?.variance,
    isBold: true,
    isExpenseRow: false,
  });

  // Operating Expenses section
  rows.push({
    type: "section",
    label: "Operating Expenses",
  });

  // Operating Expense items (Dinamis - Semua ini adalah pengeluaran)
  const opex = st.operating_expenses || {};
  Object.keys(opex).forEach((categoryName) => {
    const expense = opex[categoryName];
    if (expense.current !== 0 || expense.previous !== 0) {
      rows.push({
        type: "line",
        label: categoryName,
        current: expense.current,
        previous: expense.previous,
        variance: expense.variance,
        indent: true,
        isExpenseRow: true, // TANDAI SEBAGAI PENGELUARAN
      });
    }
  });

  // BLOK STATIS YANG LAMA TELAH DIHAPUS DARI SINI UNTUK MENCEGAH DUPLIKASI BARIS

  // Total Operating Expenses (Pengeluaran)
  rows.push({
    type: "subtotal",
    label: "Total Operating Expenses",
    current: st.total_operating_expenses?.current,
    previous: st.total_operating_expenses?.previous,
    variance: st.total_operating_expenses?.variance,
    isBold: true,
    isExpenseRow: true,
  });

  // Net Income (Bukan pengeluaran)
  rows.push({
    type: "total",
    label: "Net Income",
    current: st.net_income?.current,
    previous: st.net_income?.previous,
    variance: st.net_income?.variance,
    isTotal: true,
    isExpenseRow: false,
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
      <div className="is-card__header">
        <div>
          <h3 className="is-card__title">Income Statement</h3>
          <p className="is-card__subtitle">SAK EMKM Standard Format</p>
        </div>
      </div>

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
                    isExpenseRow={row.isExpenseRow} // PROPERTI KRUSIAL UNTUK WARNA DITERUSKAN KE SINI
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
