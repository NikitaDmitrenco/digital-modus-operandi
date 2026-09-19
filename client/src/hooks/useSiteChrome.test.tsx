// @vitest-environment jsdom
import { act, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSiteChrome } from "./useSiteChrome";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type Entry = { isIntersecting: boolean; target: Element };
let notify: ((entries: Entry[]) => void) | null = null;

/** Наблюдатель, который срабатывает только когда тест этого захочет. */
class StubObserver {
  constructor(callback: (entries: Entry[]) => void) {
    notify = callback;
  }
  observe(target: Element) {
    observed.push(target);
  }
  unobserve() {}
  disconnect() {}
}

/** Всё, за чем наблюдатель согласился следить. */
let observed: Element[] = [];

function Host({ extra = false }: { extra?: boolean }) {
  const cursor = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useSiteChrome(cursor, dot);
  // Класс тут ровно один: если наблюдатель добавит свой, это будет видно.
  return (
    <>
      <div className="reveal" />
      {extra && <div className="reveal" id="later" />}
    </>
  );
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  notify = null;
  observed = [];
  vi.stubGlobal("IntersectionObserver", StubObserver);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }))
  );
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<Host />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("наблюдатель появления", () => {
  it("помечает блок атрибутом и не трогает className", () => {
    const block = container.querySelector<HTMLElement>(".reveal");
    if (!block || !notify) throw new Error("блок или наблюдатель не найдены");

    act(() => notify?.([{ isIntersecting: true, target: block }]));

    // Атрибут переживёт перерисовку; класс React затёр бы вместе с className.
    expect(block.getAttribute("data-revealed")).toBe("");
    expect(block.className).toBe("reveal");
  });

  it("берёт под наблюдение блок, появившийся после монтирования", async () => {
    const before = observed.length;

    // Так на экране появляется «заявка принята» вместо формы: узел рождается
    // уже после того, как наблюдатель обошёл страницу.
    act(() => root.render(<Host extra />));
    // MutationObserver доставляет записи микрозадачей, а не синхронно.
    await act(async () => {
      await Promise.resolve();
    });

    const later = container.querySelector("#later");
    expect(later).not.toBeNull();
    expect(observed.length).toBeGreaterThan(before);
    expect(observed).toContain(later);
  });

  it("не помечает блок, который ещё не попал в вид", () => {
    const block = container.querySelector<HTMLElement>(".reveal");
    if (!block || !notify) throw new Error("блок или наблюдатель не найдены");

    act(() => notify?.([{ isIntersecting: false, target: block }]));

    expect(block.hasAttribute("data-revealed")).toBe(false);
  });
});
