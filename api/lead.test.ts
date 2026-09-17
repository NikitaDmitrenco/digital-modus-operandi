import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Server-side lead intake.
 *
 * The handler has the Web signature (`Request` in, `Response` out), so it runs
 * here directly — no dev server, no Vercel runtime. Outbound `fetch` is always
 * stubbed: nothing in these tests may reach api.telegram.org.
 *
 * The rate limiter keeps its state in a module-level Map, so every test gets a
 * freshly imported module AND its own client IP.
 */

type Handler = (request: Request) => Promise<Response>;

let handler: Handler;
let ipCounter = 0;

async function loadHandler(): Promise<Handler> {
  vi.resetModules();
  const mod = await import("./lead");
  return mod.default as Handler;
}

function nextIp(): string {
  ipCounter += 1;
  return `203.0.113.${ipCounter % 250}`;
}

const validLead = {
  name: "Иван Петров",
  contact: "@ivan",
  task: "Нужна внутренняя CRM для производства бетона",
  link: "https://example.md",
  elapsedMs: 12_000,
  attribution: { utm_source: "google", utm_medium: "cpc" },
  page: "/",
};

function post(
  body: unknown,
  ip: string = nextIp(),
  init: RequestInit = {}
): Request {
  return new Request("https://dmo.md/api/lead", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
    ...init,
  });
}

/** fetch stub that reports success and records what was sent. */
function okFetch() {
  return vi.fn(async () => new Response("{}", { status: 200 }));
}

function telegramPayload(fetchMock: ReturnType<typeof okFetch>) {
  const call = fetchMock.mock.calls.find(([url]) =>
    String(url).includes("api.telegram.org")
  );
  if (!call) throw new Error("no Telegram call recorded");
  const init = call[1] as RequestInit;
  return JSON.parse(String(init.body)) as {
    chat_id: string;
    text: string;
    parse_mode: string;
    disable_web_page_preview: boolean;
  };
}

beforeEach(async () => {
  // Nothing is configured unless a test says so.
  vi.stubEnv("TELEGRAM_BOT_TOKEN", undefined as unknown as string);
  vi.stubEnv("TELEGRAM_CHAT_ID", undefined as unknown as string);
  vi.stubEnv("LEAD_WEBHOOK_URL", undefined as unknown as string);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("network access is not allowed in tests");
    })
  );
  handler = await loadHandler();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function configureTelegram() {
  vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:ABC");
  vi.stubEnv("TELEGRAM_CHAT_ID", "-100500");
}

describe("method handling", () => {
  it("rejects GET with 405", async () => {
    const response = await handler(
      new Request("https://dmo.md/api/lead", { method: "GET" })
    );
    expect(response.status).toBe(405);
    await expect(response.json()).resolves.toEqual({
      error: "method_not_allowed",
    });
  });

  it("rejects a malformed JSON body with 400", async () => {
    const response = await handler(post("{not json"));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "invalid_json" });
  });
});

describe("anti-spam", () => {
  it("silently drops a filled honeypot with 200 and sends nothing", async () => {
    configureTelegram();
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    const response = await handler(
      post({ ...validLead, company_website: "http://spam.example" })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("silently drops a submission faster than 2s with 200 and sends nothing", async () => {
    configureTelegram();
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    const response = await handler(post({ ...validLead, elapsedMs: 1200 }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a submission that took longer than 2s", async () => {
    configureTelegram();
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    const response = await handler(post({ ...validLead, elapsedMs: 2500 }));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalled();
  });
});

describe("validation", () => {
  it.each([
    ["name too short", { name: "И" }],
    ["name missing", { name: undefined }],
    ["name not a string", { name: 42 }],
    ["contact too short", { contact: "@" }],
    ["contact missing", { contact: undefined }],
    ["task too short", { task: "коротко" }],
    ["task missing", { task: undefined }],
    ["task is whitespace", { task: "                    " }],
  ])("rejects %s with 400", async (_label, patch) => {
    configureTelegram();
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    const response = await handler(post({ ...validLead, ...patch }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "invalid" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a lead without the optional link", async () => {
    configureTelegram();
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    const response = await handler(post({ ...validLead, link: undefined }));

    expect(response.status).toBe(200);
    expect(telegramPayload(fetchMock).text).not.toContain("Сайт:");
  });
});

describe("delivery configuration", () => {
  it("answers 503 when no channel is configured, so the form can offer email", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const response = await handler(post(validLead));

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "delivery_not_configured",
    });
  });

  it("answers 503 when the only channel refuses the lead", async () => {
    configureTelegram();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 }))
    );

    const response = await handler(post(validLead));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "delivery_failed",
    });
  });

  it("answers 503 when the delivery call throws", async () => {
    configureTelegram();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("boom");
      })
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await handler(post(validLead));

    expect(response.status).toBe(503);
    errorSpy.mockRestore();
  });

  it("delivers through a webhook alone", async () => {
    vi.stubEnv("LEAD_WEBHOOK_URL", "https://hooks.example/lead");
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    const response = await handler(post(validLead));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://hooks.example/lead");
    const payload = JSON.parse(String(init.body));
    expect(payload.name).toBe("Иван Петров");
    expect(payload.attribution.utm_source).toBe("google");
    expect(Number.isNaN(Date.parse(payload.receivedAt))).toBe(false);
  });

  it("posts to Telegram with the configured token, chat and HTML mode", async () => {
    configureTelegram();
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    await handler(post(validLead));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe("https://api.telegram.org/bot123:ABC/sendMessage");
    const payload = telegramPayload(fetchMock);
    expect(payload.chat_id).toBe("-100500");
    expect(payload.parse_mode).toBe("HTML");
    expect(payload.disable_web_page_preview).toBe(true);
  });
});

describe("message building", () => {
  it("escapes HTML from user input so the Telegram markup cannot be injected", async () => {
    configureTelegram();
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    await handler(
      post({
        ...validLead,
        name: "<b>Bold</b> & Co",
        contact: "<a href='x'>@evil</a>",
        task: "<script>alert(1)</script> нужен сайт про C++ & Co",
        link: "https://example.md/?a=1&b=2",
        page: "/<img src=x onerror=1>",
        attribution: { utm_source: "<i>utm</i>" },
      })
    );

    const { text } = telegramPayload(fetchMock);

    expect(text).not.toContain("<script");
    expect(text).not.toContain("</script>");
    expect(text).not.toContain("<a href");
    expect(text).not.toContain("<img");
    expect(text).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(text).toContain("&lt;b&gt;Bold&lt;/b&gt; &amp; Co");
    expect(text).toContain("&lt;i&gt;utm&lt;/i&gt;");
    expect(text).toContain("a=1&amp;b=2");

    // Only the template's own tags survive.
    const tags = text.match(/<[^>]+>/g) ?? [];
    expect(new Set(tags)).toEqual(new Set(["<b>", "</b>"]));
  });

  it("includes contact, task, page and attribution lines", async () => {
    configureTelegram();
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    await handler(post({ ...validLead, page: "/cases/k1-beton" }));

    const { text } = telegramPayload(fetchMock);
    expect(text).toContain("Заявка с сайта DMO");
    expect(text).toContain("Иван Петров");
    expect(text).toContain("@ivan");
    expect(text).toContain("Нужна внутренняя CRM для производства бетона");
    expect(text).toContain("/cases/k1-beton");
    expect(text).toContain("utm_source: google");
    expect(text).toContain("utm_medium: cpc");
  });

  it("trims oversized fields instead of forwarding them whole", async () => {
    configureTelegram();
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    await handler(post({ ...validLead, task: "т".repeat(6000) }));

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(init.body));
    expect(payload.text).not.toContain("т".repeat(4001));
  });
});

describe("rate limiting", () => {
  it("allows 3 submissions per minute from one IP and 429s the fourth", async () => {
    configureTelegram();
    vi.stubGlobal("fetch", okFetch());
    const ip = "198.51.100.7";

    const statuses: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      statuses.push((await handler(post(validLead, ip))).status);
    }

    expect(statuses.slice(0, 3)).toEqual([200, 200, 200]);
    expect(statuses[3]).toBe(429);
    await expect((await handler(post(validLead, ip))).json()).resolves.toEqual({
      error: "rate_limited",
    });
  });

  it("counts per IP, so another visitor is unaffected", async () => {
    configureTelegram();
    vi.stubGlobal("fetch", okFetch());

    for (let i = 0; i < 4; i += 1) {
      await handler(post(validLead, "198.51.100.8"));
    }
    const other = await handler(post(validLead, "198.51.100.9"));

    expect(other.status).toBe(200);
  });

  it("uses the first hop of x-forwarded-for", async () => {
    configureTelegram();
    vi.stubGlobal("fetch", okFetch());

    for (let i = 0; i < 4; i += 1) {
      await handler(post(validLead, "198.51.100.10, 10.0.0.1"));
    }
    const blocked = await handler(post(validLead, "198.51.100.10, 10.0.0.2"));

    expect(blocked.status).toBe(429);
  });

  it("forgets hits older than the window", async () => {
    configureTelegram();
    vi.stubGlobal("fetch", okFetch());
    const ip = "198.51.100.11";

    vi.useFakeTimers();
    try {
      for (let i = 0; i < 3; i += 1) await handler(post(validLead, ip));
      expect((await handler(post(validLead, ip))).status).toBe(429);

      vi.advanceTimersByTime(61_000);
      expect((await handler(post(validLead, ip))).status).toBe(200);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not leak the limiter state between fresh module instances", async () => {
    configureTelegram();
    vi.stubGlobal("fetch", okFetch());
    const ip = "198.51.100.12";

    for (let i = 0; i < 4; i += 1) await handler(post(validLead, ip));
    expect((await handler(post(validLead, ip))).status).toBe(429);

    const fresh = await loadHandler();
    expect((await fresh(post(validLead, ip))).status).toBe(200);
  });
});
