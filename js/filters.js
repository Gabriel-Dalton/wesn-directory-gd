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

  function init({ onChange }) {
    onChangeFn = onChange || (() => {});

    // Restore last-used filter state from sessionStorage if available.
    restoreState();

    document.getElementById("search-input").addEventListener("input", (e) => {
      state.search = e.target.value.trim().toLowerCase();
      saveState();
      emit();
    });

    document.getElementById("area-select").value = state.area;
    document.getElementById("area-select").addEventListener("change", (e) => {
      state.area = e.target.value;
      saveState();
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

    // Count how many places fall into each group.
    const counts = new Map();
    for (const p of places) {
      counts.set(p.groupId, (counts.get(p.groupId) || 0) + 1);
    }

    // First pass: enable any group that has any data, defaulting to checked.
    const initializeDefaults = state.enabledGroups.size === 0;
    for (const group of window.AmenityCategories.groups) {
      const count = counts.get(group.id) || 0;
      if (count === 0) continue;
      if (initializeDefaults) state.enabledGroups.add(group.id);
    }

    // Build checkboxes. Show every configured group; disable empty ones.
    for (const group of window.AmenityCategories.groups) {
      const count = counts.get(group.id) || 0;
      const id = `cat-${group.id}`;
      const label = document.createElement("label");
      label.className = "category-item";
      label.htmlFor = id;
      const isEmpty = count === 0;
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
        <span class="category-count" aria-label="${count} places">${count}</span>
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

    saveState();
    emit();
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
        const haystack = `${p.name} ${p.subCategory} ${p.address}`.toLowerCase();
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
        state.search = saved.search;
        document.getElementById("search-input").value = saved.search;
      }
    } catch (_) {
      /* ignore */
    }
  }

  return { init, renderCategories };
})();
