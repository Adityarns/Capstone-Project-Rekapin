/**
 * ============================================================
 *    REKAPIN — Edit Business Info Modal
 *    src/components/profile/EditBusinessModal.jsx
 * ============================================================
 */

import Modal from "./Modal";
import { industryOptions } from "../../data/profileData";

const IconChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function EditBusinessModal({ isOpen, onClose, form, onChange, onSave }) {
  const handleSave = () => {
    // TODO: PUT /businesses/:id
    console.log("Save business:", form);
    onSave(form);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Business Info">

      {/* Business Name */}
      <div className="modal-field">
        <label className="modal-label" htmlFor="biz-name">Business Name</label>
        <input
          id="biz-name"
          type="text"
          className="modal-input"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Your business name"
        />
      </div>

      {/* Industry */}
      <div className="modal-field">
        <label className="modal-label" htmlFor="biz-industry">Industry</label>
        <div className="modal-select-wrap">
          <select
            id="biz-industry"
            className="modal-select"
            value={form.industry}
            onChange={(e) => onChange("industry", e.target.value)}
            style={{ paddingRight: "calc(var(--space-4) + 20px)" }}
          >
            {industryOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <span className="modal-select-icon" aria-hidden="true">
            <IconChevronDown />
          </span>
        </div>
      </div>

      {/* Phone */}
      <div className="modal-field">
        <label className="modal-label" htmlFor="biz-phone">Phone Number</label>
        <input
          id="biz-phone"
          type="tel"
          className="modal-input"
          value={form.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          placeholder="+62 ..."
        />
      </div>

      {/* Address */}
      <div className="modal-field">
        <label className="modal-label" htmlFor="biz-address">Address</label>
        <input
          id="biz-address"
          type="text"
          className="modal-input"
          value={form.address}
          onChange={(e) => onChange("address", e.target.value)}
          placeholder="Street address"
        />
      </div>

      {/* Actions */}
      <div className="modal-actions">
        <button type="button" className="modal-btn-cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="modal-btn-primary" onClick={handleSave}>
          Save Changes
        </button>
      </div>

    </Modal>
  );
}