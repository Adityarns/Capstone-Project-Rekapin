/**
 * ============================================================
 *    REKAPIN — Team Hero Component
 *    src/components/team/TeamHero.jsx
 *
 *    Hero section for the /support (Our Team) page.
 *    Contains: badge, title, description, decorative illustration.
 * ============================================================
 *
 * @format
 */

import "./TeamHero.css";

/* ── Small people icon for badge ── */
const IconPeople = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

/* ── Large silhouette for decoration ── */
const IconUser = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
  >
    <circle cx="12" cy="8" r="4" opacity="0.5" />
    <path
      d="M20 21a8 8 0 1 0-16 0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      opacity="0.5"
    />
  </svg>
);

export default function TeamHero() {
  /* Generate decorative dots (4x4 grid) */
  const dots = Array.from({ length: 16 }, (_, i) => (
    <span key={i} className="team-hero__dot" />
  ));

  return (
    <section className="team-hero" aria-labelledby="team-hero-title">
      {/* ── Badge ── */}
      <div className="team-hero__badge">
        <span className="team-hero__badge-icon">
          <IconPeople />
        </span>
        OUR TEAM
      </div>

      {/* ── Title ── */}
      <h1 id="team-hero-title" className="team-hero__title">
        Meet Our <span className="team-hero__title-accent">Team</span>
      </h1>

      {/* ── Description ── */}
      <div className="team-hero__desc-wrapper">
        <span className="team-hero__desc-bar" aria-hidden="true" />
        <p className="team-hero__desc">
          The people behind Rekapin — Mini ERP SaaS for MSMEs.
        </p>
      </div>

      {/* ── Decorative Illustration (top-right) ── */}
      <div className="team-hero__decor" aria-hidden="true">
        <div className="team-hero__blob1" />
        <div className="team-hero__blob2" />
        <div className="team-hero__dots">{dots}</div>
        <span className="team-hero__diamond team-hero__diamond--1" />
        <span className="team-hero__diamond team-hero__diamond--2" />
        <div className="team-hero__silhouette">
          <div className="team-hero__silhouette-circle">
            <span className="team-hero__silhouette-icon">
              <IconUser />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
