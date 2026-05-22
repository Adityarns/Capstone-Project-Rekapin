/**
 * ============================================================
 *    REKAPIN — Change Password Modal
 *    src/components/profile/ChangePasswordModal.jsx
 *
 *    Fields: Current Password, New Password, Confirm Password
 *    Features: show/hide toggle per field, confirm match validation
 * ============================================================
 *
 * @format
 */

import { useState } from "react";
import Modal from "./Modal";

/* ── Eye Icons ── */
const IconEye = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ── Password field with show/hide toggle ── */
function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  show,
  onToggleShow,
}) {
  return (
    <div className="modal-field">
      <label className="modal-label" htmlFor={id}>
        {label}
      </label>
      <div className="modal-password-wrap">
        <input
          id={id}
          type={show ? "text" : "password"}
          className={`modal-input ${error ? "modal-input--error" : ""}`}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="modal-password-toggle"
          onClick={onToggleShow}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
      {error && (
        <span
          style={{
            display: "block",
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
  );
}

/* ── Main Component ── */
export default function ChangePasswordModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [show, setShow] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});

  const setField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
  };

  const toggleShow = (key) => setShow((p) => ({ ...p, [key]: !p[key] }));

  const validate = () => {
    const err = {};
    if (!form.current) err.current = "Current password is required.";
    if (!form.newPass) err.newPass = "New password is required.";
    else if (form.newPass.length < 8)
      err.newPass = "Password must be at least 8 characters.";
    if (!form.confirm) err.confirm = "Please confirm your new password.";
    else if (form.newPass !== form.confirm)
      err.confirm = "Passwords do not match.";
    return err;
  };

  const handleSave = () => {
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    // TODO: PATCH /auth/change-password
    console.log("Change password submitted");
    handleClose();
  };

  const handleClose = () => {
    setForm({ current: "", newPass: "", confirm: "" });
    setShow({ current: false, newPass: false, confirm: false });
    setErrors({});
    onClose();
  };

  /* Passwords match indicator */
  const passwordsMatch =
    form.confirm.length > 0 && form.newPass === form.confirm;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Password"
      size="sm"
    >
      <PasswordField
        id="cp-current"
        label="Current Password"
        value={form.current}
        onChange={(val) => setField("current", val)}
        error={errors.current}
        show={show.current}
        onToggleShow={() => toggleShow("current")}
      />

      <PasswordField
        id="cp-new"
        label="New Password"
        value={form.newPass}
        onChange={(val) => setField("newPass", val)}
        error={errors.newPass}
        show={show.newPass}
        onToggleShow={() => toggleShow("newPass")}
      />

      <PasswordField
        id="cp-confirm"
        label="Confirm New Password"
        value={form.confirm}
        onChange={(val) => setField("confirm", val)}
        error={errors.confirm}
        show={show.confirm}
        onToggleShow={() => toggleShow("confirm")}
      />

      {/* Match indicator */}
      {passwordsMatch && !errors.confirm && (
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-success)",
            fontWeight: "var(--weight-medium)",
            marginTop: "calc(var(--space-2) * -1)",
          }}
        >
          Passwords match ✓
        </p>
      )}

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
          onClick={handleSave}
        >
          Update Password
        </button>
      </div>
    </Modal>
  );
}
