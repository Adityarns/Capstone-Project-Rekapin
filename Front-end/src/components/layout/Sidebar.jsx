/**
 * ============================================================
 * REKAPIN — Sidebar Component
 * src/components/layout/Sidebar.jsx
 * ============================================================
 * @format
 */

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LogoutConfirmModal from "../profile/LogoutConfirmModal";
import LogoIcon from "../../assets/logo/Logo.png";
import "./Sidebar.css";

/* ── Icons (inline SVG, zero dependency) ─────────────────────── */

const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconTransactions = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
    <path d="M7 15h2" />
    <path d="M12 15h5" />
  </svg>
);

const IconReports = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20V10" />
    <path d="M12 20V4" />
    <path d="M6 20v-6" />
  </svg>
);

const IconCarbon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3a6 6 0 0 0 6 9 6 6 0 0 0-6 9 6 6 0 0 0-6-9 6 6 0 0 0 6-9z" />
  </svg>
);

const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconSupport = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/* ── Navigation config ───────────────────────────────────────── */

const MAIN_NAV = [
  { to: "/dashboard", label: "Home", Icon: IconHome },
  { to: "/transactions", label: "Transactions", Icon: IconTransactions },
  { to: "/reports", label: "Reports", Icon: IconReports },
  { to: "/carbon", label: "Carbon Tracking", Icon: IconCarbon },
  { to: "/profile", label: "Settings", Icon: IconSettings },
];

/* ── Sidebar Component ───────────────────────────────────────── */

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const currentBusinessId = user?.business_id || "undefined";

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="sidebar" aria-label="Main navigation">
      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <img
          src={LogoIcon}
          alt=""
          className="sidebar-logo-icon"
          aria-hidden="true"
        />
        <div className="sidebar-logo-text-group">
          <p className="sidebar-logo-text">Rekapin</p>
          <p className="sidebar-logo-sub">MSME INTELLIGENCE</p>
        </div>
      </div>

      {/* ── CTA (PERBAIKAN 1: Mengubah kutip biasa menjadi backtick untuk interpolasi string) ── */}
      <div className="sidebar-cta-wrapper">
        <button
          className="sidebar-new-btn"
          type="button"
          onClick={() => navigate(`/transactions/${currentBusinessId}`)}
        >
          <IconPlus />
          New Transaction
        </button>
      </div>

      {/* ── Main Navigation ── */}
      <ul className="sidebar-nav-list" role="list">
        {MAIN_NAV.map(({ to, label, Icon }) => {
          // PERBAIKAN 2: Gabungkan alamat dasar dengan ID Bisnis aktif di sini
          const dynamicPath = `${to}/${currentBusinessId}`;

          return (
            <li key={to}>
              <NavLink
                to={dynamicPath} // Gunakan rute dinamis yang sudah dirakit
                end={to === "/dashboard"} // Match tepat hanya untuk halaman utama beranda
                className={({ isActive }) =>
                  ["sidebar-nav-item", isActive ? "sidebar-nav-item--active" : ""]
                    .join(" ")
                    .trim()
                }
              >
                <span className="sidebar-nav-icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="sidebar-nav-label">{label}</span>

                {/* Active indicator — right side bar */}
                <span className="sidebar-nav-indicator" aria-hidden="true" />
              </NavLink>
            </li>
          );
        })}
      </ul>

      {/* ── Bottom: Support + Logout ── */}
      <div className="sidebar-bottom">
        <div className="sidebar-divider" />

        <ul className="sidebar-nav-list" role="list">
          <li>
            <NavLink
              to={`/support/${currentBusinessId}`} // PERBAIKAN 3: Menyertakan ID Bisnis dinamis untuk rute support
              className={({ isActive }) =>
                ["sidebar-nav-item", isActive ? "sidebar-nav-item--active" : ""]
                  .join(" ")
                  .trim()
              }
            >
              <span className="sidebar-nav-icon" aria-hidden="true">
                <IconSupport />
              </span>
              <span className="sidebar-nav-label">Support</span>
              <span className="sidebar-nav-indicator" aria-hidden="true" />
            </NavLink>
          </li>

          <li>
            <button
              className="sidebar-nav-item sidebar-logout-btn"
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
            >
              <span className="sidebar-nav-icon" aria-hidden="true">
                <IconLogout />
              </span>
              <span className="sidebar-nav-label">Logout</span>
            </button>
          </li>
        </ul>
      </div>

      {/* ── Logout Confirmation Modal ── */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </nav>
  );
}