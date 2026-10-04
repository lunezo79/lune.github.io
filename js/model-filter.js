const CATEGORIES = new Set(["all", "weapons", "greenery", "props", "characters", "geology"]);

export function initModelFilter() {
  const filter = document.querySelector("[data-model-filter]");
  const gallery = document.querySelector("[data-model-gallery]");
  const status = document.querySelector("[data-filter-status]");
  const emptyMessage = document.querySelector("[data-filter-empty]");
  if (!filter || !gallery || !status || !emptyMessage) return;

  const options = Array.from(filter.querySelectorAll("[data-filter-category]"));
  const cards = Array.from(gallery.querySelectorAll("[data-model-category]"));
  const summary = filter.querySelector("summary");

  const applyFilter = (category) => {
    if (!CATEGORIES.has(category)) return;

    let visibleCount = 0;
    cards.forEach((card) => {
      const isVisible = category === "all" || card.dataset.modelCategory === category;
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    options.forEach((option) => {
      option.setAttribute("aria-pressed", String(option.dataset.filterCategory === category));
    });
    status.textContent = category === "all"
      ? "Showing all 3D"
      : `Showing ${category}`;
    emptyMessage.hidden = visibleCount > 0;
  };

  filter.addEventListener("click", (event) => {
    const option = event.target.closest("[data-filter-category]");
    if (!option || !filter.contains(option)) return;

    applyFilter(option.dataset.filterCategory);
    filter.open = false;
    summary.focus();
  });

  filter.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !filter.open) return;
    filter.open = false;
    summary.focus();
  });

  document.addEventListener("click", (event) => {
    if (filter.open && !filter.contains(event.target)) filter.open = false;
  });
}
