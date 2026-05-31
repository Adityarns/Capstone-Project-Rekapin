    /**
     * ============================================================
     * REKAPIN — Login Page (API-connected)
     * src/pages/auth/Login.jsx
     * ============================================================
     * @format
     */

    import { useState } from "react";
    import { useNavigate } from "react-router-dom";
    import { useAuth } from "../../context/AuthContext";
    import "./Login.css";
    import LogoIcon from "../../assets/logo/Logo.png";
    import LogoTulisan from "../../assets/logo/LogoTulisan.png";

    const IconEmail = () => (
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
        <rect x="2" y="4" width="20" height="16" rx="3" />
        <path d="m2 7 10 7 10-7" />
      </svg>
    );
    const IconLock = () => (
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
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    );
    const IconEye = () => (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
    const IconEyeOff = () => (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );

    export default function Login() {
      const navigate = useNavigate();
      const { login } = useAuth();

      const [showPassword, setShowPassword] = useState(false);
      const [rememberMe, setRememberMe] = useState(false);
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [apiError, setApiError] = useState("");

      const [form, setForm] = useState({
        email: "",
        password: "",
      });

      const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (apiError) setApiError("");
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setApiError("");

        const result = await login({
          email: form.email,
          password: form.password,
        });

        setIsSubmitting(false);

        if (result.success) {
          // 2. Arahkan ke ruang tunggu Workspace Selection, bukan langsung ke Dasbor
          navigate("/workspace", {
            replace: true,
            state: { authData: result },
          });
        } else {
          setApiError(result.message || "Login gagal. Periksa email dan password.");
        }
      };

      return (
        <div className="login-page">
          <aside className="login-left" aria-label="Branding">
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

          <main className="login-right" aria-label="Authentication">
            <div className="login-right-inner">
              <div className="login-card fade-in-scale">
                <div className="login-card-header">
                  <h2 className="login-title">Welcome</h2>
                  <p className="login-subtitle">
                    Log in or create an account to continue.
                  </p>
                </div>

                <div className="login-tabs" role="tablist">
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

                {apiError && (
                  <div className="login-api-error" role="alert" aria-live="polite">
                    {apiError}
                  </div>
                )}

                <form className="login-form" onSubmit={handleSubmit} noValidate>
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
                        aria-label={
                          showPassword
                            ? "Sembunyikan password"
                            : "Tampilkan password"
                        }
                      >
                        {showPassword ? <IconEyeOff /> : <IconEye />}
                      </button>
                    </div>
                  </div>

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

                  {/* BLOK INVITATION CODE TELAH DIHAPUS DARI SINI */}

                  <button
                    type="submit"
                    className="btn-primary-full"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner spinner-sm" aria-hidden="true" />{" "}
                        Masuk...
                      </>
                    ) : (
                      <>
                        Continue{" "}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

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
            </div>
          </main>
        </div>
      );
    }
