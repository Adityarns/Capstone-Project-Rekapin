/**
 * ============================================================
 *    REKAPIN — Team Management Card
 *    src/components/profile/TeamManagement.jsx
 *
 *    Props:
 *    - team:        { invitationCode, members }
 *    - isOwner:     boolean
 *    - onInvite:    () => void
 * ============================================================
 */

import { useState } from "react";
import "./TeamManagement.css";

/* ── Icons ── */
const IconTeam = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconUserPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

const IconDots = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5"  r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="19" r="1" fill="currentColor" />
  </svg>
);

/* ── Member initials avatar ── */
function MemberAvatar({ initials }) {
  return (
    <div className="team-avatar" aria-hidden="true">
      <span>{initials}</span>
    </div>
  );
}

/* ── Role badge ── */
function RoleBadge({ role }) {
  const cls = role === "Admin"
    ? "team-role-badge team-role-badge--admin"
    : "team-role-badge team-role-badge--viewer";
  return <span className={cls}>{role}</span>;
}

export default function TeamManagement({ team, isOwner, onInvite }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(team.invitationCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        /* Fallback for environments without clipboard API */
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  return (
    <div className="team-card">

      {/* Header */}
      <div className="team-card__header">
        <div className="team-card__title-group">
          <span className="team-card__icon" aria-hidden="true">
            <IconTeam />
          </span>
          <h3 className="team-card__title">Team Management</h3>
        </div>

        {/* Invite User — owner only */}
        {isOwner ? (
          <button type="button" className="team-invite-btn" onClick={onInvite}>
            <IconUserPlus />
            Invite User
          </button>
        ) : (
          <span className="biz-card__access-badge">View Only</span>
        )}
      </div>

      {/* Invitation Code — owner only */}
      {isOwner && (
        <div className="team-invite-code">
          <div className="team-invite-code__left">
            <p className="team-invite-code__label">Team Invitation Code</p>
            <p className="team-invite-code__value">{team.invitationCode}</p>
          </div>
          <button
            type="button"
            className="team-invite-code__copy-btn"
            onClick={handleCopy}
            aria-label="Copy invitation code"
          >
            <IconCopy />
            <span>{copied ? "Copied!" : "Copy Code"}</span>
          </button>
        </div>
      )}

      {/* Member list */}
      <ul className="team-member-list" role="list">
        {team.members.map((member) => (
          <li key={member.id} className="team-member">
            <MemberAvatar initials={member.initials} />

            <div className="team-member__info">
              <p className="team-member__name">{member.name}</p>
              <p className="team-member__email">{member.email}</p>
            </div>

            <RoleBadge role={member.role} />

            {/* Actions menu — owner only */}
            {isOwner && (
              <button
                type="button"
                className="team-member__menu-btn"
                aria-label={`More options for ${member.name}`}
                onClick={() => console.log("Member menu:", member.id)}
              >
                <IconDots />
              </button>
            )}
          </li>
        ))}
      </ul>

    </div>
  );
}