/**
 * Footer details. The copyright year is filled in at runtime so it never
 * goes stale in the markup.
 */

export function initFooter() {
  const year = document.querySelector("[data-year]");
  if (!year) return;

  year.textContent = String(new Date().getFullYear());
}
