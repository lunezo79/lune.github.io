/**
 * Navigation: sticky-header state, the mobile drawer, and page-view routing.
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
  initPageViews(header);
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

/** Switches between independently scrollable, hash-addressable page views. */
function initPageViews(header) {
  const links = Array.from(document.querySelectorAll("[data-nav-link]"));
  const views = Array.from(document.querySelectorAll("[data-page-view]"));
  if (!views.length) return;

  const showView = (id, animate = true) => {
    const target = document.getElementById(id);
    const activeView = target?.dataset.pageView || "top";

    views.forEach((view) => {
      view.hidden = view.dataset.pageView !== activeView;
      view.classList.remove("page-view-entering");
    });

    const visibleViews = views.filter((view) => !view.hidden);
    if (animate && !prefersReducedMotion()) {
      visibleViews.forEach((view) => {
        void view.offsetWidth;
        view.classList.add("page-view-entering");
        view.addEventListener(
          "animationend",
          () => view.classList.remove("page-view-entering"),
          { once: true }
        );
      });
    }

    links.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${activeView}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    header.dataset.activeView = activeView;
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  };

  const showCurrentView = () => {
    const id = window.location.hash.slice(1) || "top";
    const target = document.getElementById(id);
    if (id !== "top" && !target?.dataset.pageView) return;
    showView(id, false);
  };
  showCurrentView();

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const id = link.getAttribute("href").slice(1);
    const target = document.getElementById(id);
    if (!target?.dataset.pageView) return;

    event.preventDefault();

    if (window.location.hash !== `#${id}`) {
      history.pushState(null, "", `#${id}`);
    }
    showView(id);
  });

  window.addEventListener("popstate", showCurrentView);
  window.addEventListener("hashchange", showCurrentView);
}
