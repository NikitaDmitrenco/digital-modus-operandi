import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { track } from "@/lib/analytics";
import { caseIndex, casesIntro, featuredCases } from "@/content/cases";

export default function CasesSection() {
  return (
    <section
      id="cases"
      className="cases section-pad section-dark"
      aria-labelledby="cases-title"
    >
      <div className="section-heading reveal">
        <span className="section-index">// 04</span>
        <span className="mono">ЧТО МЫ УЖЕ СДЕЛАЛИ / CASES</span>
        <span className="heading-note">{casesIntro.note}</span>
      </div>
      <div className="cases-header reveal">
        <h2 className="display" id="cases-title">
          {casesIntro.titleStart}
          <br />
          <em>{casesIntro.titleAccent}</em>
        </h2>
        <p>{casesIntro.text}</p>
      </div>
      <div className="cases-list">
        {featuredCases.map((item, index) => (
          <article
            className={`case-card ${item.cover} reveal delay-${Math.min(index + 1, 3)}`}
            key={item.slug}
          >
            <Link
              href={`/cases/${item.slug}`}
              className="case-link"
              onClick={() =>
                track("case_open", { section: "cases", case_name: item.slug })
              }
              aria-label={`Кейс ${item.client}: ${item.title}`}
            >
              <div className="case-visual">
                <div className="case-grid" aria-hidden="true" />
                <div className="case-orb" aria-hidden="true" />
                <div className="case-label mono">
                  CASE_{caseIndex(item.slug)}
                </div>
                <div className="case-arrow" aria-hidden="true">
                  <ArrowUpRight size={22} strokeWidth={1.2} />
                </div>
              </div>
              <div className="case-details">
                <div className="case-copy">
                  <span className="mono case-client">
                    {item.client} / {item.industry}
                  </span>
                  <h3>{item.title}</h3>
                  <p className="case-summary">{item.subtitle}</p>
                  <div className="tag-row case-tags">
                    {item.tags.map(tag => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="case-proof">
                  <span className="mono">ДОКАЗАТЕЛЬСТВО</span>
                  <strong>{item.proof}</strong>
                  {item.nda && (
                    <span className="case-nda mono">
                      <ShieldCheck size={13} aria-hidden="true" /> NDA
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
      <div className="cases-footer reveal">
        <Link href="/cases" className="text-link">
          Все кейсы <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
