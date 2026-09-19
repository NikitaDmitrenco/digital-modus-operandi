/**
 * Минимальная функция-маяк.
 *
 * Она сознательно не делает ничего: ни импортов, ни чтения окружения, ни
 * экспорта `config`. Её единственная задача — отличить «сломана логика заявок»
 * от «функции вообще не поднимаются в этом проекте». Если `/api/health`
 * отвечает, а `/api/lead` падает — дело в `lead.ts`. Если молчат обе, проблема
 * в сборке или настройках проекта, и в коде её искать бесполезно.
 */
export default async function handler(): Promise<Response> {
  return new Response(
    JSON.stringify({ ok: true, at: new Date().toISOString() }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
}
