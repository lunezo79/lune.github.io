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
      const frameWidth = viewport.getBoundingClientRect().width;
      if (!frameWidth) return;

      slides.forEach((slide) => {
        slide.style.flexBasis = `${frameWidth}px`;
        slide.style.width = `${frameWidth}px`;
      });
      track.style.width = `${frameWidth * slides.length}px`;
      track.style.transform = `translate3d(-${index * frameWidth}px, 0, 0)`;
      label.textContent = slides[index].dataset.label || `Image ${index + 1}`;
      const galleryName = gallery.dataset.galleryName || "Project images";
      gallery.setAttribute("aria-label", `${galleryName}: ${label.textContent}, image ${index + 1} of ${slides.length}`);
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

    if ("ResizeObserver" in window) {
      new ResizeObserver(update).observe(viewport);
    } else {
      window.addEventListener("resize", update, { passive: true });
    }

    gallery.addEventListener("click", (event) => {
      if (event.target.closest("[data-gallery-previous], [data-gallery-next]")) {
        event.stopPropagation();
      }
    });
    update();
  });
}
