// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  attributionSource,
  buildMailtoFallback,
  captureAttribution,
  getAttribution,
  type LeadPayload,
} from "./leads";

const STORAGE_KEY = "dmo.attribution";

/** Point jsdom at a URL without reloading the document. */
function visit(url: string) {
  window.history.replaceState({}, "", url);
}

const originalSessionStorage = Object.getOwnPropertyDescriptor(
  window,
  "sessionStorage"
);

function setReferrer(value: string) {
  Object.defineProperty(document, "referrer", {
    value,
    configurable: true,
  });
}

/** sessionStorage that throws on every access — Safari private mode. */
function breakSessionStorage() {
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    get() {
      throw new DOMException("access denied", "SecurityError");
    },
  });
}

function restoreSessionStorage() {
  if (originalSessionStorage) {
    Object.defineProperty(window, "sessionStorage", originalSessionStorage);
  }
}

beforeEach(() => {
  restoreSessionStorage();
  window.sessionStorage.clear();
  visit("/");
  setReferrer("");
});

afterEach(() => {
  restoreSessionStorage();
});

describe("attributionSource", () => {
  it("prefers UTM source and medium", () => {
    expect(attributionSource({ utm_source: "google", utm_medium: "cpc" })).toBe(
      "google / cpc"
    );
  });

  it("uses the source alone when the medium is missing", () => {
    expect(attributionSource({ utm_source: "telegram" })).toBe("telegram");
  });

  it("ignores the referer when UTM tags are present", () => {
    expect(
      attributionSource({
        utm_source: "google",
        utm_medium: "cpc",
        referer: "https://t.me/somechannel",
      })
    ).toBe("google / cpc");
  });

  it("falls back to the referer host", () => {
    expect(attributionSource({ referer: "https://t.me/dmo?x=1" })).toBe("t.me");
  });

  it("keeps a malformed referer as plain text instead of throwing", () => {
    expect(attributionSource({ referer: "not a url" })).toBe("not a url");
  });

  it("returns direct when nothing is known", () => {
    expect(attributionSource({})).toBe("direct");
  });

  it("defaults to the stored attribution when called with no argument", () => {
    visit("/?utm_source=vc&utm_medium=article");
    captureAttribution();
    expect(attributionSource()).toBe("vc / article");
  });
});

describe("captureAttribution", () => {
  it("stores UTM tags, landing page and first_seen on first touch", () => {
    visit("/?utm_source=google&utm_medium=cpc&utm_campaign=b2b");
    setReferrer("https://www.google.com/");

    const attribution = captureAttribution();

    expect(attribution.utm_source).toBe("google");
    expect(attribution.utm_medium).toBe("cpc");
    expect(attribution.utm_campaign).toBe("b2b");
    expect(attribution.referer).toBe("https://www.google.com/");
    expect(attribution.landing_page).toContain("utm_source=google");
    expect(Number.isNaN(Date.parse(String(attribution.first_seen)))).toBe(
      false
    );

    const stored = JSON.parse(
      String(window.sessionStorage.getItem(STORAGE_KEY))
    );
    expect(stored.utm_source).toBe("google");
  });

  it("does not wipe the first touch when the visitor comes back without UTM", () => {
    visit("/?utm_source=google&utm_medium=cpc");
    const first = captureAttribution();

    visit("/cases");
    const second = captureAttribution();

    expect(second.utm_source).toBe("google");
    expect(second.utm_medium).toBe("cpc");
    expect(second.landing_page).toBe(first.landing_page);
    expect(second.first_seen).toBe(first.first_seen);
    expect(attributionSource(second)).toBe("google / cpc");
  });

  it("keeps the original landing page and first_seen when new UTM arrive", () => {
    visit("/?utm_source=google&utm_medium=cpc");
    const first = captureAttribution();

    visit("/?utm_source=telegram&utm_medium=post");
    const second = captureAttribution();

    expect(second.utm_source).toBe("telegram");
    expect(second.landing_page).toBe(first.landing_page);
    expect(second.first_seen).toBe(first.first_seen);
  });

  it("truncates absurdly long UTM values", () => {
    visit(`/?utm_source=${"x".repeat(500)}`);
    expect(captureAttribution().utm_source).toHaveLength(200);
  });

  it("records a direct visit with no UTM and no referer", () => {
    visit("/");
    const attribution = captureAttribution();
    expect(attribution.utm_source).toBeUndefined();
    expect(attributionSource(attribution)).toBe("direct");
  });

  it("survives a sessionStorage that throws (private browsing)", () => {
    visit("/?utm_source=google&utm_medium=cpc");
    breakSessionStorage();

    expect(() => captureAttribution()).not.toThrow();
    const attribution = captureAttribution();
    expect(attribution).toBeTypeOf("object");
    expect(attribution.utm_source).toBe("google");
  });

  it("keeps getAttribution working when sessionStorage throws", () => {
    visit("/?utm_source=google");
    breakSessionStorage();

    expect(() => getAttribution()).not.toThrow();
    expect(getAttribution().utm_source).toBe("google");
  });

  it("recovers from corrupted stored JSON instead of throwing", () => {
    window.sessionStorage.setItem(STORAGE_KEY, "{not json");
    visit("/?utm_source=google");

    expect(() => captureAttribution()).not.toThrow();
    expect(captureAttribution().utm_source).toBe("google");
  });
});

describe("getAttribution", () => {
  it("returns what captureAttribution stored", () => {
    visit("/?utm_source=google&utm_medium=cpc");
    captureAttribution();
    visit("/contacts");

    expect(getAttribution().utm_source).toBe("google");
  });

  it("captures on first call when nothing is stored yet", () => {
    visit("/?utm_source=vc");
    expect(getAttribution().utm_source).toBe("vc");
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toContain("vc");
  });
});

describe("buildMailtoFallback", () => {
  const payload: LeadPayload = {
    name: "Иван Петров",
    contact: "@ivan",
    task: "Нужна CRM:\nзаявки, логистика & отчёты",
    link: "https://example.md",
    elapsedMs: 9000,
    attribution: {},
    page: "/",
  };

  function parse(mailto: string) {
    const url = new URL(mailto);
    const params = new URLSearchParams(url.search);
    return {
      recipient: url.pathname,
      subject: params.get("subject") ?? "",
      body: params.get("body") ?? "",
    };
  }

  it("builds a mailto URL addressed to the given mailbox", () => {
    const mailto = buildMailtoFallback(payload, "hello@dmo.md");
    expect(mailto.startsWith("mailto:hello@dmo.md?")).toBe(true);
    expect(parse(mailto).recipient).toBe("hello@dmo.md");
  });

  it("carries every filled field into the body", () => {
    const { subject, body } = parse(buildMailtoFallback(payload, "a@b.md"));

    expect(subject).toBe("Заявка с сайта DMO");
    expect(body).toContain("Имя / компания: Иван Петров");
    expect(body).toContain("Контакт: @ivan");
    expect(body).toContain("Сайт: https://example.md");
    expect(body).toContain("Нужна CRM:");
    expect(body).toContain("заявки, логистика & отчёты");
  });

  it("percent-encodes Cyrillic, newlines and separators", () => {
    const mailto = buildMailtoFallback(payload, "a@b.md");

    // Nothing raw leaks into the URL that would truncate it.
    expect(mailto).not.toContain("\n");
    expect(mailto).not.toContain(" ");
    expect(mailto).toContain("%0A"); // newline
    expect(mailto).toContain("%D0"); // Cyrillic, UTF-8 encoded

    const { body } = parse(mailto);
    expect(body.split("\n").length).toBeGreaterThan(2);
    expect(body).toContain("\n");
  });

  it("drops the site line entirely when the optional link is missing", () => {
    const { body } = parse(
      buildMailtoFallback({ ...payload, link: undefined }, "a@b.md")
    );

    expect(body).not.toContain("Сайт:");
    // No stray blank line where the site line would have been: the only empty
    // line is the single separator before the task text.
    expect(body.split("\n").filter(line => line.trim() === "")).toHaveLength(1);
    expect(body).not.toContain("\n\n\n");
  });

  it("separates the contact block from the task text with one blank line", () => {
    const { body } = parse(buildMailtoFallback(payload, "a@b.md"));
    const [contacts, task] = body.split("\n\n");

    expect(contacts).toContain("Имя / компания:");
    expect(contacts).toContain("Контакт:");
    expect(task).toBe(payload.task);
  });

  it("does not lose an ampersand or an equals sign from the task text", () => {
    const { body } = parse(
      buildMailtoFallback({ ...payload, task: "a&b=c?d #hash" }, "a@b.md")
    );
    expect(body).toContain("a&b=c?d #hash");
  });
});
