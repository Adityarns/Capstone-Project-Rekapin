/**
 * ============================================================
 *    REKAPIN — Register Page (API-connected)
 *    src/pages/auth/Register.jsx
 *
 *    Perubahan dari versi sebelumnya:
 *    - Terhubung ke AuthContext via useAuth()
 *    - handleSubmit memanggil register() → POST /auth/register
 *    - Tambah: isSubmitting, apiError, apiSuccess state
 *    - FIELD MAPPING: fullName (frontend) → username (API)
 *    - Role selector (Owner/Employee) tetap sama
 * ============================================================
 * @format
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import AuthLayout from "./AuthLayout";
import {
  IconEmail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconTicket,
  IconUser,
  IconBuilding,
  IconArrowRight,
} from "./authIcons";
import "./Register.css";

/* ── Role Config ── */
const ROLES = [
  { value: "owner", label: "Owner" },
  { value: "employee", label: "Employee" },
];

function RoleSelector({ role, onChange }) {
  return (
    <div className="reg-role-selector">
      <span className="reg-role-label">REGISTER AS:</span>
      <div className="reg-role-pills" role="group" aria-label="Register as">
        {ROLES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={[
              "reg-role-pill",
              role === value ? "reg-role-pill--active" : "",
            ]
              .join(" ")
              .trim()}
            onClick={() => onChange(value)}
            aria-pressed={role === value}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function Register() {
  const navigate = useNavigate();
  const { register, login, updateUser } = useAuth(); // ← ambil register(), login(), updateUser dari context

  const [role, setRole] = useState("owner");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // ← NEW
  const [apiError, setApiError] = useState(""); // ← NEW
  const [apiSuccess, setApiSuccess] = useState(false); // ← NEW

  const [form, setForm] = useState({
    fullName: "",
    businessName: "",
    email: "",
    password: "",
    confirmPassword: "",
    invitationCode: "",
  });
  const [errors, setErrors] = useState({});

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === "owner") {
      // Owner: bersihkan businessName saja (invitationCode tetap perlu)
      setForm((prev) => ({ ...prev, businessName: "" }));
      setErrors((prev) => {
        const n = { ...prev };
        delete n.businessName;
        return n;
      });
    } else if (newRole === "employee") {
      // Employee: bersihkan businessName (tidak perlu)
      setForm((prev) => ({ ...prev, businessName: "" }));
      setErrors((prev) => {
        const n = { ...prev };
        delete n.businessName;
        return n;
      });
    }
    setApiError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (apiError) setApiError("");
  };

  const validate = () => {
    const err = {};
    if (!form.fullName.trim()) err.fullName = "Full name is required.";

    if (role === "owner" && !form.businessName.trim())
      err.businessName = "Business name is required.";

    // Invitation code wajib untuk owner dan employee
    if (!form.invitationCode.trim())
      err.invitationCode = "Invitation code is required.";

    if (!form.email.trim()) err.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      err.email = "Enter a valid email address.";

    if (!form.password) err.password = "Password is required.";
    else if (form.password.length < 8)
      err.password = "Password must be at least 8 characters.";

    if (!form.confirmPassword)
      err.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword)
      err.confirmPassword = "Passwords do not match.";

    if (!agreeTerms) err.terms = "You must agree to the terms to continue.";

    return err;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend validation
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setIsSubmitting(true);
    setApiError("");

    // 1. Eksekusi Registrasi
    const result = await register({
      role,
      fullName: form.fullName,
      businessName: form.businessName,
      email: form.email,
      password: form.password,
      invitationCode: form.invitationCode,
    });

    if (result.success) {
      setApiSuccess(true);

      // 2. AUTO-LOGIN DI BALIK LAYAR
      const loginResult = await login({
        email: form.email,
        password: form.password,
      });

      // 3. NAVIGASI LANGSUNG KE DASHBOARD
      setTimeout(() => {
        if (loginResult.success && loginResult.businesses?.length > 0) {
          // Ambil bisnis pertama (owner atau employee)
          const newBusiness = loginResult.businesses[0];

          // Update user context dengan business_id dan role
          if (updateUser) {
            updateUser({
              business_id: newBusiness.business_id,
              role: newBusiness.role,
              business_name: newBusiness.business_name,
            });
          }

          // Langsung ke Dashboard
          navigate(`/dashboard/${newBusiness.business_id}`, { replace: true });
        } else {
          // Jika login gagal atau tidak ada bisnis, ke login page
          console.error("Login gagal setelah register:", loginResult);
          navigate("/login", { replace: true });
        }
      }, 1500);
    } else {
      setIsSubmitting(false);
      setApiError(result.message || "Registrasi gagal. Coba lagi.");
    }
  };

  const isOwner = role === "owner";
  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  return (
    <AuthLayout>
      <div className="login-card reg-card fade-in-scale">
        <div className="login-card-header">
          <h2 className="login-title">Welcome</h2>
          <p className="login-subtitle">
            Log in or create an account to continue.
          </p>
        </div>

        <div className="login-tabs" role="tablist">
          <button
            role="tab"
            aria-selected="false"
            className="login-tab"
            type="button"
            onClick={() => navigate("/login")}
          >
            Log In
          </button>
          <button
            role="tab"
            aria-selected="true"
            className="login-tab login-tab--active"
            type="button"
          >
            Register
          </button>
        </div>

        <RoleSelector role={role} onChange={handleRoleChange} />

        {/* ── Success Banner ── */}
        {apiSuccess && (
          <div className="login-api-success" role="status">
            ✓ Akun berhasil dibuat! Mengalihkan ke dashboard...
          </div>
        )}

        {/* ── Error Banner ── */}
        {apiError && (
          <div className="login-api-error" role="alert" aria-live="polite">
            {apiError}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name — selalu tampil */}
          <div className="form-field">
            <label className="form-label" htmlFor="reg-fullName">
              Full Name
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <IconUser />
              </span>
              <input
                id="reg-fullName"
                name="fullName"
                type="text"
                className={`form-input ${errors.fullName ? "form-input--error" : ""}`}
                placeholder="John Doe"
                value={form.fullName}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>
            {errors.fullName && (
              <span className="form-error" role="alert">
                {errors.fullName}
              </span>
            )}
          </div>

          {/* Business Name — Owner only */}
          {isOwner && (
            <div className="form-field">
              <label className="form-label" htmlFor="reg-businessName">
                Business / UMKM Name
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <IconBuilding />
                </span>
                <input
                  id="reg-businessName"
                  name="businessName"
                  type="text"
                  className={`form-input ${errors.businessName ? "form-input--error" : ""}`}
                  placeholder="Company Ltd"
                  value={form.businessName}
                  onChange={handleChange}
                  autoComplete="organization"
                  required
                />
              </div>
              {errors.businessName && (
                <span className="form-error" role="alert">
                  {errors.businessName}
                </span>
              )}
            </div>
          )}

          {/* Email */}
          <div className="form-field">
            <label className="form-label" htmlFor="reg-email">
              Email Address
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <IconEmail />
              </span>
              <input
                id="reg-email"
                name="email"
                type="email"
                className={`form-input ${errors.email ? "form-input--error" : ""}`}
                placeholder="name@company.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>
            {errors.email && (
              <span className="form-error" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="form-field">
            <label className="form-label" htmlFor="reg-password">
              Password
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <IconLock />
              </span>
              <input
                id="reg-password"
                name="password"
                type={showPassword ? "text" : "password"}
                className={`form-input form-input--password ${errors.password ? "form-input--error" : ""}`}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="input-toggle-password"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
            {errors.password ? (
              <span className="form-error" role="alert">
                {errors.password}
              </span>
            ) : (
              <span className="form-hint">At least 8 characters</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-field">
            <label className="form-label" htmlFor="reg-confirm">
              Confirm Password
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <IconLock />
              </span>
              <input
                id="reg-confirm"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className={`form-input form-input--password ${
                  errors.confirmPassword
                    ? "form-input--error"
                    : passwordsMatch
                      ? "form-input--success"
                      : ""
                }`}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="input-toggle-password"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={
                  showConfirmPassword
                    ? "Sembunyikan password"
                    : "Tampilkan password"
                }
              >
                {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="form-error" role="alert">
                {errors.confirmPassword}
              </span>
            )}
            {passwordsMatch && !errors.confirmPassword && (
              <span className="form-success">Passwords match ✓</span>
            )}
          </div>

          <div className="form-field">
            <div className="form-label-row">
              <label className="form-label" htmlFor="reg-code">
                Invitation Code
              </label>
              <span className="form-label-badge form-label-badge--required">
                Required
              </span>
            </div>
            <div className="input-wrapper">
              <span className="input-icon">
                <IconTicket />
              </span>
              <input
                id="reg-code"
                name="invitationCode"
                type="text"
                className={`form-input ${errors.invitationCode ? "form-input--error" : ""}`}
                placeholder={
                  role === "owner"
                    ? "e.g. REKAPIN-2024-OWN"
                    : "e.g. REKAPIN-2024"
                }
                value={form.invitationCode}
                onChange={handleChange}
                autoComplete="off"
                required
              />
            </div>
            {errors.invitationCode && (
              <span className="form-error" role="alert">
                {errors.invitationCode}
              </span>
            )}
          </div>

          {/* Terms */}
          <div className="form-field">
            <label className="checkbox-label reg-terms-label">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={agreeTerms}
                onChange={(e) => {
                  setAgreeTerms(e.target.checked);
                  if (errors.terms) setErrors((p) => ({ ...p, terms: "" }));
                }}
              />
              <span className="checkbox-custom" aria-hidden="true" />
              <span className="checkbox-text">
                I agree to the{" "}
                <button type="button" className="link-subtle link-subtle--bold">
                  Terms of Service
                </button>{" "}
                and{" "}
                <button type="button" className="link-subtle link-subtle--bold">
                  Privacy Policy
                </button>
                .
              </span>
            </label>
            {errors.terms && (
              <span className="form-error" role="alert">
                {errors.terms}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary-full"
            disabled={isSubmitting || apiSuccess}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner spinner-sm" aria-hidden="true" />{" "}
                Membuat akun...
              </>
            ) : (
              <>
                Create Account <IconArrowRight />
              </>
            )}
          </button>
        </form>

        <p className="login-legal">
          Already have an account?{" "}
          <button
            type="button"
            className="link-subtle link-subtle--bold"
            onClick={() => navigate("/login")}
          >
            Log In
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}
