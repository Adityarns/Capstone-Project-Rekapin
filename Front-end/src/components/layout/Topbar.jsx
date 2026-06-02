/** @format */
/**
 * ============================================================
 * REKAPIN — Topbar Component
 * src/components/layout/Topbar.jsx
 * ============================================================
 * @format
 */

import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Impor fungsi-fungsi dari service, bukan lagi menggunakan api langsung
import {
  getPendingInvitations,
  acceptTeamInvitation,
  rejectTeamInvitation,
} from "../../services/dashboardService";

import LogoutConfirmModal from "../profile/LogoutConfirmModal";
import Notifications from "../dashboard/Notifications";

import "./Topbar.css";

/* ── Icons ───────────────────────────────────────────────────── */

const IconBell = () => (
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
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

// const IconHelp = () => (
//   <svg
//     width="18"
//     height="18"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="1.75"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <circle cx="12" cy="12" r="10" />
//     <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
//     <line x1="12" y1="17" x2="12.01" y2="17" />
//   </svg>
// );

/* ── Component ───────────────────────────────────────────────── */

export default function Topbar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // ── States untuk Notifikasi ──
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [notifLoadingId, setNotifLoadingId] = useState(null);

  // Menggunakan service untuk menarik data
  const fetchInvitations = async () => {
    try {
      const data = await getPendingInvitations();
      setInvitations(data);
    } catch (error) {
      console.error("Gagal menarik notifikasi:", error);
    }
  };

  useEffect(() => {
    const loadInvitations = async () => {
      await fetchInvitations();
    };

    loadInvitations();
  }, []);

  const handleOpenNotif = () => {
    setIsNotifOpen(true);
    fetchInvitations();
  };

  // Menggunakan service untuk menerima undangan
  const handleAcceptInvite = async (inviteCode) => {
    setNotifLoadingId(inviteCode);
    try {
      await acceptTeamInvitation(inviteCode);

      // Hapus undangan dari state lokal agar langsung hilang
      setInvitations((prev) =>
        prev.filter((inv) => inv.invitation_code !== inviteCode),
      );

      // Arahkan ke workspace tanpa membawa kode undangan di state
      navigate("/workspace", { replace: true });
    } catch (error) {
      alert(
        error.response?.data?.message ||
          error.message ||
          "Gagal menerima undangan",
      );
    } finally {
      setNotifLoadingId(null);
    }
  };

  // Menggunakan service untuk menolak undangan
  const handleRejectInvite = async (inviteCode) => {
    setNotifLoadingId(inviteCode);
    try {
      await rejectTeamInvitation(inviteCode);

      // Hapus dari state lokal
      setInvitations((prev) =>
        prev.filter((inv) => inv.invitation_code !== inviteCode),
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
          error.message ||
          "Gagal menolak undangan",
      );
    } finally {
      setNotifLoadingId(null);
    }
  };

  // ── Actions ──
  const handleLogoutConfirmed = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="topbar">
      <div className="topbar-welcome">
        <span>Welcome to Rekapin!</span>
      </div>

      {/* ── Right Actions ── */}
      <div className="topbar-actions">
        {/* Notification Bell */}
        <button
          className="topbar-icon-btn"
          type="button"
          aria-label="Notifications"
          onClick={handleOpenNotif}
        >
          <IconBell />
          {/* Badge titik merah hanya muncul jika ada data undangan */}
          {invitations.length > 0 && (
            <span className="topbar-notif-badge" aria-hidden="true" />
          )}
        </button>

        {/* Help */}
        {/* <button className="topbar-icon-btn" type="button" aria-label="Help">
          <IconHelp />
        </button> */}

        {/* User Avatar */}
        <div className="topbar-profile">
          <button
            className="topbar-avatar"
            type="button"
            aria-label={`User: ${user?.name || user?.username || "User"}`}
            title={user?.name || user?.username || "User"}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="topbar-avatar-image"
              />
            ) : (
              <span className="topbar-avatar-initials">
                {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
              </span>
            )}
          </button>

          {isMenuOpen && (
            <div className="topbar-dropdown">
              <button
                className="topbar-dropdown-item"
                onClick={() => {
                  navigate(`/profile/${user?.business_id}`);
                  setIsMenuOpen(false);
                }}
              >
                Profile
              </button>

              <button
                className="topbar-dropdown-item logout"
                onClick={() => {
                  setIsLogoutModalOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* ── Modals ── */}
        <LogoutConfirmModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={handleLogoutConfirmed}
        />

        <Notifications
          isOpen={isNotifOpen}
          onClose={() => setIsNotifOpen(false)}
          invitations={invitations}
          onAccept={handleAcceptInvite}
          onReject={handleRejectInvite}
          loadingId={notifLoadingId}
        />
      </div>
    </div>
  );
}
