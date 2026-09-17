import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, Mail, Menu, Send, X } from "lucide-react";
import { Link } from "wouter";
import { useSiteChrome } from "@/hooks/useSiteChrome";
import { track } from "@/lib/analytics";
import { brand, footer, navItems, primaryCta } from "@/content/site";

type SiteShellProps = {
  children: ReactNode;
  /** Home renders in-page anchors; other routes link back to the home page. */
  isHome?: boolean;
  /** The preloader only plays on the first, full-page entry. */
  showPreloader?: boolean;
};

export default function SiteShell({
  children,
  isHome = false,
  showPreloader = false,
}: SiteShellProps) {
  const [loading, setLoading] = useState(showPreloader);
  const [menuOpen, setMenuOpen] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);

  useSiteChrome(cursorRef, cursorDotRef);

  useEffect(() => {
    if (!showPreloader) return;
    const timer = window.setTimeout(() => setLoading(false), 1350);
    return () => window.clearTimeout(timer);
  }, [showPreloader]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const anchor = (href: string) => (isHome ? href : `/${href}`);

  return (
    <div className="site-shell">
      <div ref={cursorRef} className="cursor-ring" aria-hidden="true">
        <span />
      </div>
      <div ref={cursorDotRef} className="cursor-dot" aria-hidden="true" />

      <a className="skip-link" href="#top">
        Перейти к содержимому
      </a>

      {loading && (
        <div className="preloader" aria-hidden="true">
          <div className="preloader-top">
            <span>DMO / SYSTEM ONLINE</span>
            <span>2026</span>
          </div>
          <div className="preloader-center">
            <div className="preloader-mark">
              <span>D</span>
              <span>M</span>
              <span>O</span>
            </div>
            <div className="preloader-progress">
              <span />
            </div>
            <div className="preloader-caption">
              Разбираем процесс <span>— пожалуйста, подождите</span>
            </div>
          </div>
          <div className="preloader-bottom">
            <span>b2b web systems</span>
            <span>000 → 100%</span>
          </div>
        </div>
      )}

      <header className={`site-header ${menuOpen ? "is-open" : ""}`}>
        <Link
          href="/"
          className="brand"
          onClick={() => setMenuOpen(false)}
          aria-label={`${brand.name} — на главную`}
        >
          <span className="brand-symbol">D</span>
          <span className="brand-name">
            digital
            <br />
            <b>modus operandi</b>
          </span>
        </Link>
        <div className="header-meta">
          <span className="status-dot" /> доступные слоты:{" "}
          <b>{brand.availableSlots}</b>
        </div>
        <button
          className="menu-trigger magnetic"
          onClick={() => setMenuOpen(value => !value)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
        >
          <span>{menuOpen ? "close" : "menu"}</span>
          {menuOpen ? (
            <X size={18} strokeWidth={1.5} />
          ) : (
            <Menu size={18} strokeWidth={1.5} />
          )}
        </button>
      </header>

      <div
        className={`menu-overlay ${menuOpen ? "is-visible" : ""}`}
        inert={!menuOpen}
      >
        <div className="menu-grid-line" />
        <div className="menu-intro">
          <span className="mono">NAVIGATION / 00</span>
          <p>
            Открываем нужный
            <br />
            контекст.
          </p>
        </div>
        <nav className="overlay-nav" aria-label="Основная навигация">
          {navItems.map((item, index) => (
            <a
              key={item.href}
              href={anchor(item.href)}
              style={{ transitionDelay: `${index * 55 + 80}ms` }}
              onClick={() => setMenuOpen(false)}
            >
              <span className="mono">0{index + 1}</span>
              <span>{item.label}</span>
              <ArrowUpRight size={22} strokeWidth={1.3} />
            </a>
          ))}
        </nav>
        <div className="menu-footer">
          <span>{brand.email}</span>
          <span>{brand.location}</span>
          <span className="mono">press esc to close</span>
        </div>
      </div>

      <main id="top">{children}</main>

      <footer className="site-footer section-pad">
        <div className="footer-main">
          <Link href="/" className="brand">
            <span className="brand-symbol">D</span>
            <span className="brand-name">
              digital
              <br />
              <b>modus operandi</b>
            </span>
          </Link>
          <p>
            {footer.line.split("\n").map((line, index) => (
              <span key={line}>
                {index > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
          <a className="footer-cta" href={anchor("#contact")}>
            {primaryCta} <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="footer-bottom">
          <span>© 2026 {brand.name}</span>
          <span className="mono">{brand.tagline}</span>
          <div className="socials">
            <a
              href={brand.telegramUrl}
              aria-label="Telegram"
              onClick={() => track("telegram_click", { section: "footer" })}
            >
              <Send size={16} />
            </a>
            <a
              href={`mailto:${brand.email}`}
              aria-label="Email"
              onClick={() => track("email_click", { section: "footer" })}
            >
              <Mail size={16} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
