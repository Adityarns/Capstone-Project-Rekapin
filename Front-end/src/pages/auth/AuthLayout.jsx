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
import LogoIcon    from "../../assets/logo/Logo.png";
import LogoTulisan from "../../assets/logo/LogoTulisan.png";

export default function AuthLayout({ children }) {
  return (
    <div className="login-page">

      {/* LEFT — Branding, tidak pernah scroll */}
      <aside className="login-left" aria-label="Branding">

        {/* Top-left: mini brand — icon kecil + nama */}
        <div className="login-brand">
          <img src={LogoIcon} alt="" className="login-brand-icon" aria-hidden="true" />
          <span className="login-brand-text">Rekapin</span>
        </div>

        <div className="login-left-content">
          {/* Center: full logo dengan tulisan */}
          <img
            src={LogoTulisan}
            alt="Rekapin"
            className="auth-panel-logo"
          />
          <div className="login-left-copy">
            <h1 className="login-left-heading">
              Grow your MSME<br />sustainably
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
        <div className="login-right-inner">
          {children}
        </div>
      </main>

    </div>
  );
}