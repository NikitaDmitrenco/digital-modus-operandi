import { Check } from "lucide-react";
import { trustIntro, trustPoints } from "@/content/trust";

export default function Trust() {
  return (
    <section id="why" className="why section-pad" aria-labelledby="why-title">
      <div className="section-heading reveal">
        <span className="section-index">// 06</span>
        <span className="mono">ПОЧЕМУ С НАМИ БЕЗОПАСНО / RISK</span>
      </div>
      <div className="why-layout">
        <div className="why-title reveal">
          <span className="mono">{trustIntro.label}</span>
          <h2 className="display" id="why-title">
            {trustIntro.titleStart}
            <br />
            <em>{trustIntro.titleAccent}</em>
            <br />
            {trustIntro.titleEnd}
          </h2>
        </div>
        <div className="difference-list">
          {trustPoints.map((point, index) => (
            <div className="difference-item reveal" key={point.title}>
              <span className="difference-index mono">0{index + 1}</span>
              <div className="difference-body">
                <p>{point.title}</p>
                <span>{point.text}</span>
              </div>
              <Check size={17} aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
