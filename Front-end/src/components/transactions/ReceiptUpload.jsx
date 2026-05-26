/**
 * ============================================================
 *    REKAPIN — Receipt Upload Component
 *    src/components/transactions/ReceiptUpload.jsx
 *
 *    UI only — no actual file upload logic yet.
 *    Drag visual feedback via isDragging state.
 * ============================================================
 *
 * @format
 */

import { useRef, useState } from "react";
import "./ReceiptUpload.css";

/* ── Upload Icon ── */
const IconUpload = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export default function ReceiptUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  return (
    <div className="receipt-card">
      <h3 className="receipt-card__title">Receipt or Invoice</h3>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div
        className={`receipt-dropzone ${isDragging ? "receipt-dropzone--active" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Upload receipt or invoice"
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
      >
        <div className="receipt-dropzone__icon" aria-hidden="true">
          <IconUpload />
        </div>
        <p className="receipt-dropzone__heading">Drag and drop files here</p>
        <p className="receipt-dropzone__sub">
          or click to browse from your computer
        </p>
        <p className="receipt-dropzone__hint">JPG, PNG, PDF up to 10MB</p>
        {selectedFile && (
          <p className="receipt-dropzone__filename">
            Selected: {selectedFile.name}
          </p>
        )}
      </div>
    </div>
  );
}
