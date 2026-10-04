/**
 * Reading-progress indicator. A thin bar pinned under the header fills as the
 * visitor moves down the page, giving a sense of length on long sections.
 */

import { rafThrottle } from "./utils.js";

export function initProgress() {
  const bar = document.querySelector("[data-progress]");
  if (!bar) return;

  const update = rafThrottle(() => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const ratio = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    bar.style.transform = `scaleX(${ratio.toFixed(4)})`;
  });

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
}
