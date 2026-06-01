/**
 * ============================================================
 *    REKAPIN — All Transactions Modal
 *    src/components/dashboard/AllTransactionsModal.jsx
 *
 *    Dibuka oleh tombol "View All" di RecentTransactions.
 *    Fitur: search, category filter, date range filter, pagination 10/page, ESC close.
 * ============================================================
 *
 * @format
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  categoryConfig,
  formatRupiah,
} from "../../data/dashboardData";
import "./AllTransactionsModal.css";

/* ─────────────────────────────────────────────────────────── */
/*  Constants                                                  */
/* ─────────────────────────────────────────────────────────── */

const ITEMS_PER_PAGE = 10;

const CATEGORY_OPTIONS = [
  "All Categories",
  "Operations",
  "Sales",
  "Rent",
  "Utilities",
  "Marketing",
  "Salary",
  "Transportation",
];

/* ─────────────────────────────────────────────────────────── */
/*  Date helper                                                */
/* ─────────────────────────────────────────────────────────── */

/**
 * Normalise any date string to a local-midnight Date so that
 * "2023-10-24" (from <input type="date">) and "Oct 24, 2023"
 * (from transaction data) compare correctly regardless of timezone.
 */
function parseLocalDate(str) {
  const d = new Date(str);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/* ─────────────────────────────────────────────────────────── */
/*  Small UI atoms                                             */
/* ─────────────────────────────────────────────────────────── */

/* Category badge — reuses categoryConfig from dashboardData */
function CategoryBadge({ category }) {
  const colors = categoryConfig[category] ?? categoryConfig.Other;
  return (
    <span
      className="atm-badge"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {category}
    </span>
  );
}

/* Status dot + label */
function StatusCell({ status }) {
  const isCompleted = status === "Completed";
  return (
    <span
      className={`atm-status ${isCompleted ? "atm-status--done" : "atm-status--pending"}`}
    >
      <span className="atm-status__dot" aria-hidden="true" />
      {status}
    </span>
  );
}

/* Amount cell — green positive, maroon negative */
function AmountCell({ amount }) {
  const isIncome = amount >= 0;
  return (
    <span
      className={`atm-amount ${isIncome ? "atm-amount--income" : "atm-amount--expense"}`}
    >
      {formatRupiah(amount)}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Icons                                                      */
/* ─────────────────────────────────────────────────────────── */

const IconSearch = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconChevronDown = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconCalendar = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconClose = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconClearSmall = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ─────────────────────────────────────────────────────────── */
/*  Main component                                             */
/* ─────────────────────────────────────────────────────────── */

export default function AllTransactionsModal({isOpen, onClose, transactions = []}) {
  /* ── Filter state ── */
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [page, setPage] = useState(1);

  /* ── ESC key + body scroll lock ── */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  /* ── Reset page when filters change ── */
  useEffect(() => {
    setPage(1);
  }, [transactions, search, category, dateRange]);

  /* ── Reset all state when modal closes ── */
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setCategory("All Categories");
      setDateRange({ from: "", to: "" });
      setPage(1);
    }
  }, [isOpen]);

  /* ── Filtered data ── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cat = category === "All Categories" ? null : category;

    // Parse date inputs ("YYYY-MM-DD") to local midnight for reliable comparison
    const fromDate = dateRange.from ? parseLocalDate(dateRange.from) : null;
    const toDate = dateRange.to
      ? new Date(parseLocalDate(dateRange.to).setHours(23, 59, 59, 999))
      : null;

    return transactions.filter((t) => {
      const matchSearch = !q || t.name.toLowerCase().includes(q);
      const matchCategory = !cat || t.category === cat;

      let matchDate = true;
      if (fromDate || toDate) {
        const txnDate = parseLocalDate(t.date); // "Oct 24, 2023" → local midnight
        if (fromDate && txnDate < fromDate) matchDate = false;
        if (toDate && txnDate > toDate) matchDate = false;
      }

      return matchSearch && matchCategory && matchDate;
    });
  }, [search, category, dateRange]);

  /* ── Pagination ── */
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safeePage = Math.min(page, totalPages);
  const startIdx = (safeePage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handlePrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const handleNext = useCallback(
    () => setPage((p) => Math.min(totalPages, p + 1)),
    [totalPages],
  );

  /* ── Range label ── */
  const rangeEnd = Math.min(startIdx + ITEMS_PER_PAGE, totalItems);
  const rangeLabel =
    totalItems === 0
      ? "No results"
      : `Showing ${startIdx + 1}–${rangeEnd} of ${totalItems}`;

  const hasDateFilter = dateRange.from || dateRange.to;

  if (!isOpen) return null;

  /* ─────────────────────────────────────────────────────── */
  return (
    /* Backdrop */
    <div
      className="atm-overlay"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="All Transactions"
    >
      {/* Modal card — stopPropagation prevents backdrop click from inside */}
      <div className="atm-modal" onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div className="atm-header">
          <h2 className="atm-header__title">All Transactions</h2>
          <button
            type="button"
            className="atm-header__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <IconClose />
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="atm-filters">
          {/* Search */}
          <div className="atm-search-wrap">
            <span className="atm-search-icon" aria-hidden="true">
              <IconSearch />
            </span>
            <input
              type="text"
              className="atm-input atm-input--search"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search transactions"
            />
          </div>

          {/* Category dropdown */}
          <div className="atm-select-wrap">
            <select
              className="atm-input atm-input--select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="atm-select-chevron" aria-hidden="true">
              <IconChevronDown />
            </span>
          </div>

          {/* Date Range — two native date pickers grouped as one field */}
          <div
            className={`atm-date-wrap${hasDateFilter ? " atm-date-wrap--active" : ""}`}
          >
            <span className="atm-date-icon" aria-hidden="true">
              <IconCalendar />
            </span>
            <input
              type="date"
              className="atm-input atm-input--date"
              value={dateRange.from}
              max={dateRange.to || undefined}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, from: e.target.value }))
              }
              aria-label="Filter from date"
            />
            <span className="atm-date-sep" aria-hidden="true">
              –
            </span>
            <input
              type="date"
              className="atm-input atm-input--date"
              value={dateRange.to}
              min={dateRange.from || undefined}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, to: e.target.value }))
              }
              aria-label="Filter to date"
            />
            {hasDateFilter && (
              <button
                type="button"
                className="atm-date-clear"
                onClick={() => setDateRange({ from: "", to: "" })}
                aria-label="Clear date filter"
              >
                <IconClearSmall />
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="atm-table-wrap">
          <table className="atm-table">
            <thead>
              <tr>
                <th className="atm-th atm-th--transaction">Transaction</th>
                <th className="atm-th">Category</th>
                <th className="atm-th atm-th--right">Amount</th>
                <th className="atm-th atm-th--right">Date</th>
                <th className="atm-th atm-th--right">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length > 0 ? (
                pageItems.map((txn) => (
                  <tr key={txn.id} className="atm-row">
                    <td className="atm-td atm-td--name">{txn.name}</td>
                    <td className="atm-td">
                      <CategoryBadge category={txn.category} />
                    </td>
                    <td className="atm-td atm-td--right">
                      <AmountCell amount={txn.amount} />
                    </td>
                    <td className="atm-td atm-td--right atm-td--date">
                      {txn.date}
                    </td>
                    <td className="atm-td atm-td--right">
                      <StatusCell status={txn.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="atm-empty">
                    No transactions match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="atm-pagination">
          <span className="atm-pagination__label">{rangeLabel}</span>
          <div className="atm-pagination__btns">
            <button
              type="button"
              className="atm-page-btn"
              onClick={handlePrev}
              disabled={safeePage <= 1}
              aria-label="Previous page"
            >
              Previous
            </button>
            <button
              type="button"
              className="atm-page-btn atm-page-btn--next"
              onClick={handleNext}
              disabled={safeePage >= totalPages}
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
