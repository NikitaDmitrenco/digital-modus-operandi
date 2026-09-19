// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Contact from "./Contact";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}", { status: 200 }))
  );
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<Contact />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

function field(id: string): HTMLInputElement | HTMLTextAreaElement {
  const element = container.querySelector<HTMLInputElement>(`#${id}`);
  if (!element) throw new Error(`нет поля ${id}`);
  return element;
}

/** Ввод так, как его видит React: через нативный сеттер плюс событие. */
function type(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

async function submitValidLead() {
  await act(async () => {
    type(field("field-name"), "Иван Петров");
    type(field("field-contact"), "@ivan");
    type(
      field("field-task"),
      "Нужна внутренняя система учёта заявок и складских остатков"
    );
  });
  const form = container.querySelector("form");
  if (!form) throw new Error("формы нет");
  await act(async () => {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );
  });
}

describe("экран после отправки заявки", () => {
  it("остаётся на экране, а не исчезает вместе с формой", async () => {
    await submitValidLead();

    const done = container.querySelector<HTMLElement>(".form-done");
    expect(done).not.toBeNull();
    expect(done?.textContent).toContain("ЗАЯВКА ПРИНЯТА");
    // `reveal` стартует с opacity: 0 и ждёт наблюдателя прокрутки. Блок
    // рождается уже после его обхода, поэтому так и остался бы невидимым:
    // человек увидел бы, как интерфейс пропадает после успешной отправки.
    expect(done?.className).not.toContain("reveal");
  });

  it("убирает форму, чтобы заявку нельзя было отправить дважды", async () => {
    await submitValidLead();

    expect(container.querySelector("form")).toBeNull();
  });
});
