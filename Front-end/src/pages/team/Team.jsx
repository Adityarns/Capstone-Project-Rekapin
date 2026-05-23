/**
 * ============================================================
 *    REKAPIN — Team Page (Support)
 *    src/pages/team/Team.jsx
 *
 *    Mounted at /support — shows the "Meet Our Team" hero
 *    and 3×2 grid of team member cards.
 * ============================================================
 *
 * @format
 */

import TeamHero from "../../components/team/TeamHero";
import TeamGrid from "../../components/team/TeamGrid";
import "./Team.css";

export default function Team() {
  return (
    <div className="team-page">
      <TeamHero />
      <TeamGrid />
    </div>
  );
}
