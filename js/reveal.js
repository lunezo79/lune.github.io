/**
 * Scroll reveal: fades and lifts elements in as they enter the viewport.
 * Elements inside a `[data-reveal-group]` container are staggered, with the
 * container's attribute value acting as the per-item delay in milliseconds.
 */

import { applyStagger, prefersReducedMotion } from "./utils.js";

const ROOT_MARGIN = "0px 0px -8% 0px";
const THRESHOLD = 0.12;
const DEFAULT_STAGGER = 90;

export function initReveal() {
  applyGroupStagger();

  const items = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!items.length) return;

  // Without JS-driven animation the content should simply be visible.
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: ROOT_MARGIN, threshold: THRESHOLD }
  );

  items.forEach((item) => observer.observe(item));
}

/** Gives each item in a reveal group a slightly later transition delay. */
function applyGroupStagger() {
  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    const step = Number(group.dataset.revealGroup) || DEFAULT_STAGGER;
    applyStagger(group, "[data-reveal]", step);
  });
}
