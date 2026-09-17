/**
 * Lead intake endpoint (Vercel Function, Web handler signature).
 *
 * The site is a static SPA, so this function is the only server-side piece:
 * it validates the submission, applies anti-spam checks that a client cannot be
 * trusted with, and forwards the lead to whatever channel the business uses.
 *
 * Configuration (Vercel → Project → Environment Variables), at least one of:
 *   TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID  — sends the lead to a Telegram chat
 *   LEAD_WEBHOOK_URL                       — POSTs the raw lead JSON anywhere
 *
 * With none of them configured the endpoint answers 503 and the form falls back
 * to a prefilled email draft, so a lead is never silently swallowed.
 */

export const config = { runtime: "nodejs" };

type Attribution = Record<string, string | undefined>;

type LeadBody = {
  name?: unknown;
  contact?: unknown;
  task?: unknown;
  link?: unknown;
  company_website?: unknown;
  elapsedMs?: unknown;
  attribution?: Attribution;
  page?: unknown;
};

/** Best-effort, per-instance rate limiting. Serverless instances are not shared,
 *  so this stops floods from one client, not a distributed attack. */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 3;
const hits = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter(
    time => now - time < RATE_LIMIT_WINDOW_MS
  );
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 500) {
    hits.forEach((times, existing) => {
      if (times.every((time: number) => now - time >= RATE_LIMIT_WINDOW_MS))
        hits.delete(existing);
    });
  }
  return recent.length > RATE_LIMIT_MAX;
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function deliver(
  message: string,
  lead: Record<string, unknown>
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const webhook = process.env.LEAD_WEBHOOK_URL;
  let delivered = false;

  if (botToken && chatId) {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    delivered = response.ok;
  }

  if (webhook) {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    delivered = delivered || response.ok;
  }

  return delivered;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return json({ error: "rate_limited" }, 429);
  }

  let body: LeadBody;
  try {
    body = (await request.json()) as LeadBody;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  // Honeypot: a real visitor never sees this field.
  if (text(body.company_website, 200)) {
    // Answer 200 so the bot believes it succeeded and does not retry.
    return json({ ok: true }, 200);
  }

  // A human needs more than two seconds to describe their process.
  const elapsedMs = typeof body.elapsedMs === "number" ? body.elapsedMs : 0;
  if (elapsedMs > 0 && elapsedMs < 2000) {
    return json({ ok: true }, 200);
  }

  const name = text(body.name, 150);
  const contact = text(body.contact, 150);
  const task = text(body.task, 4000);
  const link = text(body.link, 300);
  const page = text(body.page, 500);

  if (name.length < 2 || contact.length < 3 || task.length < 15) {
    return json({ error: "invalid" }, 400);
  }

  const attribution = (body.attribution ?? {}) as Attribution;
  const attributionLines = Object.entries(attribution)
    .filter(([, value]) => typeof value === "string" && value)
    .map(([key, value]) => `${key}: ${String(value).slice(0, 300)}`);

  const message = [
    "<b>Заявка с сайта DMO</b>",
    "",
    `<b>Имя / компания:</b> ${escapeHtml(name)}`,
    `<b>Контакт:</b> ${escapeHtml(contact)}`,
    link ? `<b>Сайт:</b> ${escapeHtml(link)}` : "",
    "",
    `<b>Задача:</b>\n${escapeHtml(task)}`,
    "",
    page ? `<b>Страница:</b> ${escapeHtml(page)}` : "",
    attributionLines.length
      ? `<b>Источник:</b>\n${escapeHtml(attributionLines.join("\n"))}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const lead = {
    name,
    contact,
    task,
    link,
    page,
    attribution,
    receivedAt: new Date().toISOString(),
  };

  if (!process.env.TELEGRAM_BOT_TOKEN && !process.env.LEAD_WEBHOOK_URL) {
    console.warn(
      "[lead] no delivery channel configured, lead not stored",
      lead.receivedAt
    );
    return json({ error: "delivery_not_configured" }, 503);
  }

  try {
    const delivered = await deliver(message, lead);
    if (!delivered) return json({ error: "delivery_failed" }, 503);
    return json({ ok: true }, 200);
  } catch (error) {
    console.error("[lead] delivery error", error);
    return json({ error: "delivery_failed" }, 503);
  }
}
