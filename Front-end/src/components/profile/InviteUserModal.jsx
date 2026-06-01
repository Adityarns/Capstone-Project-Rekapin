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
import { inviteTeamMember } from "../../services/teamService";

export default function InviteUserModal({
  isOpen,
  onClose,
  businessId,
  onInviteSuccess,
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!businessId) {
      setError("Business ID tidak ditemukan.");
      return;
    }

    try {
      setIsSending(true);
      await inviteTeamMember(businessId, email);
      setError("");
      setEmail("");
      if (typeof onInviteSuccess === "function") {
        onInviteSuccess();
      }
      handleClose();
    } catch (err) {
      setError(err?.message || "Gagal mengirim undangan. Silakan coba lagi.");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setEmail("");
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

      {/* Actions */}
      <div className="modal-actions">
        <button
          type="button"
          className="modal-btn-cancel"
          onClick={handleClose}
          disabled={isSending}
        >
          Cancel
        </button>
        <button
          type="button"
          className="modal-btn-primary"
          onClick={handleSend}
          disabled={isSending}
        >
          {isSending ? "Sending..." : "Send Invite"}
        </button>
      </div>
    </Modal>
  );
}
