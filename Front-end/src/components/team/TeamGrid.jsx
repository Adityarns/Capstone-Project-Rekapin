/**
 * ============================================================
 *    REKAPIN — Team Grid Component
 *    src/components/team/TeamGrid.jsx
 *
 *    Renders the responsive 3×2 grid of TeamCard components.
 * ============================================================
 *
 * @format
 */

import { teamMembers } from "../../data/teamData";
import TeamCard from "./TeamCard";
import "./TeamGrid.css";

export default function TeamGrid() {
  return (
    <section className="team-grid" aria-label="Team members">
      {teamMembers.map((member, index) => (
        <TeamCard key={member.id} member={member} index={index} />
      ))}
    </section>
  );
}
