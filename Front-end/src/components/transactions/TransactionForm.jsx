/**
 * ============================================================
 *    REKAPIN — Transaction Form Component
 *    src/components/transactions/TransactionForm.jsx
 *
 *    Props (all from Transactions.jsx parent):
 *    - type:        "expense" | "income"
 *    - onTypeChange
 *    - title, amount, date, category, description
 *    - onChange(fieldName, value) — unified handler
 *    - categories:  string[]     — dynamic per type
 * ============================================================
 *
 * @format
 */

import "./TransactionForm.css";

/* ── Chevron Icon for select ── */
const IconChevronDown = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function TransactionForm({
  type,
  onTypeChange,
  title,
  amount,
  date,
  category,
  quantity,
  description,
  categories,
  onChange,
}) {
  return (
    <div className="txn-form-card">
      {/* ── Type Switcher: Expense / Income ── */}
      <div
        className="txn-type-switch"
        role="group"
        aria-label="Transaction type"
      >
        <button
          type="button"
          className={`txn-type-btn ${type === "expense" ? "txn-type-btn--active" : ""}`}
          onClick={() => onTypeChange("expense")}
          aria-pressed={type === "expense"}
        >
          Expense
        </button>
        <button
          type="button"
          className={`txn-type-btn ${type === "income" ? "txn-type-btn--active" : ""}`}
          onClick={() => onTypeChange("income")}
          aria-pressed={type === "income"}
        >
          Income
        </button>
      </div>

      {/* ── Transaction Title ── */}
      <div className="txn-field">
        <label className="txn-label" htmlFor="txn-title">
          Transaction Title
        </label>
        <input
          id="txn-title"
          type="text"
          className="txn-input"
          placeholder={
            type === "expense"
              ? "e.g. Electricity Bill May"
              : "e.g. Client Invoice #88"
          }
          value={title}
          onChange={(e) => onChange("title", e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* ── Amount + Date (2 columns) ── */}
      <div className="txn-row-2col">
        {/* Amount with Rp prefix */}
        <div className="txn-field">
          <label className="txn-label" htmlFor="txn-amount">
            Amount
          </label>
          <div className="txn-amount-wrap">
            <span className="txn-amount-prefix">Rp</span>
            <input
              id="txn-amount"
              type="number"
              className="txn-input txn-input--amount"
              placeholder="0.00"
              min="0"
              step="1000"
              value={amount}
              onChange={(e) => onChange("amount", e.target.value)}
            />
          </div>
        </div>

        {/* Date */}
        <div className="txn-field">
          <label className="txn-label" htmlFor="txn-date">
            Date
          </label>
          <input
            id="txn-date"
            type="date"
            className="txn-input"
            value={date}
            onChange={(e) => onChange("date", e.target.value)}
          />
        </div>
      </div>

      {/* ── Category — dynamic per type ── */}
      <div className="txn-field">
        <label className="txn-label" htmlFor="txn-category">
          Category
        </label>
        <div className="txn-select-wrap">
          <select
            id="txn-category"
            className="txn-select"
            value={category}
            onChange={(e) => onChange("category", e.target.value)}
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <span className="txn-select-icon" aria-hidden="true">
            <IconChevronDown />
          </span>
        </div>
      </div>

      {/* ── Transaction Quantity ── */}
      <div className="txn-field">
        <label className="txn-label" htmlFor="txn-quantity">
          Quantity
        </label>
        <input
          id="txn-quantity"
          type="number"
          className="txn-input"
          placeholder="0"
          min="1"
          value={quantity}
          onChange={(e) => onChange("quantity", e.target.value)}
        />
      </div>

      {/* ── Description ── */}
      <div className="txn-field">
        <label className="txn-label" htmlFor="txn-desc">
          Description
        </label>
        <textarea
          id="txn-desc"
          className="txn-textarea"
          placeholder="What was this for?"
          rows={4}
          value={description}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </div>
    </div>
  );
}
