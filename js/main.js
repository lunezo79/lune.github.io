/**
 * Entry point. Each behaviour lives in its own module; this file only wires
 * them together once the DOM is ready.
 */

import { initFooter } from "./footer.js";
import { initHero } from "./hero.js";
import { initNav } from "./nav.js";
import { initDiscordActivity } from "./discord.js";
import { initProgress } from "./progress.js";
import { initReveal } from "./reveal.js";
import { initSettings } from "./settings.js";
import { initModelFilter } from "./model-filter.js";
import { initToTop } from "./to-top.js";

function init() {
  initNav();
  initDiscordActivity();
  initReveal();
  initHero();
  initToTop();
  initProgress();
  initFooter();
  initSettings();
  initModelFilter();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
