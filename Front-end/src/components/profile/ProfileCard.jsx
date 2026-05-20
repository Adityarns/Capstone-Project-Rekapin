/**
 * ============================================================
 *    REKAPIN — Profile Card
 *    src/components/profile/ProfileCard.jsx
 *
 *    Props:
 *    - user: { name, businessRole, email, initials }
 * ============================================================
 */

import "./ProfileCard.css";

const IconCamera = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export default function ProfileCard({ user }) {
  const { name, businessRole, email, initials } = user;

  return (
    <div className="profile-card">

      {/* Avatar */}
      <div className="profile-card__avatar-wrap">
        <div className="profile-card__avatar" aria-hidden="true">
          <span className="profile-card__initials">{initials}</span>
        </div>
        {/* Camera button for photo upload (UI only) */}
        <button
          type="button"
          className="profile-card__camera-btn"
          aria-label="Change profile photo"
          onClick={() => console.log("Change photo — TODO")}
        >
          <IconCamera />
        </button>
      </div>

      {/* Info */}
      <div className="profile-card__info">
        <h2 className="profile-card__name">{name}</h2>
        <p className="profile-card__role">{businessRole}</p>
        <p className="profile-card__email">{email}</p>
      </div>

      {/* Edit Profile button */}
      <button
        type="button"
        className="profile-card__edit-btn"
        onClick={() => console.log("Edit profile — TODO")}
      >
        Edit Profile
      </button>

    </div>
  );
}