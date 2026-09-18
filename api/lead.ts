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
 * TELEGRAM_CHAT_ID принимает несколько получателей через запятую
 * («670030360, -1001234567890»): заявка уходит каждому из них независимо.
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
  honey_ref?: unknown;
  elapsedMs?: unknown;
  attribution?: Attribution;
  page?: unknown;
};

/** Best-effort, per-instance rate limiting. Serverless instances are not shared,
 *  so this stops floods from one client, not a distributed attack. */
/** Ниже этого порога заполнение считается машинным. */
const MIN_FILL_MS = 2000;
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

type DeliveryResult = { delivered: boolean; reason: string };

/**
 * Значения переменных окружения обрезаются: токен, скопированный из чата или
 * BotFather, часто приезжает с хвостовым пробелом или переводом строки, и
 * тогда Telegram отвечает 404 на несуществующий метод.
 */
function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

/**
 * Получатели заявки в Telegram. Переменная принимает список через запятую,
 * поэтому владельцев бота может быть несколько: пустые куски и повторы
 * отбрасываются, порядок сохраняется.
 */
function chatIds(): string[] {
  const parsed = env("TELEGRAM_CHAT_ID")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  return Array.from(new Set(parsed));
}

type SendResult = { ok: true } | { ok: false; reason: string };

async function sendToTelegram(
  botToken: string,
  chatId: string,
  message: string
): Promise<SendResult> {
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
  if (response.ok) return { ok: true };
  // Телеграм объясняет отказ текстом: «chat not found», «bot was blocked
  // by the user», «Unauthorized». Без этого 503 неотличим один от другого.
  const detail = await response.text().catch(() => "");
  return {
    ok: false,
    reason: `telegram ${response.status}: ${detail.slice(0, 300)}`,
  };
}

async function deliver(
  message: string,
  lead: Record<string, unknown>
): Promise<DeliveryResult> {
  const botToken = env("TELEGRAM_BOT_TOKEN");
  const chats = chatIds();
  const webhook = env("LEAD_WEBHOOK_URL");
  let delivered = false;
  const reasons: string[] = [];

  if (botToken && chats.length > 0) {
    // allSettled, а не all: отказ одного получателя не должен отменять
    // отправку остальным — заявка нужна хотя бы кому-то из владельцев.
    const results = await Promise.allSettled(
      chats.map(chat => sendToTelegram(botToken, chat, message))
    );
    results.forEach((result, index) => {
      // Идентификатор чата остаётся в логе и не уходит в HTTP-ответ: наружу
      // светить внутренние адреса доставки незачем.
      const failed = (reason: string) => {
        console.error(`[lead] чат ${chats[index]} не получил заявку:`, reason);
        reasons.push(reason);
      };
      if (result.status === "rejected") {
        failed(`telegram: ${String(result.reason)}`);
        return;
      }
      if (result.value.ok) {
        delivered = true;
        return;
      }
      failed(result.value.reason);
    });
  } else if (botToken || chats.length > 0) {
    reasons.push(
      `telegram: задана только одна переменная из пары (token: ${botToken ? "есть" : "нет"}, chat_id: ${chats.length > 0 ? "есть" : "нет"})`
    );
  }

  if (webhook) {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    if (response.ok) delivered = true;
    else reasons.push(`webhook ${response.status}`);
  }

  return { delivered, reason: Array.from(new Set(reasons)).join("; ") };
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

  // Ниже два отсева, которые отвечают 200 и НИЧЕГО не отправляют: бот должен
  // считать, что всё получилось, и не повторять попытку. Обратная сторона — при
  // ложном срабатывании живой человек тоже увидит «Заявка принята», а заявка
  // пропадёт. Поэтому оба пишут в лог и помечают ответ `queued: false`:
  // в Network-вкладке и в логах Vercel такой случай видно, боту это безразлично.
  if (text(body.honey_ref, 200)) {
    console.warn("[lead] ОТСЕЯНО как спам: заполнено скрытое поле", {
      contact: text(body.contact, 150),
    });
    return json({ ok: true, queued: false }, 200);
  }

  const elapsedMs = typeof body.elapsedMs === "number" ? body.elapsedMs : 0;
  if (elapsedMs > 0 && elapsedMs < MIN_FILL_MS) {
    console.warn(
      "[lead] ОТСЕЯНО как спам: форма заполнена за",
      elapsedMs,
      "мс",
      {
        contact: text(body.contact, 150),
      }
    );
    return json({ ok: true, queued: false }, 200);
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

  if (!env("TELEGRAM_BOT_TOKEN") && !env("LEAD_WEBHOOK_URL")) {
    console.error(
      "[lead] НЕ ДОСТАВЛЕНО: канал не настроен. Задайте TELEGRAM_BOT_TOKEN и " +
        "TELEGRAM_CHAT_ID в переменных окружения Vercel и передеплойте.",
      { receivedAt: lead.receivedAt, contact }
    );
    return json({ error: "delivery_not_configured" }, 503);
  }

  try {
    const { delivered, reason } = await deliver(message, lead);
    if (!delivered) {
      const detail = reason || "no channel matched";
      console.error("[lead] НЕ ДОСТАВЛЕНО:", detail, {
        receivedAt: lead.receivedAt,
        contact,
      });
      return json({ error: "delivery_failed", detail }, 503);
    }
    // Часть получателей могла отказать — заявка дошла, но молчать об этом
    // нельзя: иначе второй владелец бота тихо перестанет получать заявки.
    if (reason) {
      console.warn("[lead] доставлено не всем получателям:", reason, {
        receivedAt: lead.receivedAt,
        contact,
      });
    }
    console.log("[lead] доставлено", { receivedAt: lead.receivedAt, contact });
    return json({ ok: true }, 200);
  } catch (error) {
    console.error("[lead] НЕ ДОСТАВЛЕНО: исключение при отправке", error);
    return json({ error: "delivery_failed" }, 503);
  }
}
