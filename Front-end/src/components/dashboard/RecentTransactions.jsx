/**
 * ============================================================
 *    REKAPIN — Recent Transactions Table
 *    src/components/dashboard/RecentTransactions.jsx
 * ============================================================
 *
 * @format
 */

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { categoryConfig, formatRupiah } from "../../data/dashboardData";
import {
  getTransactionsForDashboard,
  getRecentTransactions,
} from "../../services/dashboardService";
import "./RecentTransactions.css";

/* ── Category Badge ── */
function CategoryBadge({ category }) {
  const colors = categoryConfig[category] ?? categoryConfig.Other;
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
  const { businessId } = useParams();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch recent transactions
  useEffect(() => {
    if (!businessId || businessId === "undefined") return;

    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const allTransactions = await getTransactionsForDashboard(businessId);
        const recentTxns = getRecentTransactions(allTransactions, 10);
        setTransactions(recentTxns);
      } catch (err) {
        console.error("Error fetching recent transactions:", err);
        setError(err.message || "Gagal memuat transaksi");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [businessId]);

  return (
    <div className="txn-card">
      <div className="txn-card__header">
        <h3 className="txn-card__title">Recent Transactions</h3>
        <button type="button" className="txn-card__view-all">
          View All
        </button>
      </div>

      {isLoading && <p style={{ padding: "20px" }}>Loading transactions...</p>}

      {error && <p style={{ padding: "20px", color: "#c33" }}>⚠️ {error}</p>}

      {!isLoading && transactions.length === 0 && (
        <p style={{ padding: "20px", color: "#666" }}>Belum ada transaksi</p>
      )}

      {!isLoading && transactions.length > 0 && (
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
              {transactions.map((txn) => (
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
      )}
    </div>
  );
}
