/**
 * Back-to-top control. The button sits in the DOM at all times and is only
 * revealed once the visitor has scrolled past the first viewport or so.
 */

import { prefersReducedMotion, rafThrottle } from "./utils.js";

const SHOW_AFTER = 640;

export function initToTop() {
  const button = document.querySelector("[data-to-top]");
  if (!button) return;

  const update = rafThrottle(() => {
    button.classList.toggle("is-visible", window.scrollY > SHOW_AFTER);
  });

  update();
  window.addEventListener("scroll", update, { passive: true });

  button.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  });
}
