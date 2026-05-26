/**
 * ============================================================
 *    REKAPIN — Profile & Settings Page
 *    src/pages/profile/ProfileSettings.jsx
 *
 *    Dirty-state fix:
 *    BEFORE → useRef + reading ref.current inside useMemo
 *             (unsafe: refs are not tracked by React, reading
 *              them during render can cause inconsistencies)
 *
 *    AFTER  → savedSnapshot as useState
 *             useMemo only reads state — always safe during render
 *
 *    EditProfileModal fix:
 *    key={String(modals.editProfile)} → React unmounts + remounts
 *    the modal every time it opens, so lazy useState initializer
 *    inside the modal always runs fresh — no useEffect needed.
 * ============================================================
 */

import { useState, useMemo } from "react";   // useRef removed
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import ProfileCard          from "../../components/profile/ProfileCard";
import BusinessInfo         from "../../components/profile/BusinessInfo";
import TeamManagement       from "../../components/profile/TeamManagement";
import NotificationsCard    from "../../components/profile/NotificationsCard";
import SecurityCard         from "../../components/profile/SecurityCard";

import EditProfileModal     from "../../components/profile/EditProfileModal";
import EditBusinessModal    from "../../components/profile/EditBusinessModal";
import InviteUserModal      from "../../components/profile/InviteUserModal";
import ChangePasswordModal  from "../../components/profile/ChangePasswordModal";
import LoginHistoryModal    from "../../components/profile/LoginHistoryModal";
import LogoutConfirmModal   from "../../components/profile/LogoutConfirmModal";

import {
  mockUser,
  mockBusiness,
  mockTeam,
  mockNotifications,
} from "../../data/profileData";

import "./ProfileSettings.css";

/* ── Helpers ── */

const INIT_PROFILE = {
  name:      mockUser.name,
  email:     mockUser.email,
  phone:     mockUser.phone,
  initials:  mockUser.initials,
  avatarSrc: mockUser.avatarSrc,
};

/* Stable shallow comparison via JSON — safe for plain data objects */
const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* Change to "employee" to preview employee role UI */
const DEMO_ROLE = mockUser.role;

/* ══════════════════════════════════════════════════════════ */

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { logout, user, updateUser } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const isOwner  = DEMO_ROLE === "owner";

  /* ── Current state (what the user is editing) ── */
  const [userProfile,   setUserProfile]   = useState({ ...INIT_PROFILE });
  const [business,      setBusiness]      = useState({ ...mockBusiness });
  const [bizDraft,      setBizDraft]      = useState({ ...mockBusiness });
  const [notifications, setNotifications] = useState({ ...mockNotifications });

  /* ── savedSnapshot: represents the last-committed state ────────
   *
   *  Why useState instead of useRef?
   *  useMemo reads this value during render. React's rules say:
   *  "Don't read refs during render" — refs are mutable and not
   *  tracked by the reactive system, so reading them in useMemo
   *  can cause stale comparisons.
   *
   *  useState is always safe to read during render.
   * ─────────────────────────────────────────────────────────── */
  const [savedSnapshot, setSavedSnapshot] = useState(() => ({
    profile:  { ...INIT_PROFILE },
    business: { ...mockBusiness },
    notifs:   { ...mockNotifications },
  }));

  /* ── isDirty: pure state-to-state comparison ──
   *  No refs. No side effects. React-safe. ── */
  const isDirty = useMemo(() => (
    !isEqual(userProfile,   savedSnapshot.profile)  ||
    !isEqual(business,      savedSnapshot.business) ||
    !isEqual(notifications, savedSnapshot.notifs)
  ), [userProfile, business, notifications, savedSnapshot]);

  /* ── Modal open/close ── */
  const [modals, setModals] = useState({
    editProfile:    false,
    editBusiness:   false,
    invite:         false,
    changePassword: false,
    loginHistory:   false,
    logoutConfirm:  false,
  });

  const openModal  = (key) => setModals((p) => ({ ...p, [key]: true  }));
  const closeModal = (key) => setModals((p) => ({ ...p, [key]: false }));

  /* ── Handlers ── */

  const handleOpenEditBiz = () => {
    setBizDraft({ ...business });
    openModal("editBusiness");
  };

  const handleBizSave = (saved) => {
    setBusiness({ ...saved });
    closeModal("editBusiness");
  };

  /* Profile save — does NOT commit to savedSnapshot yet.
   * User still needs to press "Save Changes" to persist. */
  const handleProfileSave = (saved) => {
    setUserProfile((prev) => ({
      ...prev,
      name:      saved.name,
      email:     saved.email,
      phone:     saved.phone,
      avatarSrc: saved.avatarSrc,
    }));

    // Sync ke global auth context
    updateUser({
      name: saved.name,
      email: saved.email,
      avatarSrc: saved.avatarSrc,
    });
  };

  const handleNotifChange = (key, value) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  /* Save: commit current state → update savedSnapshot → isDirty = false */
  const handleSaveChanges = () => {
    setSavedSnapshot({
      profile:  { ...userProfile },
      business: { ...business },
      notifs:   { ...notifications },
    });
    // TODO: PATCH /users/:id  /businesses/:id  /notifications
    console.log("Saved:", { userProfile, business, notifications });
  };

  /* Discard: revert all state back to last saved snapshot */
  const handleDiscard = () => {
    setUserProfile({ ...savedSnapshot.profile });
    setBusiness({ ...savedSnapshot.business });
    setNotifications({ ...savedSnapshot.notifs });
  };

  /* Logout: call AuthContext.logout() → DELETE /auth/logout + clear tokens */
  const handleLogoutConfirmed = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const displayUser = {
    ...userProfile,
    businessRole: isOwner
      ? `Owner at ${business.name}`
      : `Employee at ${business.name}`,
  };

  /* ── Render ── */
  return (
    <>
      <div className="profile-page">

        <header className="profile-page__header">
          <h1 className="profile-page__title">Profile & Settings</h1>
          <p className="profile-page__subtitle">
            Manage your account, business details, and preferences.
          </p>
        </header>

        <div className="profile-grid">

          <div className="profile-grid__left">
            <ProfileCard
              user={displayUser}
              onEdit={() => openModal("editProfile")}
            />
            <BusinessInfo
              business={business}
              isOwner={isOwner}
              onEdit={handleOpenEditBiz}
            />
          </div>

          <div className="profile-grid__right">
            <TeamManagement
              team={mockTeam}
              isOwner={isOwner}
              onInvite={() => openModal("invite")}
            />
            <div className="profile-grid__bottom-row">
              <NotificationsCard
                settings={notifications}
                onChange={handleNotifChange}
              />
              <SecurityCard
                onChangePassword={() => openModal("changePassword")}
                onLoginHistory={()   => openModal("loginHistory")}
                onLogout={()         => openModal("logoutConfirm")}
              />
            </div>
          </div>

        </div>

        <div className="profile-page__actions">
          <button
            type="button"
            className="profile-btn profile-btn--discard"
            onClick={handleDiscard}
            disabled={!isDirty}
            style={{
              opacity: isDirty ? 1 : 0.45,
              cursor:  isDirty ? "pointer" : "not-allowed",
            }}
          >
            Discard Changes
          </button>

          <button
            type="button"
            className="profile-btn profile-btn--save"
            onClick={isDirty ? handleSaveChanges : undefined}
            disabled={!isDirty}
            aria-disabled={!isDirty}
            style={{
              opacity:   isDirty ? 1 : 0.5,
              cursor:    isDirty ? "pointer" : "not-allowed",
              boxShadow: isDirty ? "var(--shadow-primary)" : "none",
            }}
          >
            {isDirty ? "Save Changes" : "No Changes"}
          </button>
        </div>

      </div>

      {/* ── Modals ── */}

      {/*
       * key={String(modals.editProfile)}
       * When the modal opens (false → true) React sees a new key → unmount
       * the old instance and mount a fresh one. The lazy useState initializer
       * inside EditProfileModal runs with the current `userProfile` values.
       * No useEffect needed in the modal. StrictMode-safe.
       */}
      <EditProfileModal
        key={String(modals.editProfile)}
        isOpen={modals.editProfile}
        onClose={() => closeModal("editProfile")}
        user={userProfile}
        onSave={handleProfileSave}
      />

      <EditBusinessModal
        isOpen={modals.editBusiness}
        onClose={() => closeModal("editBusiness")}
        form={bizDraft}
        onChange={(f, v) => setBizDraft((p) => ({ ...p, [f]: v }))}
        onSave={handleBizSave}
      />

      <InviteUserModal
        isOpen={modals.invite}
        onClose={() => closeModal("invite")}
      />

      <ChangePasswordModal
        isOpen={modals.changePassword}
        onClose={() => closeModal("changePassword")}
      />

      <LoginHistoryModal
        isOpen={modals.loginHistory}
        onClose={() => closeModal("loginHistory")}
      />

      <LogoutConfirmModal
        isOpen={modals.logoutConfirm}
        onClose={() => closeModal("logoutConfirm")}
        onConfirm={handleLogoutConfirmed}
      />
    </>
  );
}