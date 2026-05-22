/**
 * ============================================================
 *    REKAPIN — Login History Modal
 *    src/components/profile/LoginHistoryModal.jsx
 *
 *    Read-only display of recent login sessions.
 *    Uses dummy data from profileData.js.
 * ============================================================
 *
 * @format
 */

import Modal from "./Modal";
import { loginSessions } from "../../data/profileData";

/* ── Icons ── */
const IconMonitor = () => (
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
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const IconPhone = () => (
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
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <circle cx="12" cy="17" r="1" />
  </svg>
);

const IconMapPin = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

/* Detect if session is mobile (simple heuristic) */
function DeviceIcon({ device }) {
  const isMobile = /android|iphone|ipad|mobile/i.test(device);
  return isMobile ? <IconPhone /> : <IconMonitor />;
}

/* ── Session Row ── */
function SessionRow({ session }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--space-4)",
        padding: "var(--space-4)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        backgroundColor: session.isCurrent
          ? "var(--color-accent-50)"
          : "var(--color-bg-surface)",
      }}
    >
      {/* Device icon */}
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "var(--radius-md)",
          backgroundColor: session.isCurrent
            ? "var(--color-accent-100)"
            : "var(--color-neutral-100)",
          color: session.isCurrent
            ? "var(--color-accent-600)"
            : "var(--color-text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <DeviceIcon device={session.device} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-semibold)",
              color: "var(--color-text-primary)",
            }}
          >
            {session.device}
          </p>
          {session.isCurrent && (
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: "var(--weight-bold)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                backgroundColor: "var(--color-accent-500)",
                color: "var(--color-neutral-0)",
                padding: "1px 6px",
                borderRadius: "9999px",
                lineHeight: 1.6,
              }}
            >
              Current
            </span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-1)",
            marginTop: "2px",
          }}
        >
          <IconMapPin />
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            {session.location} · {session.lastActive}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function LoginHistoryModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Login History" size="md">
      <p
        style={{
          margin: 0,
          fontSize: "var(--text-sm)",
          color: "var(--color-text-secondary)",
          marginTop: "calc(var(--space-2) * -1)",
        }}
      >
        Recent sessions associated with your account.
      </p>

      {/* Session list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        {loginSessions.map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
      </div>

      {/* Close button only — read-only modal */}
      <div className="modal-actions">
        <button type="button" className="modal-btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}
