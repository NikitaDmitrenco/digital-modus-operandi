import { useEffect, type RefObject } from "react";

/**
 * Shared page behaviour: scroll-reveal, the custom desktop cursor, magnetic
 * buttons and tilt cards. Extracted from Home so that every route (home, case
 * index, case detail) behaves the same way.
 *
 * Everything here is progressive enhancement: with `prefers-reduced-motion` the
 * CSS already shows reveal blocks immediately, and pointer effects are skipped.
 */
export function useSiteChrome(
  cursorRef: RefObject<HTMLDivElement | null>,
  cursorDotRef: RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Отметка ставится атрибутом, а не классом, и это принципиально: `className`
    // на элементе с `reveal` принадлежит React. Стоит компоненту перерисоваться
    // (например, аккордеон FAQ дописывает `is-active`), React перезапишет
    // className целиком — и класс, добавленный здесь, исчезнет вместе с
    // видимостью блока. Атрибут, которого нет в JSX, React не трогает.
    const revealObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute("data-revealed", "");
          // Показали — наблюдать больше не за чем.
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );
    document
      .querySelectorAll(".reveal")
      .forEach(element => revealObserver.observe(element));

    if (reducedMotion) {
      return () => revealObserver.disconnect();
    }

    const onPointerMove = (event: PointerEvent) => {
      const x = event.clientX;
      const y = event.clientY;
      if (cursorRef.current)
        cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (cursorDotRef.current)
        cursorDotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const interactiveSelector = "a, button, input, textarea, .tilt-card";
    const onPointerOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(interactiveSelector))
        document.body.classList.add("cursor-active");
    };
    const onPointerOut = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(interactiveSelector))
        document.body.classList.remove("cursor-active");
    };

    const magneticElements = Array.from(
      document.querySelectorAll<HTMLElement>(".magnetic")
    );
    const tiltElements = Array.from(
      document.querySelectorAll<HTMLElement>(".tilt-card")
    );

    const onMagneticMove = (event: PointerEvent) => {
      const element = event.currentTarget as HTMLElement;
      const rect = element.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 14;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const resetMagnetic = (event: PointerEvent) => {
      (event.currentTarget as HTMLElement).style.transform =
        "translate3d(0, 0, 0)";
    };
    const onTiltMove = (event: PointerEvent) => {
      const element = event.currentTarget as HTMLElement;
      const rect = element.getBoundingClientRect();
      const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -4;
      const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 5;
      element.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
    };
    const resetTilt = (event: PointerEvent) => {
      (event.currentTarget as HTMLElement).style.transform =
        "perspective(900px) rotateX(0) rotateY(0) translateY(0)";
    };

    magneticElements.forEach(element => {
      element.addEventListener("pointermove", onMagneticMove);
      element.addEventListener("pointerleave", resetMagnetic);
    });
    tiltElements.forEach(element => {
      element.addEventListener("pointermove", onTiltMove);
      element.addEventListener("pointerleave", resetTilt);
    });
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerover", onPointerOver);
    window.addEventListener("pointerout", onPointerOut);

    return () => {
      revealObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerover", onPointerOver);
      window.removeEventListener("pointerout", onPointerOut);
      magneticElements.forEach(element => {
        element.removeEventListener("pointermove", onMagneticMove);
        element.removeEventListener("pointerleave", resetMagnetic);
      });
      tiltElements.forEach(element => {
        element.removeEventListener("pointermove", onTiltMove);
        element.removeEventListener("pointerleave", resetTilt);
      });
    };
  }, [cursorRef, cursorDotRef]);
}
