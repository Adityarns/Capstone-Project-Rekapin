/**
 * ============================================================
 *    REKAPIN — Business Info Card
 *    src/components/profile/BusinessInfo.jsx
 *
 *    Props:
 *    - business: { name, industry, phone, address }
 *    - isOwner:  boolean
 *    - onEdit:   () => void
 * ============================================================
 */

import "./BusinessInfo.css";

const IconBuilding = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </svg>
);

/* Readonly field display */
function InfoField({ label, value }) {
  return (
    <div className="biz-field">
      <p className="biz-field__label">{label}</p>
      <div className="biz-field__value-wrap">
        <span className="biz-field__value">{value || "—"}</span>
      </div>
    </div>
  );
}

export default function BusinessInfo({ business, isOwner, onEdit }) {
  return (
    <div className="biz-card">
      {/* Header */}
      <div className="biz-card__header">
        <div className="biz-card__title-group">
          <span className="biz-card__icon" aria-hidden="true">
            <IconBuilding />
          </span>
          <h3 className="biz-card__title">Business Info</h3>
        </div>

        {isOwner ? (
          <button
            type="button"
            className="biz-card__edit-link"
            onClick={onEdit}
          >
            Edit
          </button>
        ) : (
          <span className="biz-card__access-badge">Owner Access Required</span>
        )}
      </div>

      {/* Fields */}
      <div className="biz-card__fields">
        <InfoField label="Business Name" value={business.name} />
        <InfoField label="Industry" value={business.industry} />
        <InfoField label="Phone Number" value={business.phone} />
        <InfoField label="Address" value={business.address} />
        <InfoField
          label="Modal"
          value={
            business.modal
              ? `Rp ${Number(business.modal).toLocaleString("id-ID")}`
              : "—"
          }
        />
      </div>
    </div>
  );
}
