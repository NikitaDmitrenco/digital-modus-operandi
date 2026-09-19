import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Контракт с платформой, а не логика заявок.
 *
 * Vercel зовёт функцию по классической сигнатуре `(req, res)`. Вся остальная
 * проверка в `api-lead.test.ts` работает с `webHandler` напрямую — и именно
 * поэтому не поймала настоящую поломку: обработчик в веб-стиле, вызванный как
 * легаси, падал на `request.headers.get` и не отвечал вовсе. Запрос висел до
 * таймаута платформы: кнопка «Отправляем» не отпускалась, а заявки не уходили.
 * Здесь проверяется то единственное, что тогда имело значение, — что ответ
 * вообще случается.
 */
type NodeHandler = (
  req: IncomingMessage,
  res: ServerResponse
) => Promise<void> | void;

let handler: NodeHandler;

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("TELEGRAM_BOT_TOKEN", undefined as unknown as string);
  vi.stubEnv("TELEGRAM_CHAT_ID", undefined as unknown as string);
  vi.stubEnv("LEAD_WEBHOOK_URL", undefined as unknown as string);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("network access is not allowed in tests");
    })
  );
  const mod = await import("../api/lead");
  handler = mod.default as NodeHandler;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

/** Запрос в том виде, в каком его отдаёт рантайм Node: поток, а не `Request`. */
function nodeRequest(
  url: string,
  options: { method?: string; body?: string; parsedBody?: unknown } = {}
): IncomingMessage {
  const stream = Readable.from(
    options.body === undefined ? [] : [Buffer.from(options.body, "utf8")]
  ) as unknown as IncomingMessage & { body?: unknown };
  stream.method = options.method ?? "GET";
  stream.url = url;
  stream.headers = {
    host: "dmo.md",
    "content-type": "application/json",
    "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250) + 1}`,
  };
  if (options.parsedBody !== undefined) stream.body = options.parsedBody;
  return stream;
}

type Captured = {
  res: ServerResponse;
  finished: Promise<{ status: number; body: string }>;
};

function captureResponse(): Captured {
  let settle: (value: { status: number; body: string }) => void;
  const finished = new Promise<{ status: number; body: string }>(resolve => {
    settle = resolve;
  });
  const res = {
    statusCode: 0,
    headersSent: false,
    setHeader() {},
    end(chunk?: string) {
      settle({ status: res.statusCode, body: chunk ?? "" });
    },
  } as unknown as ServerResponse & { statusCode: number };
  return { res, finished };
}

/** Ответ обязан прийти быстро; зависание — это провал, а не медленный тест. */
async function respond(req: IncomingMessage) {
  const { res, finished } = captureResponse();
  await handler(req, res);
  return await Promise.race([
    finished,
    new Promise<never>((_resolve, reject) =>
      setTimeout(() => reject(new Error("ответа не было: запрос завис")), 1000)
    ),
  ]);
}

describe("вызов функции так, как это делает Vercel", () => {
  it("отвечает на GET, а не висит до таймаута", async () => {
    const answer = await respond(nodeRequest("/api/lead?ping=1"));

    expect(answer.status).toBe(200);
    expect(JSON.parse(answer.body).ok).toBe(true);
  });

  it("отвечает 405 на GET без параметра", async () => {
    const answer = await respond(nodeRequest("/api/lead"));

    expect(answer.status).toBe(405);
  });

  it("читает тело заявки из потока", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const answer = await respond(
      nodeRequest("/api/lead", {
        method: "POST",
        body: JSON.stringify({
          name: "Иван Петров",
          contact: "@ivan",
          task: "Нужна внутренняя система учёта заявок",
          elapsedMs: 9000,
        }),
      })
    );
    errorSpy.mockRestore();

    // Канал не настроен — но тело разобрано, иначе был бы invalid_json.
    expect(answer.status).toBe(503);
    expect(answer.body).not.toContain("invalid_json");
  });

  it("берёт тело, уже разобранное рантаймом, когда поток пуст", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const answer = await respond(
      nodeRequest("/api/lead", {
        method: "POST",
        parsedBody: {
          name: "Иван Петров",
          contact: "@ivan",
          task: "Нужна внутренняя система учёта заявок",
          elapsedMs: 9000,
        },
      })
    );
    errorSpy.mockRestore();

    expect(answer.status).toBe(503);
    expect(answer.body).not.toContain("invalid_json");
  });

  it("отвечает даже когда разбор запроса падает", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = nodeRequest("/api/lead?ping=1");
    Object.defineProperty(broken, "headers", {
      get() {
        throw new Error("рантайм отдал неожиданный запрос");
      },
    });

    const answer = await respond(broken);
    errorSpy.mockRestore();

    expect(answer.status).toBe(500);
  });
});
