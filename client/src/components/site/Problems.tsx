import { ArrowUpRight } from "lucide-react";
import { problems } from "@/content/site";

export default function Problems() {
  return (
    <section id="problems" className="problem section-pad section-dark">
      <div className="section-heading reveal">
        <span className="section-index">// 02</span>
        <span className="mono">РУЧНЫЕ ПРОЦЕССЫ / ГДЕ ТЕРЯЕТСЯ ВРЕМЯ</span>
      </div>
      <div className="problem-layout">
        <div className="problem-lead reveal">
          <p className="kicker">
            {problems.title}
            <br />
            <span>{problems.titleAccent}</span>
          </p>
          <div className="signal-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="problem-copy reveal delay-1">
          <p>{problems.lead}</p>
          <p>{problems.support}</p>
        </div>
      </div>
      <div className="outcome-grid reveal delay-2">
        {problems.cards.map(card => (
          <div
            className={`outcome-card ${card.accent ? "outcome-card-accent" : ""}`}
            key={card.code}
          >
            <span className="mono">{card.code}</span>
            <strong>{card.title}</strong>
            <p>{card.text}</p>
            <ArrowUpRight size={18} aria-hidden="true" />
          </div>
        ))}
      </div>
    </section>
  );
}
