/**
 * ============================================================
 *    REKAPIN — Register Page
 *    src/pages/auth/Register.jsx
 *
 *    Reuses: AuthLayout, Login.css (base styles), authIcons
 *    Register.css hanya tambahan register-specific
 *    ============================================================
 *
 * @format
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

/* ── Main Component ──────────────────────────────────────────── */
export default function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    businessName: "",
    email: "",
    password: "",
    confirmPassword: "",
    invitationCode: "",
  });

  const [errors, setErrors] = useState({});

  /* ── Handlers ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const err = {};
    if (!form.fullName.trim()) err.fullName = "Full name is required.";
    if (!form.businessName.trim())
      err.businessName = "Business name is required.";
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    // TODO: Supabase sign-up
    console.log("Register submitted:", form);
  };

  /* ── Derived state ── */
  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  /* ── Render ── */
  return (
    <AuthLayout>
      <div className="login-card reg-card fade-in-scale">
        {/* Header */}
        <div className="login-card-header">
          <h2 className="login-title">Welcome</h2>
          <p className="login-subtitle">
            Log in or create an account to continue.
          </p>
        </div>

        {/* Tab Switcher — Register tab active, Log In navigates */}
        <div
          className="login-tabs"
          role="tablist"
          aria-label="Authentication mode"
        >
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

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
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

          {/* Business / UMKM Name */}
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
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
            {/* Always show hint; show error only when validation fires */}
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
                  showConfirmPassword ? "Hide password" : "Show password"
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

          {/* Invitation Code — optional */}
          <div className="form-field">
            <div className="form-label-row">
              <label className="form-label" htmlFor="reg-code">
                Invitation Code
              </label>
              <span className="form-label-badge">Optional</span>
            </div>
            <div className="input-wrapper">
              <span className="input-icon">
                <IconTicket />
              </span>
              <input
                id="reg-code"
                name="invitationCode"
                type="text"
                className="form-input"
                placeholder="e.g. REKAPIN-2024"
                value={form.invitationCode}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Terms & Conditions */}
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

          {/* Submit */}
          <button type="submit" className="btn-primary-full">
            Create Account <IconArrowRight />
          </button>
        </form>

        {/* Footer */}
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
