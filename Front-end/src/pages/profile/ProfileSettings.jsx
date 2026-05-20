/**
 * ============================================================
 *    REKAPIN — Profile & Settings Page
 *    src/pages/profile/ProfileSettings.jsx
 *
 *    Switch DEMO_ROLE to "employee" to test role-based UI.
 * ============================================================
 */

import { useState } from "react";

import ProfileCard        from "../../components/profile/ProfileCard";
import BusinessInfo       from "../../components/profile/BusinessInfo";
import TeamManagement     from "../../components/profile/TeamManagement";
import NotificationsCard  from "../../components/profile/NotificationsCard";
import SecurityCard       from "../../components/profile/SecurityCard";
import EditBusinessModal  from "../../components/profile/EditBusinessModal";
import InviteUserModal    from "../../components/profile/InviteUserModal";

import {
  mockUser,
  mockBusiness,
  mockTeam,
  mockNotifications,
} from "../../data/profileData";

import "./ProfileSettings.css";

/* Change to "employee" to preview employee role-based UI */
const DEMO_ROLE = mockUser.role; // "owner" | "employee"

export default function ProfileSettings() {
  const isOwner = DEMO_ROLE === "owner";

  /* Business state */
  const [business, setBusiness] = useState({ ...mockBusiness });
  const [bizDraft, setBizDraft] = useState({ ...mockBusiness });

  /* Notification toggles */
  const [notifications, setNotifications] = useState({ ...mockNotifications });

  /* Modal visibility */
  const [editBizOpen, setEditBizOpen] = useState(false);
  const [inviteOpen,  setInviteOpen]  = useState(false);

  /* Handlers */
  const handleOpenEditBiz = () => {
    setBizDraft({ ...business });
    setEditBizOpen(true);
  };

  const handleBizSave = (saved) => {
    setBusiness({ ...saved });
  };

  const handleNotifChange = (key, value) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveChanges = () => {
    console.log("Save changes:", { business, notifications });
    // TODO: PATCH /users/:id + PATCH /notifications
  };

  const handleDiscard = () => {
    setBusiness({ ...mockBusiness });
    setNotifications({ ...mockNotifications });
  };

  const user = {
    ...mockUser,
    businessRole: isOwner
      ? `Owner at ${business.name}`
      : `Employee at ${business.name}`,
  };

  return (
    <>
      <div className="profile-page">

        {/* Page Header */}
        <header className="profile-page__header">
          <h1 className="profile-page__title">Profile & Settings</h1>
          <p className="profile-page__subtitle">
            Manage your account, business details, and preferences.
          </p>
        </header>

        {/* Main grid */}
        <div className="profile-grid">

          {/* Left column: Profile + Business Info */}
          <div className="profile-grid__left">
            <ProfileCard user={user} />
            <BusinessInfo
              business={business}
              isOwner={isOwner}
              onEdit={handleOpenEditBiz}
            />
          </div>

          {/* Right column: Team + Notif + Security */}
          <div className="profile-grid__right">
            <TeamManagement
              team={mockTeam}
              isOwner={isOwner}
              onInvite={() => setInviteOpen(true)}
            />
            <div className="profile-grid__bottom-row">
              <NotificationsCard
                settings={notifications}
                onChange={handleNotifChange}
              />
              <SecurityCard />
            </div>
          </div>

        </div>

        {/* Page-level action buttons */}
        <div className="profile-page__actions">
          <button
            type="button"
            className="profile-btn profile-btn--discard"
            onClick={handleDiscard}
          >
            Discard Changes
          </button>
          <button
            type="button"
            className="profile-btn profile-btn--save"
            onClick={handleSaveChanges}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save Changes
          </button>
        </div>

      </div>

      {/* Modals — outside .profile-page to avoid z-index issues */}
      <EditBusinessModal
        isOpen={editBizOpen}
        onClose={() => setEditBizOpen(false)}
        form={bizDraft}
        onChange={(f, v) => setBizDraft((p) => ({ ...p, [f]: v }))}
        onSave={handleBizSave}
      />
      <InviteUserModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </>
  );
}