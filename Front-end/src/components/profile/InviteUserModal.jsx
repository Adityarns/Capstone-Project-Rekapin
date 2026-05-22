/**
 * ============================================================
 *    REKAPIN — Invite User Modal
 *    src/components/profile/InviteUserModal.jsx
 *
 *    Changelog:
 *    - Role options: Viewer/Admin → Employee/Owner
 * ============================================================
 *
 * @format
 */

import { useState } from "react";
import Modal from "./Modal";

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

/* UPDATED: Employee / Owner instead of Viewer / Admin */
const ROLE_OPTIONS = ["Employee", "Owner"];

export default function InviteUserModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Employee");
  const [error, setError] = useState("");

  const handleSend = () => {
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    // TODO: POST /team/invite
    console.log("Send invite:", { email, role });
    handleClose();
  };

  const handleClose = () => {
    setEmail("");
    setRole("Employee");
    setError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Team Member"
      size="sm"
    >
      {/* Email */}
      <div className="modal-field">
        <label className="modal-label" htmlFor="invite-email">
          Email Address
        </label>
        <input
          id="invite-email"
          type="email"
          className={`modal-input ${error ? "modal-input--error" : ""}`}
          placeholder="colleague@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          autoComplete="email"
        />
        {error && (
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-error)",
              fontWeight: "var(--weight-medium)",
              marginTop: "var(--space-1)",
            }}
          >
            {error}
          </span>
        )}
      </div>

      {/* Role */}
      <div className="modal-field">
        <label className="modal-label" htmlFor="invite-role">
          Role
        </label>
        <div className="modal-select-wrap">
          <select
            id="invite-role"
            className="modal-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ paddingRight: "calc(var(--space-4) + 20px)" }}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <span className="modal-select-icon" aria-hidden="true">
            <IconChevronDown />
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="modal-actions">
        <button
          type="button"
          className="modal-btn-cancel"
          onClick={handleClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="modal-btn-primary"
          onClick={handleSend}
        >
          Send Invite
        </button>
      </div>
    </Modal>
  );
}
