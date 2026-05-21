/**
 * ============================================================
 *    REKAPIN — Profile Card
 *    src/components/profile/ProfileCard.jsx
 *
 *    Changelog:
 *    - Terima prop `avatarSrc` untuk menampilkan foto
 *    - Klik avatar/camera memanggil `onEdit`
 *    - "Edit Profile" button juga memanggil `onEdit`
 *
 *    Props:
 *    - user: { name, businessRole, email, initials, avatarSrc? }
 *    - onEdit: () => void
 * ============================================================
 *
 * @format
 */

import "./ProfileCard.css";

const IconCamera = () => (
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
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export default function ProfileCard({ user, onEdit }) {
  const { name, businessRole, email, initials, avatarSrc } = user;

  return (
    <div className="profile-card">
      {/* Avatar — click to open Edit Profile modal */}
      <div className="profile-card__avatar-wrap">
        <button
          type="button"
          className="profile-card__avatar"
          onClick={onEdit}
          aria-label="Edit profile photo"
          title="Click to edit profile"
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={name}
              className="profile-card__avatar-img"
            />
          ) : (
            <span className="profile-card__initials">{initials}</span>
          )}
        </button>

        {/* Camera overlay button */}
        <button
          type="button"
          className="profile-card__camera-btn"
          onClick={onEdit}
          aria-label="Change profile photo"
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
      <button type="button" className="profile-card__edit-btn" onClick={onEdit}>
        Edit Profile
      </button>
    </div>
  );
}
