(() => {
  // ---- Config -------------------------------------------------------------
  const HEADING_SELECTOR = "main h2, main h3";
  const TOC_LINK_SELECTOR = ".toc a[href^='#']";
  const MIN_ACTIVATE_AT = 180;
  
  // ---- Helpers ------------------------------------------------------------
  const $all = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const decodeHash = (href) => {
    const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "";
    return decodeURIComponent(hash.replace(/^#/, ""));
  };

  const getActivateOffset = (sampleHeading) => {
    if (!sampleHeading) return MIN_ACTIVATE_AT;
    return Math.max(0, MIN_ACTIVATE_AT);
  };

  const upperBound = (arr, x) => {
    let lo = 0, hi = arr.length - 1, ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid] <= x) { ans = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    return ans;
  };

  // ---- Init ---------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    const headings = $all(HEADING_SELECTOR).filter(h => h.id);
    const tocLinkById = new Map(
      $all(TOC_LINK_SELECTOR).map(a => [decodeHash(a.getAttribute("href") || ""), a])
    );

    if (!headings.length || !tocLinkById.size) return;

    const ACTIVATE_AT = getActivateOffset(headings[0]);

    let tops = [];
    let currentLink = null;
    let ticking = false;

    // ---- Core -------------------------------------------------------------
    const recalc = () => {
      tops = headings.map(h => {
        const rect = h.getBoundingClientRect();
        return rect.top + window.scrollY;
      });
    };

    const setActiveByIndex = (idx) => {
      const id = (idx >= 0 ? headings[idx] : headings[0]).id;
      const next = tocLinkById.get(id);
      if (!next || next === currentLink) return;

      if (currentLink) {
        currentLink.classList.remove("active");
        currentLink.removeAttribute("aria-current");
      }

      next.classList.add("active");
      next.setAttribute("aria-current", "true");
      currentLink = next;
    };

    const updateOnScroll = () => {
      const y = window.scrollY + ACTIVATE_AT;
      const idx = upperBound(tops, y);
      setActiveByIndex(idx);
    };

    const onTick = () => {
      ticking = false;
      updateOnScroll();
    };

    const requestTick = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onTick);
      }
    };

    // ---- Events -----------------------------------------------------------
    const onScroll = requestTick;

    const onResizeLike = () => {
      recalc();
      requestTick();
    };

    recalc();
    setActiveByIndex(0);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResizeLike, { passive: true });
    window.addEventListener("orientationchange", onResizeLike, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onResizeLike, { passive: true });
    }

    window.addEventListener("load", onResizeLike, { passive: true });

    window.addEventListener("pageshow", (e) => {
      if (e.persisted) onResizeLike();
    }, { passive: true });

    window.addEventListener("hashchange", onResizeLike, { passive: true });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(onResizeLike).catch(() => {});
    }
  });
})();
