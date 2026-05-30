/**
 * ============================================================
 *    REKAPIN — Team Management Card
 *    src/components/profile/TeamManagement.jsx
 *
 *    Rules:
 *    - isOwner = true  → full management access
 *    - isOwner = false → read-only, no buttons at all
 *    - "..." button only renders on members with role "Employee"
 *    - One dropdown open at a time
 *    - Click-outside closes via document listener
 *    - Smooth CSS fade animation on dropdown mount
 *
 *    Props:
 *    - team:     { invitationCode, members }
 *    - isOwner:  boolean
 *    - onInvite: () => void
 * ============================================================
 *
 * @format
 */

import { useState, useEffect } from "react";
import "./TeamManagement.css";

/* ─────────────────────────────────────────────────────────── */
/*  Icons                                                      */
/* ─────────────────────────────────────────────────────────── */

const IconTeam = () => (
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
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconCopy = () => (
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
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconUserPlus = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

const IconDots = () => (
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
    <circle cx="12" cy="5" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="19" r="1" fill="currentColor" />
  </svg>
);

const IconUserMinus = () => (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

const IconUsersEmpty = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

/* ─────────────────────────────────────────────────────────── */
/*  Sub-components                                             */
/* ─────────────────────────────────────────────────────────── */

function MemberAvatar({ initials, avatarUrl }) {
  return avatarUrl ? (
    <img src={avatarUrl} alt="avatar" className="team-avatar" />
  ) : (
    <div className="team-avatar" aria-hidden="true">
      <span>{initials}</span>
    </div>
  );
}

function RoleBadge({ role }) {
  const isOwnerRole = role === "Owner";
  return (
    <span
      className={`team-role-badge ${
        isOwnerRole ? "team-role-badge--owner" : "team-role-badge--employee"
      }`}
    >
      {role}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  MemberRow — dropdown scoped here for isolation             */
/* ─────────────────────────────────────────────────────────── */

function MemberRow({ member, isOwner, isMenuOpen, onToggleMenu, onRemove }) {
  /*
   * "..." button rules:
   *  ① Only rendered when isOwner = true
   *  ② Only rendered when member.role === "Employee"
   *     (Owners manage the workspace — no remove action for them)
   */
  const showMenu = isOwner && member.role === "Employee";

  return (
    <li className="team-member">
      <MemberAvatar
        initials={member.initials}
        avatarUrl={member.avatarSrc || member.avatar_url}
      />

      <div className="team-member__info">
        <p className="team-member__name">{member.name}</p>
        <p className="team-member__email">{member.email}</p>
      </div>

      <RoleBadge role={member.role} />

      {/* Context menu — only for Employee members, only for Owner users */}
      {showMenu && (
        <div className="team-member__menu-wrap">
          <button
            type="button"
            className={`team-member__menu-btn ${isMenuOpen ? "team-member__menu-btn--active" : ""}`}
            aria-label={`Options for ${member.name}`}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            onClick={(e) => {
              /*
               * stopPropagation prevents the document "click" listener
               * (registered in TeamManagement) from firing immediately
               * and closing the menu we're about to open.
               */
              e.stopPropagation();
              onToggleMenu(member.id);
            }}
          >
            <IconDots />
          </button>

          {isMenuOpen && (
            /*
             * stopPropagation on the dropdown itself prevents
             * clicks *inside* it from reaching the document listener.
             * Each item manually closes the menu after acting.
             */
            <div
              className="team-dropdown"
              role="menu"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="team-dropdown__item team-dropdown__item--danger"
                role="menuitem"
                onClick={() => onRemove(member.id)}
              >
                <IconUserMinus />
                Remove Employee
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Empty state                                                */
/* ─────────────────────────────────────────────────────────── */

function EmptyTeam({ isOwner, onInvite }) {
  return (
    <div className="team-empty">
      <div className="team-empty__icon" aria-hidden="true">
        <IconUsersEmpty />
      </div>
      <p className="team-empty__heading">No employees added yet.</p>
      <p className="team-empty__sub">
        Invite your first employee to collaborate.
      </p>
      {isOwner && (
        <button type="button" className="team-empty__cta" onClick={onInvite}>
          <IconUserPlus />
          Invite Employee
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Main Component                                             */
/* ─────────────────────────────────────────────────────────── */

export default function TeamManagement({
  team = [],
  invitationCode,
  isOwner,
  onInvite,
  onRemove,
}) {
  /* Local members state — allows Remove without an API call yet */
  const members = team || [];
  console.log("TEAM MEMBERS:", members);

  /* Track which member's dropdown is open. null = none. */
  const [openMenuId, setOpenMenuId] = useState(null);

  /* ── Click-outside: close any open dropdown ──────────────
   *
   *  Pattern:
   *  1. Register document listener when a menu is open
   *  2. Any click that was NOT stopPropagation'd reaches document
   *  3. Listener fires → setOpenMenuId(null)
   *  4. Cleanup on unmount OR when openMenuId changes back to null
   * ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (openMenuId === null) return;

    const handleDocClick = () => setOpenMenuId(null);
    document.addEventListener("click", handleDocClick);

    return () => document.removeEventListener("click", handleDocClick);
  }, [openMenuId]);

  /* Toggle: open this menu if it's closed, close if already open */
  const handleToggleMenu = (memberId) => {
    setOpenMenuId((prev) => (prev === memberId ? null : memberId));
  };

  /* Remove member from parent state via callback */
  const handleRemove = (memberId) => {
    if (typeof onRemove === "function") {
      onRemove(memberId);
    } else {
      console.warn("onRemove callback not provided");
    }
  };

  /* Invitation code copy */
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(invitationCode)
      .catch(() => {})
      .finally(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  const hasMembers = members.length > 0;

  /* ── Render ── */
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
            <p className="team-invite-code__value">{invitationCode}</p>
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

      {/* Member list OR empty state */}
      {hasMembers ? (
        <ul className="team-member-list" role="list">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              isOwner={isOwner}
              isMenuOpen={openMenuId === member.id}
              onToggleMenu={handleToggleMenu}
              onRemove={handleRemove}
            />
          ))}
        </ul>
      ) : (
        <EmptyTeam isOwner={isOwner} onInvite={onInvite} />
      )}
    </div>
  );
}
