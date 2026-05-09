import { useState } from 'react'
import './Login.css'

/* ── SVG Icons (inline, no external dependency) ─────────────── */
const IconEmail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="m2 7 10 7 10-7" />
  </svg>
)

const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const IconTicket = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
    <line x1="9" y1="12" x2="15" y2="12" />
  </svg>
)

/* ── Color Palette Swatch (left panel decoration) ────────────── */
const ColorSwatch = () => (
  <div className="login-swatch-card" aria-hidden="true">
    <div className="login-swatch-row swatch-maroon" />
    <div className="login-swatch-row swatch-sage" />
    <div className="login-swatch-row swatch-beige" />
    <div className="login-swatch-row swatch-offwhite" />
  </div>
)

/* ── Main Component ──────────────────────────────────────────── */
export default function Login() {
  const [activeTab, setActiveTab]       = useState('login')   // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe]     = useState(false)

  const [form, setForm] = useState({
    email:          '',
    password:       '',
    invitationCode: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: connect to Supabase / backend API
    console.log('Form submitted:', { ...form, rememberMe, tab: activeTab })
  }

  return (
    <div className="login-page">

      {/* ── LEFT — Branding Panel ── */}
      <aside className="login-left" aria-label="Branding">
        <span className="login-brand">Rekapin</span>

        <div className="login-left-content">
          <ColorSwatch />

          <div className="login-left-copy">
            <h1 className="login-left-heading">
              Grow your MSME<br />sustainably
            </h1>
            <p className="login-left-subtext">
              Institutional-grade financial insights and carbon
              tracking designed for modern, responsible business owners.
            </p>
          </div>
        </div>
      </aside>

      {/* ── RIGHT — Form Panel ── */}
      <main className="login-right" aria-label="Authentication">
        <div className="login-card fade-in-scale">

          {/* Card Header */}
          <div className="login-card-header">
            <h2 className="login-title">Welcome</h2>
            <p className="login-subtitle">
              Log in or create an account to continue.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="login-tabs" role="tablist" aria-label="Authentication mode">
            <button
              role="tab"
              aria-selected={activeTab === 'login'}
              className={`login-tab ${activeTab === 'login' ? 'login-tab--active' : ''}`}
              onClick={() => setActiveTab('login')}
              type="button"
            >
              Log In
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'register'}
              className={`login-tab ${activeTab === 'register' ? 'login-tab--active' : ''}`}
              onClick={() => setActiveTab('register')}
              type="button"
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="form-field">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <div className="input-wrapper">
                <span className="input-icon"><IconEmail /></span>
                <input
                  id="email"
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
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="input-wrapper">
                <span className="input-icon"><IconLock /></span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input form-input--password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  className="input-toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password row */}
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

            {/* Invitation Code (optional) */}
            <div className="form-field">
              <div className="form-label-row">
                <label className="form-label" htmlFor="invitationCode">
                  Invitation Code
                </label>
                <span className="form-label-badge">Optional</span>
              </div>
              <div className="input-wrapper">
                <span className="input-icon"><IconTicket /></span>
                <input
                  id="invitationCode"
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
              Continue
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

          </form>

          {/* Legal */}
          <p className="login-legal">
            By continuing, you agree to our{' '}
            <button type="button" className="link-subtle link-subtle--bold">
              Terms of Service
            </button>
            {' '}and{' '}
            <button type="button" className="link-subtle link-subtle--bold">
              Privacy Policy
            </button>
            .
          </p>

        </div>
      </main>

    </div>
  )
}
