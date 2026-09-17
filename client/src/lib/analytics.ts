/**
 * Thin analytics layer.
 *
 * The site ships an Umami tag in `client/index.html` (configured through
 * VITE_ANALYTICS_ENDPOINT / VITE_ANALYTICS_WEBSITE_ID). We deliberately do not
 * add a second analytics system: this module forwards the same event name and
 * the same parameter set to whichever provider happens to be on the page —
 * Umami, GA4 (`gtag`) or Yandex.Metrika (`ym`). If none is present, tracking is
 * a no-op and never throws.
 */

export type AnalyticsEvent =
  | "hero_primary_cta"
  | "hero_cases_click"
  | "service_open"
  | "case_open"
  | "contact_start"
  | "contact_submit"
  | "telegram_click"
  | "email_click"
  | "scroll_depth";

export type AnalyticsParams = {
  /** Page section the event happened in, e.g. "hero", "cases". */
  section?: string;
  /** Case slug for case-related events. */
  case_name?: string;
  /** Traffic source or the origin of the click. */
  source?: string;
  [key: string]: string | number | boolean | undefined;
};

type UmamiApi = {
  track: (name: string, data?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    umami?: UmamiApi;
    gtag?: (...args: unknown[]) => void;
    ym?: (counterId: number, action: string, ...args: unknown[]) => void;
    ymCounterId?: number;
    dataLayer?: unknown[];
  }
}

function clean(
  params: AnalyticsParams
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== ""
    )
  ) as Record<string, string | number | boolean>;
}

export function track(event: AnalyticsEvent, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") return;
  const payload = clean(params);

  try {
    window.umami?.track(event, payload);
  } catch {
    /* analytics must never break the page */
  }

  try {
    window.gtag?.("event", event, payload);
  } catch {
    /* noop */
  }

  try {
    if (window.ym && window.ymCounterId) {
      window.ym(window.ymCounterId, "reachGoal", event, payload);
    }
  } catch {
    /* noop */
  }

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, payload);
  }
}

/**
 * Reports how deep visitors get: the sections where B2B traffic usually drops
 * off (cases, FAQ, the form) plus plain percentage thresholds.
 */
export function initScrollDepthTracking(
  sections: { id: string; name: string }[]
) {
  if (typeof window === "undefined") return () => {};

  const seenSections = new Set<string>();
  const seenThresholds = new Set<number>();
  const thresholds = [25, 50, 75, 100];

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const section = sections.find(item => item.id === entry.target.id);
        if (!section || seenSections.has(section.id)) return;
        seenSections.add(section.id);
        track("scroll_depth", { section: section.name });
      });
    },
    // threshold:0 with a centred root margin, because a section taller than
    // ~2.8 viewports can never reach a ratio-based threshold.
    { threshold: 0, rootMargin: "-25% 0px -25% 0px" }
  );

  sections.forEach(({ id }) => {
    const element = document.getElementById(id);
    if (element) observer.observe(element);
  });

  const onScroll = () => {
    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const percent = Math.round((window.scrollY / scrollable) * 100);
    thresholds.forEach(threshold => {
      if (percent >= threshold && !seenThresholds.has(threshold)) {
        seenThresholds.add(threshold);
        track("scroll_depth", { section: `page_${threshold}` });
      }
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  return () => {
    observer.disconnect();
    window.removeEventListener("scroll", onScroll);
  };
}

/**
 * Loads the Umami tag that used to sit in `index.html` with unresolved
 * `%VITE_…%` placeholders — which made every page load fire a broken request.
 * Now the tag is injected only when both variables are actually configured.
 *
 * VITE_ANALYTICS_ENDPOINT — e.g. https://analytics.example.com
 * VITE_ANALYTICS_WEBSITE_ID — the Umami website id
 */
export function initAnalytics() {
  if (typeof document === "undefined") return;

  const endpoint = (
    import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined
  )?.replace(/\/$/, "");
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID as
    | string
    | undefined;
  if (!endpoint || !websiteId) return;
  if (document.getElementById("dmo-umami")) return;

  const script = document.createElement("script");
  script.id = "dmo-umami";
  script.defer = true;
  script.src = `${endpoint}/umami`;
  script.dataset.websiteId = websiteId;
  document.head.appendChild(script);
}
