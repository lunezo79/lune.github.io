/**
 * Reading-progress indicator. A thin bar pinned under the header fills as the
 * visitor moves down the page, giving a sense of length on long sections.
 */

import { rafThrottle } from "./utils.js";

export function initProgress() {
  const bar = document.querySelector("[data-progress]");
  if (!bar) return;

  const update = rafThrottle(() => {
    const activeView = document.querySelector("[data-page-view]:not([hidden])");
    if (!activeView) return;

    const scrollable = activeView.scrollHeight - activeView.clientHeight;
    const ratio = scrollable > 0 ? Math.min(activeView.scrollTop / scrollable, 1) : 0;
    bar.style.transform = `scaleX(${ratio.toFixed(4)})`;
  });

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  document.querySelectorAll("[data-page-view]").forEach((view) => {
    view.addEventListener("scroll", update, { passive: true });
  });
  document.addEventListener("pageviewchange", update);
}
