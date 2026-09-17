import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { primaryCta } from "@/content/site";

export default function NotFound() {
  const mainRef = useRef<HTMLElement>(null);

  // This page renders outside SiteShell, so it moves focus itself: without it
  // a visitor who followed a dead link stays focused on the previous page.
  useEffect(() => {
    mainRef.current?.focus();
  }, []);

  return (
    <div className="site-shell">
      <main
        className="notfound section-pad"
        id="top"
        ref={mainRef}
        tabIndex={-1}
        style={{ outline: "none" }}
      >
        <div className="notfound-grid" aria-hidden="true" />
        <div className="section-heading">
          <span className="section-index">// 404</span>
          <span className="mono">PAGE NOT FOUND</span>
        </div>
        <h1 className="display notfound-title">
          Страница
          <br />
          <em>не найдена.</em>
        </h1>
        <p className="notfound-text">
          Возможно, ссылка устарела или кейс ещё не опубликован. Вернитесь на
          главную или посмотрите список проектов.
        </p>
        <div className="hero-actions">
          <Link href="/" className="button button-primary magnetic">
            На главную <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <Link href="/cases" className="button button-ghost">
            Смотреть кейсы <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <a href="/#contact" className="button button-ghost">
            {primaryCta} <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
      </main>
    </div>
  );
}
