/**
 * Thin analytics layer.
 *
 * No analytics provider is installed on the site right now — that was a
 * deliberate decision, see DMO_REWORK_PROGRESS.md §4.0. This module therefore
 * needs no configuration and no environment variables: it forwards each event
 * to whichever provider happens to be on the page (Umami, GA4 via `gtag`,
 * Yandex.Metrika via `ym`) and stays a silent no-op while none is.
 *
 * To switch analytics on later, add the provider's own snippet to the page —
 * nothing in this file has to change, and the events below start reporting on
 * their own. Attribution does NOT depend on any of this: UTM tags travel with
 * the lead itself (see lib/leads.ts) and reach Telegram regardless.
 */

export type AnalyticsEvent =
  | "hero_primary_cta"
  | "hero_cases_click"
  | "service_open"
  | "case_open"
  | "contact_start"
  | "contact_submit"
  | "telegram_click"
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
