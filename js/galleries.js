export function initGalleries() {
  document.querySelectorAll("[data-gallery]").forEach((gallery) => {
    const viewport = gallery.querySelector(".model-gallery__viewport");
    const track = gallery.querySelector("[data-gallery-track]");
    const slides = Array.from(gallery.querySelectorAll("[data-gallery-slide]"));
    const label = gallery.querySelector("[data-gallery-label]");
    const previous = gallery.querySelector("[data-gallery-previous]");
    const next = gallery.querySelector("[data-gallery-next]");

    if (!viewport || !track || !label || !previous || !next || slides.length < 2) return;

    let index = 0;

    const update = () => {
      track.style.transform = `translate3d(-${index * viewport.clientWidth}px, 0, 0)`;
      label.textContent = slides[index].dataset.label || `Image ${index + 1}`;
      gallery.setAttribute("aria-label", `Traffic cone model images: ${label.textContent}, image ${index + 1} of ${slides.length}`);
    };

    const move = (direction) => {
      index = (index + direction + slides.length) % slides.length;
      update();
    };

    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));

    gallery.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1);
      }
    });

    window.addEventListener("resize", update, { passive: true });
    update();
  });
}
