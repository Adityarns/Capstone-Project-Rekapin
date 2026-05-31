import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
// Impor Login.css untuk mewarisi struktur background dan tata letak split-screen
import "./Login.css";
// Impor WorkSpace.css HANYA untuk styling isi kotak (card) pemilihan bisnis
import "./WorkSpace.css";

import LogoIcon from "../../assets/logo/Logo.png";
import LogoTulisan from "../../assets/logo/LogoTulisan.png";

export default function WorkSpace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth(); // ← Ambil updateUser dari context

  // Tangkap data dari hasil return loginUser() di halaman Login
  const authData = location.state?.authData;

  const [businesses, setBusinesses] = useState(authData?.businesses || []);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Proteksi rute: Jika tidak ada data auth, kembalikan ke login — GUNAKAN useEffect!
  useEffect(() => {
    if (!authData) {
      navigate("/login", { replace: true });
    }
  }, [authData, navigate]);

  const handleSelectBusiness = (business) => {
    // Simpan business_id ke localStorage DULU
    const storedUser = JSON.parse(localStorage.getItem("rekapin_user") || "{}");
    const updatedUser = {
      ...storedUser,
      business_id: business.business_id,
      business_name: business.business_name,
      role: business.role,
    };
    localStorage.setItem("rekapin_user", JSON.stringify(updatedUser));

    // Update context setelah navigate (biar tidak race condition)
    if (updateUser) {
      updateUser({
        business_id: business.business_id,
        business_name: business.business_name,
        role: business.role,
      });
    }

    // Navigasi ke dasbor spesifik
    navigate(`/dashboard/${business.business_id}`, { replace: true });
  };

  const handleJoinBusiness = async () => {
    if (!inviteCode.trim()) {
      setError("Kode undangan wajib diisi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/join", {
        invitationCode: inviteCode,
      });

      // 1. Ekstrak data dengan aman (menembus lapisan Axios apa pun)
      const newBusiness = response.data?.data || response.data || response;

      // 2. Jaring pengaman tambahan
      if (!newBusiness || !newBusiness.business_id) {
        throw new Error("Format data bisnis dari server tidak sesuai.");
      }

      // 3. Perbarui tampilan (opsional, karena kita akan langsung pindah)
      setBusinesses((prev) => [...prev, newBusiness]);
          
      // 4. LOGIKA MELOMPAT KE DASHBOARD (Ini yang Anda inginkan!)
      handleSelectBusiness(newBusiness);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Gagal bergabung dengan workspace.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("rekapin_user");
    localStorage.removeItem("rekapin_access_token");
    localStorage.removeItem("rekapin_refresh_token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="login-page">
      <aside className="login-left">
        <div className="login-brand">
          <img
            src={LogoIcon}
            alt=""
            className="login-brand-icon"
            aria-hidden="true"
          />
          <span className="login-brand-text">Rekapin</span>
        </div>

        <div className="login-left-content">
          <img src={LogoTulisan} alt="Rekapin" className="auth-panel-logo" />
          <div className="login-left-copy">
            <h1 className="login-left-heading">
              Grow your MSME
              <br />
              sustainably
            </h1>
            <p className="login-left-subtext">
              Institutional-grade financial insights and carbon tracking
              designed for modern, responsible business owners.
            </p>
          </div>
        </div>
      </aside>

      {/* KANAN: Form Pemilihan Workspace */}
      <main className="login-right" aria-label="Workspace Selection">
        <div className="login-right-inner">
          <div className="login-card fade-in-scale">
            <div className="login-card-header">
              <h2 className="login-title">Select Workspace</h2>
              <p className="login-subtitle">
                Choose the business you want to access today.
              </p>
            </div>

            {error && (
              <div className="login-api-error" role="alert" aria-live="polite">
                {error}
              </div>
            )}

            {/* List Bisnis */}
            <div className="ws-business-list">
              {businesses.length === 0 ? (
                <p className="ws-empty-msg">
                  Anda belum terhubung dengan bisnis apapun.
                </p>
              ) : (
                businesses.map((biz) => (
                  <div
                    key={biz.business_id}
                    className="ws-business-item group"
                    onClick={() => handleSelectBusiness(biz)}
                  >
                    <div className="ws-biz-info">
                      <span className="ws-biz-name">{biz.business_name}</span>
                      <span
                        className={`ws-biz-badge ws-biz-badge-${biz.role.toLowerCase()}`}
                      >
                        {biz.role}
                      </span>
                    </div>
                    <button className="ws-btn-select">
                      Select
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Divider OR */}
            <div className="ws-divider">
              <span>OR</span>
            </div>

            {/* Form Join */}
            <div className="form-field">
              <label className="form-label" htmlFor="invite-code">
                Enter Invitation Code
              </label>
              <div className="input-wrapper">
                <input
                  id="invite-code"
                  type="text"
                  className="form-input"
                  placeholder="e.g. ABC-123-XYZ"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>

            <button
              className="btn-primary-full ws-btn-join"
              onClick={handleJoinBusiness}
              disabled={loading}
              style={{ marginTop: "16px" }}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm" aria-hidden="true" />{" "}
                  Joining...
                </>
              ) : (
                <>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                  Join Business
                </>
              )}
            </button>

            {/* Cancel & Logout */}
            <div className="ws-footer-actions">
              <button
                className="link-subtle link-subtle--bold ws-btn-logout"
                onClick={handleLogout}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Cancel & Logout
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
