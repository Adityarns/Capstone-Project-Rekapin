/**
 * ============================================================
 *    REKAPIN — Team Card Component
 *    src/components/team/TeamCard.jsx
 *
 *    Individual member card with abstract wave background,
 *    circular avatar placeholder, name, university, and role badge.
 * ============================================================
 *
 * @format
 */

import { roleBadgeMap } from "../../data/teamData";
import "./TeamCard.css";

/* ── University icon (small graduation cap) ── */
const IconUniversity = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
  </svg>
);

/**
 * Abstract SVG wave backgrounds.
 * Three unique shapes that alternate across cards.
 */
const WaveOlive = () => (
  <svg viewBox="0 0 320 110" preserveAspectRatio="none" aria-hidden="true">
    <path
      className="wave-fill-2"
      d="M0,0 L320,0 L320,70 Q260,100 200,80 Q140,60 80,85 Q40,100 0,90 Z"
    />
    <path
      className="wave-fill-1"
      d="M0,0 L320,0 L320,55 Q250,90 180,65 Q110,40 50,70 Q20,85 0,75 Z"
    />
  </svg>
);

const WavePink = () => (
  <svg viewBox="0 0 320 110" preserveAspectRatio="none" aria-hidden="true">
    <path
      className="wave-fill-2"
      d="M0,0 L320,0 L320,80 Q280,60 220,75 Q160,95 100,70 Q50,50 0,65 Z"
    />
    <path
      className="wave-fill-1"
      d="M0,0 L320,0 L320,60 Q270,85 210,70 Q140,50 80,75 Q30,95 0,80 Z"
    />
  </svg>
);

const WaveOlivePink = () => (
  <svg viewBox="0 0 320 110" preserveAspectRatio="none" aria-hidden="true">
    <path
      className="wave-fill-1"
      d="M0,0 L320,0 L320,65 Q260,85 200,70 Q130,50 70,80 Q30,95 0,85 Z"
    />
    <path
      className="wave-fill-2"
      d="M0,0 L320,0 L320,50 Q240,80 170,60 Q100,40 50,65 Q20,80 0,70 Z"
    />
  </svg>
);

const waveMap = {
  olive: WaveOlive,
  pink: WavePink,
  "olive-pink": WaveOlivePink,
};

export default function TeamCard({ member, index }) {
  const { name, role, university, initials, avatarColor, cardVariant, avatarSrc } = member;
  const badgeClass = roleBadgeMap[role] || "maroon";
  const WaveComponent = waveMap[cardVariant] || WaveOlive;

  return (
    <article
      className="team-card"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* ── Wave Background ── */}
      <div className={`team-card__wave team-card__wave--${cardVariant}`}>
        <WaveComponent />
      </div>

      <div className="team-card__body">
        {/* ── Avatar ── */}
        <div className="team-card__avatar-wrapper">
          <div
            className="team-card__avatar"
            style={{ backgroundColor: avatarColor }}
            aria-label={`Avatar of ${name}`}
          >
            {avatarSrc ? <img src={avatarSrc} alt={name} /> : initials}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="team-card__content">
          <h3 className="team-card__name">{name}</h3>

          <div className="team-card__university">
            <span className="team-card__uni-icon" aria-hidden="true">
              <IconUniversity />
            </span>
            <span>{university}</span>
          </div>

          <span className={`team-card__role team-card__role--${badgeClass}`}>
            {role}
          </span>
        </div>
      </div>
    </article>
  );
}
