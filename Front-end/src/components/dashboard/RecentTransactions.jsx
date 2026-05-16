/**
 * ============================================================
 *    REKAPIN — Recent Transactions Table
 *    src/components/dashboard/RecentTransactions.jsx
 * ============================================================
 *
 * @format
 */

import {
  recentTransactionsData,
  categoryColors,
  formatRupiah,
} from "../../data/dashboardData";
import "./RecentTransactions.css";

/* ── Category Badge ── */
function CategoryBadge({ category }) {
  const colors = categoryColors[category] ?? categoryColors.Other;
  return (
    <span
      className="txn-badge"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {category}
    </span>
  );
}

/* ── Main Component ── */
export default function RecentTransactions() {
  return (
    <div className="txn-card">
      {/* Header */}
      <div className="txn-card__header">
        <h3 className="txn-card__title">Recent Transactions</h3>
        <button type="button" className="txn-card__view-all">
          View All
        </button>
      </div>

      {/* Table */}
      <div className="txn-table-wrapper">
        <table className="txn-table">
          <thead>
            <tr>
              <th className="txn-table__th">Transaction</th>
              <th className="txn-table__th">Category</th>
              <th className="txn-table__th txn-table__th--right">Amount</th>
              <th className="txn-table__th txn-table__th--right">Date</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactionsData.map((txn) => (
              <tr key={txn.id} className="txn-table__row">
                <td className="txn-table__td txn-table__td--name">
                  {txn.name}
                </td>
                <td className="txn-table__td">
                  <CategoryBadge category={txn.category} />
                </td>
                <td
                  className={[
                    "txn-table__td",
                    "txn-table__td--right",
                    "txn-table__td--amount",
                    txn.amount >= 0
                      ? "txn-amount--positive"
                      : "txn-amount--negative",
                  ].join(" ")}
                >
                  {formatRupiah(txn.amount)}
                </td>
                <td className="txn-table__td txn-table__td--right txn-table__td--date">
                  {txn.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
