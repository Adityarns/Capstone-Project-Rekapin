/**
 * ============================================================
 *    REKAPIN — Logout Confirmation Modal
 *    src/components/profile/LogoutConfirmModal.jsx
 *
 *    Props:
 *    - isOpen:     boolean
 *    - onClose:    () => void
 *    - onConfirm:  () => void
 * ============================================================
 *
 * @format
 */

import Modal from "./Modal";

const IconLogoutLarge = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  const handleConfirm = () => {
    // TODO: call Supabase signOut / DELETE /auth/logout
    console.log("Logout confirmed");
    onConfirm?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Logout Session" size="sm">
      {/* Icon + message */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-4)",
          padding: "var(--space-4) 0",
          textAlign: "center",
        }}
      >
        {/* Icon circle */}
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "9999px",
            backgroundColor: "var(--color-error-light)",
            color: "var(--color-error)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <IconLogoutLarge />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-base)",
              fontWeight: "var(--weight-semibold)",
              color: "var(--color-text-primary)",
            }}
          >
            Are you sure you want to logout?
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-sm)",
              color: "var(--color-text-secondary)",
              lineHeight: "var(--leading-relaxed)",
            }}
          >
            You will be signed out of your current session and redirected to the
            login page.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="modal-actions">
        <button type="button" className="modal-btn-cancel" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="modal-btn-danger"
          onClick={handleConfirm}
        >
          Logout
        </button>
      </div>
    </Modal>
  );
}
