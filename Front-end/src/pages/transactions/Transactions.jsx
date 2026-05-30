/**
 * ============================================================
 *    REKAPIN — Transactions Page (New Transaction)
 *    src/pages/transactions/Transactions.jsx
 * ============================================================
 *
 * @format
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import TransactionForm from "../../components/transactions/TransactionForm";
import ReceiptUpload from "../../components/transactions/ReceiptUpload";
import AiAssistantPanel from "../../components/transactions/AiAssistantPanel";

import {
  getCategories,
  createTransaction,
  scanReceipt,
} from "../../services/transactionService";

import "./Transactions.css";

const INITIAL_FORM = {
  title: "",
  amount: "",
  date: "",
  category: "",
  quantity: "",
  description: "",
};

export default function Transactions() {
  const navigate = useNavigate();
  const { businessId } = useParams();

  const [type, setType] = useState("expense");
  const [form, setForm] = useState(INITIAL_FORM);

  // ── Categories from backend ──
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // ── Receipt file ──
  const [receiptFile, setReceiptFile] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);

  // ── Submit states ──
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Load categories from backend when type changes ──
  const loadCategories = useCallback(async (txnType) => {
    setCategoriesLoading(true);
    try {
      const data = await getCategories(txnType);
      setCategories(data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories(type);
  }, [type, loadCategories]);

  // ── Derive selected category object for quantity logic ──
  const selectedCategory = categories.find(
    (cat) => cat.transaction_categories_id === form.category
  );
  const selectedCategoryName = selectedCategory?.category_name || "";

  const handleTypeChange = (newType) => {
    setType(newType);
    setForm((prev) => ({ ...prev, category: "", quantity: "" }));
    setError("");
    setSuccess("");
  };

  const handleFieldChange = (fieldName, value) => {
    setForm((prev) => ({ ...prev, [fieldName]: value }));
    // Clear messages when user edits form
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleFileSelect = (file) => {
    setReceiptFile(file);
  };

  const handleScanReceipt = async () => {
    if (!receiptFile) return;
    setScanLoading(true);
    try {
      const result = await scanReceipt(receiptFile);
      console.log("AI RESULT:", result);
      // Auto-fill form fields from AI scan result if available
      if (result) {
        setForm((prev) => ({
          ...prev,
          title: result.title || prev.title,
          amount: result.amount ? String(result.amount) : prev.amount,
          date: result.transaction_date || result.date || prev.date,
          description:
            result.description?.description_text ||
            result.description ||
            "",
        }));
      }
    } catch (err) {
      console.error("Receipt scan failed:", err);
      setError("Failed to scan receipt. Please fill in the form manually.");
    } finally {
      setScanLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/dashboard/${businessId}`);
  };

  const handleSave = async () => {
    // ── Client-side validation ──
    if (!form.title.trim()) {
      setError("Transaction title is required.");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }
    if (!form.date) {
      setError("Date is required.");
      return;
    }
    if (!form.category) {
      setError("Please select a category.");
      return;
    }

    // Quantity required for carbon-tracked categories
    const needsQuantity =
      selectedCategoryName === "Electricity" ||
      selectedCategoryName === "Transportation" ||
      selectedCategoryName === "Water";
    if (needsQuantity && (!form.quantity || Number(form.quantity) <= 0)) {
      setError("Quantity is required for this category.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        title: form.title.trim(),
        amount: Number(form.amount),
        date: form.date,
        type,
        description:
          typeof form.description === "string"
            ? form.description.trim() || undefined
            : JSON.stringify(form.description),
        businessId,
        categoryId: form.category,
      };

      // Only send quantity if it has a value
      if (form.quantity && Number(form.quantity) > 0) {
        payload.quantity = Number(form.quantity);
      }

      console.log("PAYLOAD:", payload);
      await createTransaction(payload);

      setSuccess("Transaction saved successfully!");
      setForm(INITIAL_FORM);
      setReceiptFile(null);
    } catch (err) {
      console.error("Failed to save transaction:", err);
      setError(err.message || "Failed to save transaction. Please try again.");
    } finally {
      setLoading(false);
    }
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

      {/* Status messages */}
      {error && <div className="txn-msg txn-msg--error">{error}</div>}
      {success && <div className="txn-msg txn-msg--success">{success}</div>}

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
            quantity={form.quantity}
            description={form.description}
            categories={categories}
            categoriesLoading={categoriesLoading}
            selectedCategoryName={selectedCategoryName}
            onChange={handleFieldChange}
          />

          <ReceiptUpload
            onFileSelect={handleFileSelect}
            onScanReceipt={handleScanReceipt}
            scanLoading={scanLoading}
          />

          <div className="txn-page__actions">
            <button
              type="button"
              className="txn-btn txn-btn--cancel"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="txn-btn txn-btn--save"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Transaction"}
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
