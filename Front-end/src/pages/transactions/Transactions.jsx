/**
 * ============================================================
 *    REKAPIN — Transactions Page (New Transaction)
 *    src/pages/transactions/Transactions.jsx
 * ============================================================
 *
 * @format
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import TransactionForm from "../../components/transactions/TransactionForm";
import ReceiptUpload from "../../components/transactions/ReceiptUpload";
import AiAssistantPanel from "../../components/transactions/AiAssistantPanel";

import {
  expenseCategories,
  incomeCategories,
} from "../../data/transactionData";

import "./Transactions.css";

const INITIAL_FORM = {
  title: "",
  amount: "",
  date: "",
  category: "",
  description: "",
};

export default function Transactions() {
  const navigate = useNavigate();

  const [type, setType] = useState("expense");
  const [form, setForm] = useState(INITIAL_FORM);

  const categories = type === "expense" ? expenseCategories : incomeCategories;

  const handleTypeChange = (newType) => {
    setType(newType);
    setForm((prev) => ({ ...prev, category: "" }));
  };

  const handleFieldChange = (fieldName, value) => {
    setForm((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  const handleSave = () => {
    // TODO: POST to /transactions API
    console.log("Save transaction:", { type, ...form });
  };

  return (
    <div className="txn-page">
      {/* Page header */}
      <header className="txn-page__header">
        <h1 className="txn-page__title">New Transaction</h1>
        <p className="txn-page__subtitle">
          Record a new expense or income securely.
        </p>
      </header>

      {/* 2-column layout */}
      <div className="txn-page__body">
        {/* Left column: form + upload + actions */}
        <div className="txn-page__left">
          <TransactionForm
            type={type}
            onTypeChange={handleTypeChange}
            title={form.title}
            amount={form.amount}
            date={form.date}
            category={form.category}
            description={form.description}
            categories={categories}
            onChange={handleFieldChange}
          />

          <ReceiptUpload />

          <div className="txn-page__actions">
            <button
              type="button"
              className="txn-btn txn-btn--cancel"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="txn-btn txn-btn--save"
              onClick={handleSave}
            >
              Save Transaction
            </button>
          </div>
        </div>

        {/* Right column: AI assistant */}
        <div className="txn-page__right">
          <AiAssistantPanel />
        </div>
      </div>
    </div>
  );
}
