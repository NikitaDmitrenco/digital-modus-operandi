import { useEffect } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ExternalLink,
  Github,
  ShieldCheck,
} from "lucide-react";
import { Link, useParams } from "wouter";
import SiteShell from "@/components/site/SiteShell";
import NotFound from "@/pages/NotFound";
import { track } from "@/lib/analytics";
import { captureAttribution } from "@/lib/leads";
import { SITE_URL, useSeo } from "@/lib/seo";
import { caseIndex, getCaseBySlug } from "@/content/cases";
import { primaryCta } from "@/content/site";
import type { CaseStudy } from "@/content/types";

function CaseView({ item }: { item: CaseStudy }) {
  useSeo({
    title: `${item.client}: ${item.title} — Digital Modus Operandi`,
    description: item.subtitle,
    path: `/cases/${item.slug}`,
    type: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: `${item.client} — ${item.title}`,
      about: item.industry,
      description: item.subtitle,
      url: `${SITE_URL}/cases/${item.slug}`,
      creator: {
        "@type": "Organization",
        name: "Digital Modus Operandi",
        url: SITE_URL,
      },
      keywords: item.tags.join(", "),
    },
  });

  useEffect(() => {
    captureAttribution();
    window.scrollTo(0, 0);
  }, [item.slug]);

  return (
    <SiteShell>
      <article
        className="case-page page-top section-pad section-dark"
        aria-labelledby="case-title"
      >
        <div className="section-heading reveal">
          <span className="section-index">CASE_{caseIndex(item.slug)}</span>
          <span className="mono">{item.industry}</span>
          {item.nda && (
            <span className="heading-note">
              <ShieldCheck size={12} aria-hidden="true" /> NDA
            </span>
          )}
        </div>

        <header className="case-page-header reveal">
          <Link href="/cases" className="text-link case-back">
            <ArrowLeft size={16} aria-hidden="true" /> Все кейсы
          </Link>
          <span className="mono case-client">{item.client}</span>
          <h1 className="display" id="case-title">
            {item.title}
          </h1>
          <p className="case-page-lead">{item.subtitle}</p>
          <div className="tag-row case-tags">
            {item.tags.map(tag => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          {(item.liveUrl || item.repoUrl) && (
            <div className="case-links">
              {item.liveUrl && (
                <a
                  className="button button-primary magnetic"
                  href={item.liveUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={() =>
                    track("case_open", {
                      section: "case_live",
                      case_name: item.slug,
                    })
                  }
                >
                  Открыть сайт <ExternalLink size={16} aria-hidden="true" />
                </a>
              )}
              {item.repoUrl && (
                <a
                  className="button button-ghost"
                  href={item.repoUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Исходный код <Github size={16} aria-hidden="true" />
                </a>
              )}
            </div>
          )}
        </header>

        <div className="case-page-body">
          <section className="case-block reveal" aria-labelledby="case-problem">
            <h2 className="mono" id="case-problem">
              01 / ЗАДАЧА
            </h2>
            <p>{item.problem}</p>
          </section>

          <section
            className="case-block reveal"
            aria-labelledby="case-solution"
          >
            <h2 className="mono" id="case-solution">
              02 / РЕШЕНИЕ
            </h2>
            <p>{item.solution}</p>
          </section>

          <section
            className="case-block reveal"
            aria-labelledby="case-functions-title"
          >
            <h2 className="mono" id="case-functions-title">
              03 / ЧТО СДЕЛАЛИ
            </h2>
            <ul className="case-functions">
              {item.functions.map(fn => (
                <li key={fn}>
                  <Check size={15} aria-hidden="true" /> {fn}
                </li>
              ))}
            </ul>
          </section>

          <section className="case-block reveal" aria-labelledby="case-result">
            <h2 className="mono" id="case-result">
              04 / РЕЗУЛЬТАТ
            </h2>
            <p>{item.result}</p>
            <div className="case-proof case-proof-wide">
              <span className="mono">ДОКАЗАТЕЛЬСТВО</span>
              <strong>{item.proof}</strong>
            </div>
            {item.ndaNote && <p className="case-nda-note">{item.ndaNote}</p>}
            {item.team.length > 0 && (
              <p className="case-team">
                <span className="mono">Делал</span> {item.team.join(", ")}
              </p>
            )}
          </section>
        </div>

        <div className="cases-footer reveal">
          <a href="/#contact" className="button button-primary magnetic">
            {primaryCta} <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
      </article>
    </SiteShell>
  );
}

export default function CaseDetail() {
  const params = useParams<{ slug: string }>();
  const item = params.slug ? getCaseBySlug(params.slug) : undefined;

  // Draft cases have no confirmed facts yet, so they get no public page.
  if (!item || item.status !== "published") return <NotFound />;

  return <CaseView item={item} />;
}
