import { useState } from "react";
import { Plus } from "lucide-react";
import { faqs } from "@/content/faq";

export default function Faq() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="faq section-pad section-dark"
      aria-labelledby="faq-title"
    >
      <div className="section-heading reveal">
        <span className="section-index">// 08</span>
        <span className="mono">ЧАСТЫЕ ВОПРОСЫ / FAQ</span>
      </div>
      <div className="faq-layout">
        <div className="faq-title reveal">
          <h2 className="display" id="faq-title">
            Спросить
            <br />
            <em>напрямую.</em>
          </h2>
          <p>
            Если здесь нет ответа — <a href="#contact">напишите нам</a>.
            Разберёмся вместе.
          </p>
        </div>
        <div className="faq-list">
          {faqs.map((item, index) => {
            const isActive = activeFaq === index;
            return (
              <div
                className={`faq-item reveal ${isActive ? "is-active" : ""}`}
                key={item.question}
              >
                <button
                  onClick={() => setActiveFaq(isActive ? null : index)}
                  aria-expanded={isActive}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                >
                  <span className="mono">0{index + 1}</span>
                  <strong>{item.question}</strong>
                  <Plus size={20} aria-hidden="true" />
                </button>
                <div
                  className="faq-answer"
                  id={`faq-answer-${index}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                >
                  <p>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
