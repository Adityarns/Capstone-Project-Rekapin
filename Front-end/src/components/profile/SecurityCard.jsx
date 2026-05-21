/**
 * ============================================================
 *    REKAPIN — Security Card
 *    src/components/profile/SecurityCard.jsx
 *
 *    Changelog:
 *    - "Two-Factor Auth" → "Change Password"
 *    - "Logout from all devices" → "Logout Session"
 *    - Terima props: onChangePassword, onLoginHistory, onLogout
 *
 *    Props:
 *    - onChangePassword: () => void
 *    - onLoginHistory:   () => void
 *    - onLogout:         () => void
 * ============================================================
 *
 * @format
 */

import "./SecurityCard.css";

/* ── Icons ── */
const IconShield = () => (
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
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconKey = () => (
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
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const IconClock = () => (
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
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconChevronRight = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconLogout = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/* ── Security action row ── */
function SecurityRow({ icon, label, onClick }) {
  return (
    <button type="button" className="security-row" onClick={onClick}>
      <span className="security-row__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="security-row__label">{label}</span>
      <span className="security-row__chevron" aria-hidden="true">
        <IconChevronRight />
      </span>
    </button>
  );
}

/* ── Main Component ── */
export default function SecurityCard({
  onChangePassword = () => {},
  onLoginHistory = () => {},
  onLogout = () => {},
}) {
  return (
    <div className="security-card">
      {/* Header */}
      <div className="security-card__header">
        <span className="security-card__icon" aria-hidden="true">
          <IconShield />
        </span>
        <h3 className="security-card__title">Security</h3>
      </div>

      {/* Action rows */}
      <div className="security-card__rows">
        <SecurityRow
          icon={<IconKey />}
          label="Change Password"
          onClick={onChangePassword}
        />
        <SecurityRow
          icon={<IconClock />}
          label="Login History"
          onClick={onLoginHistory}
        />
      </div>

      {/* Logout Session */}
      <button
        type="button"
        className="security-card__logout-btn"
        onClick={onLogout}
      >
        <IconLogout />
        Logout Session
      </button>
    </div>
  );
}
