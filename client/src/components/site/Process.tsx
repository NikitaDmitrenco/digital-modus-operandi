import { ArrowUpRight } from "lucide-react";
import { processIntro, processSteps } from "@/content/process";

export default function Process() {
  return (
    <section
      id="process"
      className="process section-pad"
      aria-labelledby="process-title"
    >
      <div className="section-heading reveal">
        <span className="section-index">// 05</span>
        <span className="mono">КАК РАБОТАЕМ / PROCESS</span>
        <span className="heading-note">{processIntro.note}</span>
      </div>
      <div className="process-intro reveal">
        <h2 className="display" id="process-title">
          {processIntro.titleStart}
          <br />
          <em>{processIntro.titleAccent}</em>
        </h2>
        <p>{processIntro.text}</p>
      </div>
      <div className="process-list">
        {processSteps.map((step, index) => (
          <div className="process-row reveal" key={step.title}>
            <span className="process-number mono">0{index + 1}</span>
            <div className="process-main">
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
            <div className="process-client">
              <span className="mono">ВАШ ВКЛАД</span>
              <p>{step.clientInput}</p>
            </div>
            <ArrowUpRight
              className="process-arrow"
              size={23}
              strokeWidth={1.2}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
