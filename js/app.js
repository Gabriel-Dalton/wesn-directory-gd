/**
 * Application entry point. Wires together data loading, the map, and the
 * filter sidebar. Each module owns its own state; this file is just glue.
 */
(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("year").textContent = new Date().getFullYear();
    setupTextSizeToggle();
    setupSidebarDrawer();

    const map = window.AmenityMap.init("map");

    if (window.AmenitySearchAutocomplete) {
      window.AmenitySearchAutocomplete.init({
        inputId: "search-input",
        listboxId: "search-suggestions",
        statusId: "search-status",
      });
    }

    if (window.AmenityAnalytics) {
      window.AmenityAnalytics.init();
    }

    window.AmenityFilters.init({
      onChange: (filterState) => {
        for (const group of window.AmenityCategories.groups) {
          window.AmenityMap.setGroupVisible(
            group.id,
            filterState.enabledGroups.has(group.id)
          );
        }
        // Replace markers to reflect search + area filtering.
        window.AmenityMap.setPlaces(filterState.visiblePlaces);
        updateResultCount(filterState.visiblePlaces.length);
      },
    });

    setStatus("Loading places…");
    const { places, errors } = await window.AmenityData.loadAll();

    if (places.length === 0) {
      setStatus(
        "Could not load any data. Check your internet connection and refresh."
      );
      return;
    }

    window.AmenityFilters.renderCategories(places);

    if (window.AmenitySearchAutocomplete) {
      window.AmenitySearchAutocomplete.setPlaces(places);
    }

    if (window.AmenityAnalytics) {
      window.AmenityAnalytics.setPlaces(places);
    }

    if (errors.length) {
      const recovered = errors.filter((e) => e.recovered);
      const failed = errors.filter((e) => !e.recovered);
      if (failed.length) {
        console.warn("Some data sources failed:", failed);
      }
      if (recovered.length) {
        setStatus(
          `Loaded ${places.length.toLocaleString()} places. ` +
            "Some live data was unavailable; offline backup is in use."
        );
        return;
      }
    }

    // First-load fit: zoom to currently visible markers (after filters apply).
    setTimeout(() => {
      window.AmenityMap.fitToVisible();
      // Leaflet needs invalidateSize after layout shifts (e.g. mobile drawer).
      if (map && map.invalidateSize) map.invalidateSize();
    }, 50);

    // Re-invalidate on viewport/orientation changes so the map fills the
    // available space when the mobile URL bar collapses, the device rotates,
    // or the user widens a desktop window.
    setupMapResizeWatcher(map);
  });

  function setupMapResizeWatcher(map) {
    if (!map || typeof map.invalidateSize !== "function") return;
    let raf = 0;
    const refresh = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = 0;
        map.invalidateSize();
      });
    };
    window.addEventListener("resize", refresh, { passive: true });
    window.addEventListener("orientationchange", refresh);
    if (typeof ResizeObserver === "function") {
      const mapEl = document.getElementById("map");
      if (mapEl) new ResizeObserver(refresh).observe(mapEl);
    }
  }

  function setStatus(text) {
    const el = document.getElementById("result-count");
    if (el) el.textContent = text;
    updateToggleBadge(null);
  }

  function updateResultCount(n) {
    const el = document.getElementById("result-count");
    if (el) {
      if (n === 0) {
        el.textContent =
          "No places match the current filters. Try selecting more categories or clearing the search.";
      } else {
        el.textContent = `${n.toLocaleString()} place${n === 1 ? "" : "s"} shown`;
      }
    }
    updateToggleBadge(n);
  }

  function updateToggleBadge(n) {
    const badge = document.getElementById("filters-toggle-count");
    if (!badge) return;
    if (n === null || n === undefined || Number.isNaN(n)) {
      badge.classList.remove("is-visible");
      badge.textContent = "";
      return;
    }
    badge.textContent = n.toLocaleString();
    badge.classList.add("is-visible");
  }

  /** Toggle a 'text-large' root class to bump font-size for low-vision users. */
  function setupTextSizeToggle() {
    const btn = document.getElementById("text-size-toggle");
    if (!btn) return;
    const stored = localStorage.getItem("wesn-amenities-text-large") === "1";
    if (stored) {
      document.documentElement.classList.add("text-large");
      btn.setAttribute("aria-pressed", "true");
    }
    btn.addEventListener("click", () => {
      const isOn = document.documentElement.classList.toggle("text-large");
      btn.setAttribute("aria-pressed", String(isOn));
      try {
        localStorage.setItem("wesn-amenities-text-large", isOn ? "1" : "0");
      } catch (_) { /* ignore */ }
    });
  }

  /**
   * Mobile-only: bottom-sheet style drawer for filters/search.
   * The sidebar is always present in the DOM; on small screens CSS hides it
   * by translating it off-screen until `is-open` is added.
   */
  function setupSidebarDrawer() {
    const toggle = document.getElementById("filters-toggle");
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    const closeBtn = document.getElementById("sidebar-close");
    const applyBtn = document.getElementById("sidebar-apply");
    if (!toggle || !sidebar || !backdrop) return;

    const open = () => {
      sidebar.classList.add("is-open");
      backdrop.hidden = false;
      // next frame so the transition runs
      requestAnimationFrame(() => backdrop.classList.add("is-visible"));
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      // Move focus to the close button for keyboard users.
      setTimeout(() => closeBtn && closeBtn.focus(), 50);
    };

    const close = () => {
      sidebar.classList.remove("is-open");
      backdrop.classList.remove("is-visible");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      // Hide backdrop after transition so it doesn't catch clicks, and ask
      // the Leaflet map to recalc its size now that the sheet animation has
      // finished (tile reflow when the user rotates while the drawer is up).
      setTimeout(() => {
        if (!backdrop.classList.contains("is-visible")) backdrop.hidden = true;
        if (window.AmenityMap && window.AmenityMap.invalidateSize) {
          window.AmenityMap.invalidateSize();
        }
      }, 280);
      toggle.focus();
    };

    toggle.addEventListener("click", () => {
      const isOpen = sidebar.classList.contains("is-open");
      if (isOpen) close();
      else open();
    });

    if (closeBtn) closeBtn.addEventListener("click", close);
    if (applyBtn) applyBtn.addEventListener("click", close);
    backdrop.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidebar.classList.contains("is-open")) {
        close();
      }
    });

    // If viewport widens past the mobile breakpoint, ensure drawer state resets.
    const mq = window.matchMedia("(min-width: 881px)");
    const handle = () => {
      if (mq.matches && sidebar.classList.contains("is-open")) {
        sidebar.classList.remove("is-open");
        backdrop.classList.remove("is-visible");
        backdrop.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    };
    if (mq.addEventListener) mq.addEventListener("change", handle);
    else if (mq.addListener) mq.addListener(handle);
  }
})();
