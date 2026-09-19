import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Минимальная функция-маяк.
 *
 * Делает ровно одно: отвечает. Ни импортов логики, ни чтения окружения —
 * чтобы по её ответу можно было отличить поломку в коде заявок от поломки
 * в самом запуске функций. Сигнатура классическая, `(req, res)`: именно так
 * Vercel зовёт обработчики, и именно на этом висел прежний веб-вариант.
 */
export default function handler(
  _req: IncomingMessage,
  res: ServerResponse
): void {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({ ok: true, at: new Date().toISOString() }));
}
