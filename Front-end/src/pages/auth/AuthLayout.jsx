/**
 * ============================================================
 *    REKAPIN — Auth Layout Shell
 *    src/pages/auth/AuthLayout.jsx
 *
 *    Dipakai oleh Login.jsx dan Register.jsx.
 *    Menerima `children` sebagai konten panel kanan.
 * ============================================================
 * @format
 */

import "./Login.css";

const ColorSwatch = () => (
  <div className="login-swatch-card" aria-hidden="true">
    <div className="login-swatch-row swatch-maroon" />
    <div className="login-swatch-row swatch-sage" />
    <div className="login-swatch-row swatch-beige" />
    <div className="login-swatch-row swatch-offwhite" />
  </div>
);

export default function AuthLayout({ children }) {
  return (
    <div className="login-page">
      {/* LEFT — Branding, tidak pernah scroll */}
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

      {/* RIGHT — Hanya panel ini yang scroll */}
      <main className="login-right" aria-label="Authentication">
        {/*
          .login-right-inner menggunakan margin: auto.
          Efeknya:
          - Card pendek (Login)   → ter-center vertikal sempurna
          - Card panjang (Register) → margin collapse ke 0,
            card dimulai dari atas, panel scroll
        */}
        <div className="login-right-inner">{children}</div>
      </main>
    </div>
  );
}
