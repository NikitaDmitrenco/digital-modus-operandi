import { ArrowDownRight, ArrowUpRight, MousePointer2 } from "lucide-react";
import { track } from "@/lib/analytics";
import { attributionSource } from "@/lib/leads";
import { brand, hero, primaryCta, secondaryCta } from "@/content/site";

export default function Hero() {
  return (
    <section className="hero section-pad">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-orbit orbit-one" aria-hidden="true" />
      <div className="hero-orbit orbit-two" aria-hidden="true" />
      <div className="hero-content">
        <div className="eyebrow reveal">
          <span className="section-index">// 01</span>
          <span>{hero.eyebrow}</span>
        </div>
        <h1 className="display hero-title reveal delay-1">
          {hero.titleStart}
          <br />
          <em>{hero.titleAccent}</em>
          <br />
          {hero.titleEnd}
        </h1>
        <div className="hero-bottom reveal delay-2">
          <div className="hero-lead">
            <p className="hero-description">{hero.description}</p>
            <p className="hero-brandline mono">{brand.tagline}</p>
          </div>
          <div className="hero-actions">
            <a
              className="button button-primary magnetic"
              href="#contact"
              onClick={() =>
                track("hero_primary_cta", {
                  section: "hero",
                  source: attributionSource(),
                })
              }
            >
              {primaryCta} <ArrowUpRight size={18} />
            </a>
            <a
              className="button button-ghost"
              href="#cases"
              onClick={() => track("hero_cases_click", { section: "hero" })}
            >
              {secondaryCta} <ArrowDownRight size={18} />
            </a>
          </div>
        </div>
      </div>
      <div className="hero-aside reveal delay-3" aria-hidden="true">
        <span className="mono rotated">SCROLL TO EXPLORE</span>
        <MousePointer2 size={16} strokeWidth={1.2} />
        <span className="scroll-line" />
      </div>
      <div className="hero-code mono reveal delay-3" aria-hidden="true">
        <span>B2B / CRM / E-COMMERCE</span>
        <span>BUILD_2026.09</span>
        <span className="code-blink">● REC</span>
      </div>
    </section>
  );
}
