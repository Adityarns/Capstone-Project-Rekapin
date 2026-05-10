/**
 * ============================================================
 *    REKAPIN — Login Page
 *    src/pages/auth/Login.jsx
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
  IconArrowRight,
} from "./authIcons";

export default function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    invitationCode: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Supabase sign-in
    console.log("Login submitted:", { ...form, rememberMe });
  };

  return (
    <AuthLayout>
      <div className="login-card fade-in-scale">
        {/* Header */}
        <div className="login-card-header">
          <h2 className="login-title">Welcome back</h2>
          <p className="login-subtitle">Log in to your Rekapin account.</p>
        </div>

        {/* Tab Switcher */}
        <div
          className="login-tabs"
          role="tablist"
          aria-label="Authentication mode"
        >
          <button
            role="tab"
            aria-selected="true"
            className="login-tab login-tab--active"
            type="button"
          >
            Log In
          </button>
          <button
            role="tab"
            aria-selected="false"
            className="login-tab"
            type="button"
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="form-field">
            <label className="form-label" htmlFor="login-email">
              Email Address
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <IconEmail />
              </span>
              <input
                id="login-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="name@company.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-field">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <IconLock />
              </span>
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="form-input form-input--password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
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
          </div>

          {/* Remember me + Forgot password */}
          <div className="form-row-meta">
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkbox-custom" aria-hidden="true" />
              <span className="checkbox-text">Remember me</span>
            </label>
            <button type="button" className="link-subtle">
              Forgot password?
            </button>
          </div>

          {/* Invitation Code */}
          <div className="form-field">
            <div className="form-label-row">
              <label className="form-label" htmlFor="login-code">
                Invitation Code
              </label>
              <span className="form-label-badge">Optional</span>
            </div>
            <div className="input-wrapper">
              <span className="input-icon">
                <IconTicket />
              </span>
              <input
                id="login-code"
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

          {/* Submit */}
          <button type="submit" className="btn-primary-full">
            Continue <IconArrowRight />
          </button>
        </form>

        {/* Legal */}
        <p className="login-legal">
          By continuing, you agree to our{" "}
          <button type="button" className="link-subtle link-subtle--bold">
            Terms of Service
          </button>{" "}
          and{" "}
          <button type="button" className="link-subtle link-subtle--bold">
            Privacy Policy
          </button>
          .
        </p>
      </div>
    </AuthLayout>
  );
}
