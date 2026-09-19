// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Faq from "./Faq";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<Faq />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function items(): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(".faq-item"));
}

/** Помечает блоки так же, как это делает наблюдатель появления. */
function revealAll() {
  items().forEach(item => item.setAttribute("data-revealed", ""));
}

function toggle(item: HTMLElement) {
  const button = item.querySelector("button");
  if (!button) throw new Error("у вопроса нет кнопки");
  act(() => button.click());
}

describe("аккордеон FAQ", () => {
  it("раскрывает вопрос и сворачивает предыдущий", () => {
    const [first, second] = items();
    expect(first.querySelector("button")?.getAttribute("aria-expanded")).toBe(
      "true"
    );

    toggle(second);

    expect(second.querySelector("button")?.getAttribute("aria-expanded")).toBe(
      "true"
    );
    expect(first.querySelector("button")?.getAttribute("aria-expanded")).toBe(
      "false"
    );
  });

  it("сворачивает открытый вопрос повторным нажатием", () => {
    const [first] = items();

    toggle(first);

    expect(first.querySelector("button")?.getAttribute("aria-expanded")).toBe(
      "false"
    );
  });

  it("не прячет вопрос при переключении", () => {
    // Регрессия: отметку появления ставил класс, а className на этих блоках
    // принадлежит React. Перерисовка от клика затирала её, и вопрос исчезал.
    revealAll();
    const [, second] = items();

    toggle(second);

    items().forEach(item =>
      expect(item.hasAttribute("data-revealed")).toBe(true)
    );
    expect(second.className).toContain("is-active");
  });
});
