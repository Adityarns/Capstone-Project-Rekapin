/**
 * ============================================================
 *    REKAPIN — Notifications Card
 *    src/components/profile/NotificationsCard.jsx
 *
 *    Props:
 *    - settings: { emailNotifications, monthlyReports, aiInsights }
 *    - onChange: (key: string, value: boolean) => void
 * ============================================================
 */

import "./NotificationsCard.css";

/* ── Bell Icon ── */
const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

/* ── Toggle Switch ── */
function ToggleSwitch({ id, checked, onChange, label }) {
  return (
    <label className="toggle" htmlFor={id} aria-label={label}>
      <input
        id={id}
        type="checkbox"
        className="toggle__input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__thumb" />
      </span>
    </label>
  );
}

/* ── Notification Row ── */
function NotifRow({ id, label, sublabel, checked, badge, onChange }) {
  return (
    <div className="notif-row">
      <div className="notif-row__text">
        <div className="notif-row__label-group">
          <span className="notif-row__label">{label}</span>
          {badge && (
            <span className="notif-row__badge">{badge}</span>
          )}
        </div>
        <span className="notif-row__sub">{sublabel}</span>
      </div>
      <ToggleSwitch
        id={id}
        checked={checked}
        onChange={onChange}
        label={label}
      />
    </div>
  );
}

export default function NotificationsCard({ settings, onChange }) {
  return (
    <div className="notif-card">

      {/* Header */}
      <div className="notif-card__header">
        <span className="notif-card__icon" aria-hidden="true">
          <IconBell />
        </span>
        <h3 className="notif-card__title">Notifications</h3>
      </div>

      {/* Rows */}
      <div className="notif-card__rows">
        <NotifRow
          id="toggle-email"
          label="Email Notifications"
          sublabel="New activity alerts"
          checked={settings.emailNotifications}
          onChange={(val) => onChange("emailNotifications", val)}
        />

        <NotifRow
          id="toggle-monthly"
          label="Monthly Reports"
          sublabel="Automatic PDF delivery"
          checked={settings.monthlyReports}
          onChange={(val) => onChange("monthlyReports", val)}
        />

        <NotifRow
          id="toggle-ai"
          label="AI Insights"
          sublabel="Sustainability recommendations"
          checked={settings.aiInsights}
          badge="ECO"
          onChange={(val) => onChange("aiInsights", val)}
        />
      </div>

    </div>
  );
}