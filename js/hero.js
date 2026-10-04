/**
 * Hero ambience. The background glows drift slightly with the pointer, which
 * gives the opening screen depth. Disabled for coarse pointers and for anyone
 * who has asked for reduced motion.
 */

import { prefersReducedMotion, rafThrottle } from "./utils.js";

const MAX_SHIFT_PX = 26;

export function initHero() {
  const hero = document.querySelector("[data-hero]");
  if (!hero) return;
  if (prefersReducedMotion()) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;

  const layers = Array.from(hero.querySelectorAll("[data-parallax]"));
  if (!layers.length) return;

  const move = rafThrottle((clientX, clientY) => {
    const rect = hero.getBoundingClientRect();
    const offsetX = (clientX - rect.left) / rect.width - 0.5;
    const offsetY = (clientY - rect.top) / rect.height - 0.5;

    layers.forEach((layer) => {
      const depth = Number(layer.dataset.parallax) || 1;
      layer.style.setProperty("--px", `${(-offsetX * MAX_SHIFT_PX * depth).toFixed(2)}px`);
      layer.style.setProperty("--py", `${(-offsetY * MAX_SHIFT_PX * depth).toFixed(2)}px`);
    });
  });

  hero.addEventListener("pointermove", (event) => move(event.clientX, event.clientY));

  hero.addEventListener("pointerleave", () => {
    layers.forEach((layer) => {
      layer.style.removeProperty("--px");
      layer.style.removeProperty("--py");
    });
  });
}
