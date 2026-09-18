/**
 * Lead capture: traffic attribution + submission.
 *
 * Attribution is stored in sessionStorage on first load, so a visitor who
 * arrives from an ad, scrolls the whole page and only then opens the form still
 * carries their UTM tags into the lead.
 */

const STORAGE_KEY = "dmo.attribution";

export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referer?: string;
  landing_page?: string;
  first_seen?: string;
};

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

function readStored(): Attribution | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}

/** Call once on app start. Keeps the first-touch attribution of the session. */
export function captureAttribution(): Attribution {
  if (typeof window === "undefined") return {};

  const stored = readStored();
  const params = new URLSearchParams(window.location.search);
  const fresh: Attribution = {};

  UTM_KEYS.forEach(key => {
    const value = params.get(key);
    if (value) fresh[key] = value.slice(0, 200);
  });

  const hasFreshUtm = Object.keys(fresh).length > 0;
  if (stored && !hasFreshUtm) return stored;

  const attribution: Attribution = {
    ...(stored ?? {}),
    ...fresh,
    referer: stored?.referer || document.referrer || undefined,
    landing_page: stored?.landing_page || window.location.href,
    first_seen: stored?.first_seen || new Date().toISOString(),
  };

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    /* private mode — attribution simply is not persisted */
  }

  return attribution;
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  return readStored() ?? captureAttribution();
}

/** Short label for analytics: "google / cpc", "direct", "t.me". */
export function attributionSource(
  attribution: Attribution = getAttribution()
): string {
  if (attribution.utm_source) {
    return [attribution.utm_source, attribution.utm_medium]
      .filter(Boolean)
      .join(" / ");
  }
  if (attribution.referer) {
    try {
      return new URL(attribution.referer).hostname;
    } catch {
      return attribution.referer.slice(0, 80);
    }
  }
  return "direct";
}

export type LeadPayload = {
  name: string;
  contact: string;
  task: string;
  link?: string;
  /** Honeypot — must stay empty. Нейтральное имя: под company_website
   *  срабатывало автозаполнение браузера. */
  honey_ref?: string;
  /** Milliseconds between form render and submit, used as a bot signal. */
  elapsedMs: number;
  attribution: Attribution;
  page: string;
};

export type LeadResult =
  | { ok: true }
  | {
      ok: false;
      reason: "not_configured" | "rate_limited" | "invalid" | "network";
    };

const ENDPOINT =
  (import.meta.env.VITE_LEAD_ENDPOINT as string | undefined) || "/api/lead";

export async function submitLead(payload: LeadPayload): Promise<LeadResult> {
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) return { ok: true };
    if (response.status === 429) return { ok: false, reason: "rate_limited" };
    if (response.status === 400) return { ok: false, reason: "invalid" };
    if (response.status === 501 || response.status === 503) {
      return { ok: false, reason: "not_configured" };
    }
    return { ok: false, reason: "network" };
  } catch {
    return { ok: false, reason: "network" };
  }
}
