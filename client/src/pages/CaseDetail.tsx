import { useEffect, type CSSProperties } from "react";
import { ArrowLeft, ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import { Link, useParams } from "wouter";
import SiteShell from "@/components/site/SiteShell";
import NotFound from "@/pages/NotFound";
import { captureAttribution } from "@/lib/leads";
import { SITE_URL, useSeo } from "@/lib/seo";
import { caseIndex, getCaseBySlug } from "@/content/cases";
import { primaryCta } from "@/content/site";
import type { CaseStudy } from "@/content/types";

/**
 * The block titles ("01 / ЗАДАЧА") are real headings, but the stylesheet paints
 * them through `.case-block span.mono`, so the colour — and the inline box the
 * span used to produce — are repeated here to keep the rendering pixel-identical
 * without touching index.css.
 */
const blockTitle: CSSProperties = { color: "#6f7a6b", display: "inline" };

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
        </header>

        <div className="case-page-body">
          <section className="case-block reveal" aria-labelledby="case-problem">
            <h2 className="mono" id="case-problem" style={blockTitle}>
              01 / ЗАДАЧА
            </h2>
            <p>{item.problem}</p>
          </section>

          <section
            className="case-block reveal"
            aria-labelledby="case-solution"
          >
            <h2 className="mono" id="case-solution" style={blockTitle}>
              02 / РЕШЕНИЕ
            </h2>
            <p>{item.solution}</p>
          </section>

          <section
            className="case-block reveal"
            aria-labelledby="case-functions-title"
          >
            <h2 className="mono" id="case-functions-title" style={blockTitle}>
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
            <h2 className="mono" id="case-result" style={blockTitle}>
              04 / РЕЗУЛЬТАТ
            </h2>
            <p>{item.result}</p>
            <div className="case-proof case-proof-wide">
              <span className="mono">ДОКАЗАТЕЛЬСТВО</span>
              <strong>{item.proof}</strong>
            </div>
            {item.ndaNote && <p className="case-nda-note">{item.ndaNote}</p>}
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
