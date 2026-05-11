/**
 * Filter UI for the WESN Vancouver Amenities Map.
 *
 * Owns:
 *   - Category checkboxes in the sidebar.
 *   - Search input (matches name, sub-category, address).
 *   - Neighbourhood select.
 *
 * Emits filter state changes via a callback; it does NOT touch the map
 * directly — app.js translates filter state into map updates.
 */
window.AmenityFilters = (function () {
  let allPlaces = [];
  let onChangeFn = () => {};

  const state = {
    enabledGroups: new Set(),
    search: "",
    area: "West End",
  };

  /**
   * Normalize text for substring matching so abbreviated and spelled-out
   * street suffixes are treated as equivalent. Both the haystack (place
   * name/sub-category/address) and the user's query run through this so
   * "Denman St" in the data still matches a "Denman Street" search.
   */
  function normalizeForSearch(s) {
    return String(s)
      .toLowerCase()
      .replace(/\bst\.?\b/g, "street")
      .replace(/\bave?\.?\b/g, "avenue")
      .replace(/\bav\.?\b/g, "avenue")
      .replace(/\bblvd\.?\b/g, "boulevard")
      .replace(/\brd\.?\b/g, "road")
      .replace(/\bdr\.?\b/g, "drive")
      .replace(/\bhwy\.?\b/g, "highway")
      .replace(/\bpl\.?\b/g, "place")
      .replace(/\bcres\.?\b/g, "crescent")
      .replace(/\s+/g, " ")
      .trim();
  }

  function init({ onChange }) {
    onChangeFn = onChange || (() => {});

    // Restore last-used filter state from sessionStorage if available.
    restoreState();

    document.getElementById("search-input").addEventListener("input", (e) => {
      state.search = normalizeForSearch(e.target.value);
      saveState();
      updateCategoryCounts();
      emit();
    });

    document.getElementById("area-select").value = state.area;
    document.getElementById("area-select").addEventListener("change", (e) => {
      state.area = e.target.value;
      saveState();
      updateCategoryCounts();
      emit();
    });

    document.getElementById("select-all").addEventListener("click", () => {
      for (const g of window.AmenityCategories.groups) state.enabledGroups.add(g.id);
      syncCheckboxes();
      saveState();
      emit();
    });

    document.getElementById("clear-all").addEventListener("click", () => {
      state.enabledGroups.clear();
      syncCheckboxes();
      saveState();
      emit();
    });
  }

  /** Build the category checkbox UI based on actual loaded data. */
  function renderCategories(places) {
    allPlaces = places;
    const container = document.getElementById("category-list");
    container.innerHTML = "";

    // Citywide totals (used only to decide whether a category exists at all).
    const totalCounts = new Map();
    for (const p of places) {
      totalCounts.set(p.groupId, (totalCounts.get(p.groupId) || 0) + 1);
    }

    // First pass: enable any group that has any data, defaulting to checked.
    const initializeDefaults = state.enabledGroups.size === 0;
    for (const group of window.AmenityCategories.groups) {
      const count = totalCounts.get(group.id) || 0;
      if (count === 0) continue;
      if (initializeDefaults) state.enabledGroups.add(group.id);
    }

    // Build checkboxes. Show every configured group; disable empty ones.
    for (const group of window.AmenityCategories.groups) {
      const isEmpty = (totalCounts.get(group.id) || 0) === 0;
      const id = `cat-${group.id}`;
      const label = document.createElement("label");
      label.className = "category-item";
      label.htmlFor = id;
      label.dataset.groupId = group.id;
      if (isEmpty) {
        label.style.opacity = "0.55";
        label.title = "No locations in this category right now.";
      }
      label.innerHTML = `
        <input id="${id}" type="checkbox"
               data-group-id="${group.id}"
               ${state.enabledGroups.has(group.id) ? "checked" : ""}
               ${isEmpty ? "disabled" : ""}>
        <span class="category-icon" aria-hidden="true">${group.icon}</span>
        <span class="category-label">${group.label}</span>
        <span class="category-count" data-count-for="${group.id}">0</span>
      `;
      container.appendChild(label);
    }

    container.addEventListener("change", (e) => {
      if (e.target.matches('input[type="checkbox"][data-group-id]')) {
        const id = e.target.dataset.groupId;
        if (e.target.checked) state.enabledGroups.add(id);
        else state.enabledGroups.delete(id);
        saveState();
        emit();
      }
    });

    // Counts reflect the active area + search filters — so the totals on the
    // tiles always reconcile with the "N places shown" status line.
    updateCategoryCounts();
    saveState();
    emit();
  }

  /**
   * Recompute the per-tile counts based on the current area + search filters
   * (but NOT the per-group enabled state). This is what makes the tile number
   * agree with what the user sees on the map when they toggle a single group.
   */
  function updateCategoryCounts() {
    const search = state.search;
    const area = state.area;
    const counts = new Map();
    for (const p of allPlaces) {
      if (area !== "all") {
        if (!p.area || p.area !== area) continue;
      }
      if (search) {
        const haystack = normalizeForSearch(`${p.name} ${p.subCategory} ${p.amenity || ""} ${p.subdomain || ""} ${p.address}`);
        if (!haystack.includes(search)) continue;
      }
      counts.set(p.groupId, (counts.get(p.groupId) || 0) + 1);
    }
    document.querySelectorAll("[data-count-for]").forEach((el) => {
      const id = el.getAttribute("data-count-for");
      const n = counts.get(id) || 0;
      el.textContent = n.toLocaleString();
      el.setAttribute("aria-label", `${n} places`);
      // Visually mute tiles whose category has no matches under current filters,
      // but still keep them clickable so the user can broaden the search.
      const tile = el.closest(".category-item");
      if (tile && !tile.querySelector("input").disabled) {
        tile.classList.toggle("is-empty", n === 0);
      }
    });
  }

  /** Apply the current filter state to the master list. */
  function visiblePlaces() {
    const search = state.search;
    return allPlaces.filter((p) => {
      if (!state.enabledGroups.has(p.groupId)) return false;
      if (state.area !== "all" && p.area && p.area !== state.area) return false;
      if (state.area !== "all" && !p.area) {
        // Keep places with no recorded area only when "all" is selected.
        return false;
      }
      if (search) {
        const haystack = normalizeForSearch(`${p.name} ${p.subCategory} ${p.amenity || ""} ${p.subdomain || ""} ${p.address}`);
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }

  function syncCheckboxes() {
    document
      .querySelectorAll('#category-list input[type="checkbox"]')
      .forEach((cb) => {
        cb.checked = state.enabledGroups.has(cb.dataset.groupId);
      });
  }

  function emit() {
    onChangeFn({
      enabledGroups: new Set(state.enabledGroups),
      area: state.area,
      search: state.search,
      visiblePlaces: visiblePlaces(),
    });
  }

  function saveState() {
    try {
      sessionStorage.setItem(
        "wesn-amenities-filters",
        JSON.stringify({
          enabledGroups: [...state.enabledGroups],
          area: state.area,
          search: state.search,
        })
      );
    } catch (_) {
      /* ignore (private mode etc.) */
    }
  }

  function restoreState() {
    try {
      const raw = sessionStorage.getItem("wesn-amenities-filters");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (Array.isArray(saved.enabledGroups))
        state.enabledGroups = new Set(saved.enabledGroups);
      if (typeof saved.area === "string") state.area = saved.area;
      if (typeof saved.search === "string") {
        state.search = normalizeForSearch(saved.search);
        document.getElementById("search-input").value = saved.search;
      }
    } catch (_) {
      /* ignore */
    }
  }

  return { init, renderCategories };
})();
