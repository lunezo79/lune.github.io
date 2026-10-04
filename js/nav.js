/**
 * Navigation: sticky-header state, the mobile drawer, smooth in-page
 * scrolling and the scroll spy that highlights the current section.
 * Everything is driven by data attributes so the markup stays declarative.
 */

import { prefersReducedMotion, rafThrottle } from "./utils.js";

const MOBILE_BREAKPOINT = 880;
const SCROLL_THRESHOLD = 24;
const DESKTOP_QUERY = `(min-width: ${MOBILE_BREAKPOINT + 1}px)`;
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function initNav() {
  const header = document.querySelector("[data-header]");
  if (!header) return;

  initScrollState(header);
  initDrawer(header);
  initScrollSpy();
  initSmoothScroll();
}

/** Adds `is-scrolled` once the page has moved off the top. */
function initScrollState(header) {
  const apply = rafThrottle(() => {
    header.classList.toggle("is-scrolled", window.scrollY > SCROLL_THRESHOLD);
  });

  apply();
  window.addEventListener("scroll", apply, { passive: true });
}

/** Mobile panel: open/close, focus trap, scroll lock, Escape to dismiss. */
function initDrawer(header) {
  const toggle = header.querySelector("[data-nav-toggle]");
  const nav = header.querySelector("[data-nav]");
  if (!toggle || !nav) return;

  let isOpen = false;

  const focusableInNav = () => Array.from(nav.querySelectorAll(FOCUSABLE));

  const setOpen = (open) => {
    if (open === isOpen) return;
    isOpen = open;

    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("is-locked", open);

    if (open) focusableInNav()[0]?.focus();
  };

  toggle.addEventListener("click", () => setOpen(!isOpen));

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (!isOpen) return;

    if (event.key === "Escape") {
      setOpen(false);
      toggle.focus();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = focusableInNav();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // The panel only exists below the breakpoint; snap shut on the way back up.
  window.matchMedia(DESKTOP_QUERY).addEventListener("change", (event) => {
    if (event.matches) setOpen(false);
  });
}

/** Highlights the nav link for whichever section owns the viewport middle. */
function initScrollSpy() {
  const links = Array.from(document.querySelectorAll("[data-nav-link]"));
  if (!links.length || !("IntersectionObserver" in window)) return;

  const sections = links
    .map((link) => {
      const href = link.getAttribute("href");
      return href && href.startsWith("#") ? document.querySelector(href) : null;
    })
    .filter(Boolean);

  if (!sections.length) return;

  const setActive = (id) => {
    links.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

/** Smooth in-page navigation that respects reduced-motion preferences. */
function initSmoothScroll() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const id = link.getAttribute("href");
    if (!id || id === "#") return;

    const target = document.querySelector(id);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });

    history.replaceState(null, "", id);
  });
}
