/**
 * Small shared helpers used across the site's modules.
 */

/** True when the visitor has asked their OS to minimise animation. */
export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Wraps a function so it runs at most once per animation frame.
 * Used for scroll and pointer handlers that fire far more often than we paint.
 */
export function rafThrottle(callback) {
  let scheduled = false;
  let lastArgs = [];

  const run = () => {
    scheduled = false;
    callback(...lastArgs);
    lastArgs = [];
  };

  return (...args) => {
    lastArgs = args;
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(run);
  };
}

/**
 * Returns elements matching `selector`, optionally staggered with an
 * increasing CSS custom property so they animate in sequence.
 */
export function applyStagger(container, selector, step = 90) {
  const items = Array.from(container.querySelectorAll(selector));
  items.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${index * step}ms`);
  });
  return items;
}
