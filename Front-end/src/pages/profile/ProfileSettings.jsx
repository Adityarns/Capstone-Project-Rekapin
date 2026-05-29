/**
 * ============================================================
 * REKAPIN — Profile & Settings Page
 * src/pages/profile/ProfileSettings.jsx
 * ============================================================
 * @format
 */

import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { updateBusiness, getBusinessById } from "../../services/businessService";
import { useEffect } from "react";
import { getTeamMembers } from "../../services/teamService";

import ProfileCard from "../../components/profile/ProfileCard";
import BusinessInfo from "../../components/profile/BusinessInfo";
import TeamManagement from "../../components/profile/TeamManagement";
import NotificationsCard from "../../components/profile/NotificationsCard";
import SecurityCard from "../../components/profile/SecurityCard";

import EditProfileModal from "../../components/profile/EditProfileModal";
import EditBusinessModal from "../../components/profile/EditBusinessModal";
import InviteUserModal from "../../components/profile/InviteUserModal";
import ChangePasswordModal from "../../components/profile/ChangePasswordModal";
import LoginHistoryModal from "../../components/profile/LoginHistoryModal";
import LogoutConfirmModal from "../../components/profile/LogoutConfirmModal";

import {
  mockBusiness,
  mockNotifications,
} from "../../data/profileData";

import {
  updateUserProfile,
  uploadUserAvatar,
} from "../../services/authService";
import "./ProfileSettings.css";

/* ── Helpers ── */
const INIT_PROFILE = (user) => ({
  name: user?.name || "",
  email: user?.email || "",
  phone: user?.phone || "",
  avatarSrc: user?.avatar_url || user?.avatarSrc || "",
  avatar_url: user?.avatar_url || user?.avatarSrc || "",
});

const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ══════════════════════════════════════════════════════════ */

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { businessId } = useParams();
  const { logout, user, updateUser } = useAuth();

  const DEMO_ROLE = user?.role || "owner";
  const isOwner = DEMO_ROLE === "owner";

  // State pembantu melacak rekam jejak user
  const [prevUser, setPrevUser] = useState(user);

  /* ── Current state ── */
  const [userProfile, setUserProfile] = useState(() => INIT_PROFILE(user));
  const [business, setBusiness] = useState({ ...mockBusiness });
  const [bizDraft, setBizDraft] = useState({ ...mockBusiness });
  const [teamMembers, setTeamMembers] = useState([]);
  const [notifications, setNotifications] = useState({ ...mockNotifications });

  const [savedSnapshot, setSavedSnapshot] = useState(() => ({
    profile: { ...INIT_PROFILE(user) },
    business: { ...mockBusiness },
    notifs: { ...mockNotifications },
  }));

  // Sinkronisasi data di fase rendering (Anti-cascading)
  if (user !== prevUser) {
    setPrevUser(user);
    const freshProfile = INIT_PROFILE(user);

    setUserProfile(freshProfile);
    setSavedSnapshot((prev) => ({
      ...prev,
      profile: freshProfile,
    }));
  }

  /* ── Dirty State Checking ── */
  const isDirty = useMemo(
    () =>
      !isEqual(userProfile, savedSnapshot.profile) ||
      !isEqual(business, savedSnapshot.business) ||
      !isEqual(notifications, savedSnapshot.notifs),
    [userProfile, business, notifications, savedSnapshot],
  );

  /* ── Modal Open/Close State ── */
  const [modals, setModals] = useState({
    editProfile: false,
    editBusiness: false,
    invite: false,
    changePassword: false,
    loginHistory: false,
    logoutConfirm: false,
  });

  const openModal = (key) => setModals((p) => ({ ...p, [key]: true }));
  const closeModal = (key) => setModals((p) => ({ ...p, [key]: false }));

  /* ── Handlers ── */
  const handleOpenEditBiz = () => {
    setBizDraft({ ...business });
    openModal("editBusiness");
  };

  const handleBizSave = async (saved) => {
    try {
      if (!businessId) {
        console.error("Business ID tidak ditemukan dari URL parameter");
        return;
      }

      if (typeof updateBusiness === "function") {
        await updateBusiness(businessId, saved);
      } else {
        console.log("Menembak API PUT /businesses/" + businessId, saved);
      }

      setBusiness({ ...saved });
      closeModal("editBusiness");
      console.log("Business updated successfully with ID:", businessId);
    } catch (err) {
      console.error("Failed to update business profile:", err);
    }
  }; 

  const handleProfileSave = async (saved) => {
    try {
      let avatarUrl = user?.avatarSrc;
      if (saved.avatarFile) {
        const avatarResponse = await uploadUserAvatar(
          user.userId,
          saved.avatarFile,
        );
        avatarUrl = avatarResponse.avatarUrl;
      }

      await updateUserProfile(user.userId, {
        name: saved.name,
        email: saved.email,
        role: user.role,
      });

      setUserProfile((prev) => ({
        ...prev,
        name: saved.name,
        email: saved.email,
        phone: saved.phone,
        avatarSrc: avatarUrl,
        avatar_url: avatarUrl,
      }));

      updateUser({
        name: saved.name,
        email: saved.email,
        avatarSrc: avatarUrl,
        avatar_url: avatarUrl,
      });

      console.log("Profile updated successfully");
    } catch (err) {
      console.error("Failed update profile:", err);
    }
  };

  const handleNotifChange = (key, value) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveChanges = () => {
    setSavedSnapshot({
      profile: { ...userProfile },
      business: { ...business },
      notifs: { ...notifications },
    });
    console.log("Saved globally to DB:", {
      userProfile,
      business,
      notifications,
    });
  };

  const handleDiscard = () => {
    setUserProfile({ ...savedSnapshot.profile });
    setBusiness({ ...savedSnapshot.business });
    setNotifications({ ...savedSnapshot.notifs });
  };

  const handleLogoutConfirmed = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const currentRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Owner";

  const currentBusinessName =
    user?.business_name || user?.businessName || business.name;

  const displayUser = {
    ...userProfile,
    businessRole: `${currentRole} at ${currentBusinessName}`,
  };

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        if (!businessId) return;

        const data = await getBusinessById(businessId);

        const members = await getTeamMembers(businessId);
        console.log("RAW MEMBERS:", members);
        console.log(
          "MEMBER PERTAMA:",
          JSON.stringify(members[0], null, 2)
        );

        setTeamMembers(
          members.map((member, index) => ({
            id: index,
            name: member.username,
            email: "-",
            role:
              member.role === "owner"
                ? "Owner"
                : "Employee",
            initials: member.username
              ?.split(" ")
              .map((word) => word[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
          }))
        );

        console.log("BUSINESS API:", data);

        if (!data) {
          console.error("Data business kosong");
          return;
        }

        setBusiness({
          name: data.business_name,
          industry: data.industry,
          phone: data.phone_number,
          address: data.address,
          invitationCode: data.invitation_code,
        });

        setBizDraft({
          name: data.business_name,
          industry: data.industry,
          phone: data.phone_number,
          address: data.address,
          invitationCode: data.invitation_code,
        });
      } catch (err) {
        console.error("Failed load business:", err);
      }
    };

    loadBusiness();
  }, [businessId]);

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
              team={teamMembers}
              invitationCode={business.invitationCode}
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
                onLoginHistory={() => openModal("loginHistory")}
                onLogout={() => openModal("logoutConfirm")}
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
              cursor: isDirty ? "pointer" : "not-allowed",
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
              opacity: isDirty ? 1 : 0.5,
              cursor: isDirty ? "pointer" : "not-allowed",
              boxShadow: isDirty ? "var(--shadow-primary)" : "none",
            }}
          >
            {isDirty ? "Save Changes" : "No Changes"}
          </button>
        </div>
      </div>

      {/* ── Modals Components ── */}
      <EditProfileModal
        key={`profile-modal-${String(modals.editProfile)}`}
        isOpen={modals.editProfile}
        onClose={() => closeModal("editProfile")}
        user={userProfile}
        onSave={handleProfileSave}
      />

      <EditBusinessModal
        key={`biz-modal-${String(modals.editBusiness)}`}
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
