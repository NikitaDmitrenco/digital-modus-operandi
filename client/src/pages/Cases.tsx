import { useEffect } from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import SiteShell from "@/components/site/SiteShell";
import { track } from "@/lib/analytics";
import { captureAttribution } from "@/lib/leads";
import { useSeo } from "@/lib/seo";
import { caseIndex, draftCases, publishedCases } from "@/content/cases";
import { primaryCta } from "@/content/site";

export default function Cases() {
  useSeo({
    title: "Кейсы: B2B-системы, каталоги и CRM — Digital Modus Operandi",
    description:
      "Проекты DMO: CRM для производственной компании, e-commerce-платформа с самостоятельным управлением каталогом, EdTech-платформа с европейским финансированием и коммерческий AI-продукт.",
    path: "/cases",
  });

  useEffect(() => {
    captureAttribution();
    window.scrollTo(0, 0);
  }, []);

  return (
    <SiteShell>
      <section className="cases page-top section-pad section-dark">
        <div className="section-heading reveal">
          <span className="section-index">// 01</span>
          <span className="mono">ВСЕ КЕЙСЫ / PORTFOLIO</span>
          <span className="heading-note">
            задача · решение · доказательство
          </span>
        </div>
        <div className="cases-header reveal">
          <h1 className="display">
            Работающие
            <br />
            <em>системы.</em>
          </h1>
          <p>
            Каждый проект описан одинаково: какую бизнес-задачу решали, что
            построили и что изменилось после запуска.
          </p>
        </div>

        <div className="cases-list">
          {publishedCases.map((item, index) => (
            <article
              className={`case-card ${item.cover} reveal delay-${Math.min(index + 1, 3)}`}
              key={item.slug}
            >
              <Link
                href={`/cases/${item.slug}`}
                className="case-link"
                onClick={() =>
                  track("case_open", {
                    section: "cases_index",
                    case_name: item.slug,
                  })
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

        {draftCases.length > 0 && (
          <div className="extra-cases reveal">
            <div className="section-heading">
              <span className="section-index">// 02</span>
              <span className="mono">ДРУГИЕ ПРОЕКТЫ КОМАНДЫ</span>
            </div>
            <p className="extra-cases-note">
              Проекты, которые команда делала за пределами B2B-направления.
              Развёрнутые карточки готовим: публикуем только те факты, которые
              можем подтвердить.
            </p>
            <ul className="extra-cases-list">
              {draftCases.map(item => (
                <li key={item.slug}>
                  <span className="mono">{item.industry}</span>
                  <strong>{item.client}</strong>
                  <p>{item.title}</p>
                  {item.proof && (
                    <span className="extra-proof mono">{item.proof}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="cases-footer reveal">
          <a href="/#contact" className="button button-primary magnetic">
            {primaryCta} <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
      </section>
    </SiteShell>
  );
}
