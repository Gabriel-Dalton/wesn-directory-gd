/**
 * Application entry point. Wires together data loading, the map, and the
 * filter sidebar. Each module owns its own state; this file is just glue.
 */
(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("year").textContent = new Date().getFullYear();
    setupTextSizeToggle();

    const map = window.AmenityMap.init("map");

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
    setTimeout(() => window.AmenityMap.fitToVisible(), 50);
  });

  function setStatus(text) {
    const el = document.getElementById("result-count");
    if (el) el.textContent = text;
  }

  function updateResultCount(n) {
    const el = document.getElementById("result-count");
    if (!el) return;
    if (n === 0) {
      el.textContent =
        "No places match the current filters. Try selecting more categories or clearing the search.";
    } else {
      el.textContent = `${n.toLocaleString()} place${n === 1 ? "" : "s"} shown`;
    }
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
})();
