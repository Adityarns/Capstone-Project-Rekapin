/**
 * ============================================================
 *    REKAPIN — Reusable Modal Base
 *    src/components/profile/Modal.jsx
 *
 *    Props:
 *    - isOpen:   boolean
 *    - onClose:  () => void
 *    - title:    string
 *    - children: ReactNode
 *    - size:     "sm" | "md" | "lg"  (default "md")
 * ============================================================
 */

import { useEffect, useRef } from "react";
import "./Modal.css";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}) {
  const firstFocusRef = useRef(null);

  /* Close on ESC */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  /* Prevent body scroll while modal is open */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* Focus first element when modal opens */
  useEffect(() => {
    if (isOpen && firstFocusRef.current) {
      firstFocusRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    /* Backdrop — click outside to close */
    <div
      className="modal-overlay"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      {/* Modal card — stopPropagation prevents backdrop click */}
      <div
        className={`modal modal--${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal__header">
          <h2 className="modal__title" id="modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close modal"
            ref={firstFocusRef}
          >
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}