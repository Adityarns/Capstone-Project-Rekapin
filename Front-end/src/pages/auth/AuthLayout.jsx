/**
 * ============================================================
 *    REKAPIN — Auth Layout Shell
 *    src/pages/auth/AuthLayout.jsx
 *
 *    Dipakai oleh Login.jsx dan Register.jsx.
 *    Menerima `children` sebagai konten panel kanan (form card).
 *    ============================================================
 *
 * @format
 */

import "./Login.css";

/* ── Color Palette Swatch ────────────────────────────────────── */
const ColorSwatch = () => (
  <div className="login-swatch-card" aria-hidden="true">
    <div className="login-swatch-row swatch-maroon" />
    <div className="login-swatch-row swatch-sage" />
    <div className="login-swatch-row swatch-beige" />
    <div className="login-swatch-row swatch-offwhite" />
  </div>
);

/* ── AuthLayout ──────────────────────────────────────────────── */
export default function AuthLayout({ children }) {
  return (
    <div className="login-page">
      {/* ── LEFT — Branding Panel ── */}
      <aside className="login-left" aria-label="Branding">
        <span className="login-brand">Rekapin</span>

        <div className="login-left-content">
          <ColorSwatch />

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

      {/* ── RIGHT — Form Slot ── */}
      <main className="login-right" aria-label="Authentication">
        {children}
      </main>
    </div>
  );
}
