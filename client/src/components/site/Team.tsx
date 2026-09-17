import { useState } from "react";
import { ArrowUpRight, ScanLine } from "lucide-react";
import { team, teamIntro } from "@/content/team";
import type { TeamMember } from "@/content/types";

function Portrait({ person }: { person: TeamMember }) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(person.image) && !failed;

  return (
    <div
      className={`portrait ${person.portrait} ${hasImage ? "portrait-has-image" : ""}`}
    >
      {hasImage ? (
        <img
          className="portrait-image"
          src={person.image}
          alt={person.imageAlt ?? person.name}
          loading="lazy"
          width={320}
          height={315}
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <span className="portrait-placeholder mono">PHOTO / PLACEHOLDER</span>
          <span className="portrait-scan" aria-hidden="true">
            <ScanLine size={16} />
          </span>
          <span className="portrait-id mono">{person.id}</span>
        </>
      )}
    </div>
  );
}

export default function Team() {
  return (
    <section id="team" className="team section-pad">
      <div className="section-heading reveal">
        <span className="section-index">// 07</span>
        <span className="mono">КОМАНДА / TEAM DOSSIERS</span>
        <span className="heading-note">{teamIntro.note}</span>
      </div>
      <div className="team-header reveal">
        <h2 className="display">
          {teamIntro.titleStart}
          <br />
          <em>{teamIntro.titleAccent}</em>
        </h2>
        <p>{teamIntro.text}</p>
      </div>
      <div className="team-grid">
        {team.map((person, index) => (
          <article
            className={`person-card tilt-card reveal delay-${Math.min(index + 1, 3)}`}
            key={person.id}
          >
            <Portrait person={person} />
            <div className="person-meta">
              <div>
                <h3>{person.name}</h3>
                <p>{person.role}</p>
              </div>
              <ArrowUpRight size={19} strokeWidth={1.2} aria-hidden="true" />
            </div>
            <p className="person-bio">{person.bio}</p>
            <div className="person-tags">
              {person.skills.map(skill => (
                <span key={skill}>#{skill}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
