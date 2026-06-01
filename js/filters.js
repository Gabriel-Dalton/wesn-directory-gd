/**
 * Filter UI for the WESN Vancouver Amenities Map.
 *
 * Owns:
 *   - Category checkboxes in the sidebar, rendered as a Domain → Subdomain
 *     tree mirroring the WHO Age-Friendly Communities framework (see
 *     js/taxonomy.js + js/categories.js).
 *   - Search input (matches name, sub-category, address).
 *   - Neighbourhood multi-select. Multiple boroughs can be combined; an
 *     "All of Vancouver" checkbox clears the borough filter entirely.
 *
 * Emits filter state changes via a callback; it does NOT touch the map
 * directly — app.js translates filter state into map updates.
 */
window.AmenityFilters = (function () {
  const ALL_AREA = "__all__";
  const KNOWN_AREAS = ["West End", "Downtown", "Kitsilano"];

  let allPlaces = [];
  let onChangeFn = () => {};

  const state = {
    enabledGroups: new Set(),
    search: "",
    areas: new Set(["West End"]),
    // Set of collapsed Domain names. On a first visit every domain starts
    // collapsed so the categories read as a tidy list of drop-down menus
    // rather than a wall of checkboxes; session storage repopulates a
    // returning visitor's own expand/collapse choices.
    collapsedDomains: new Set(),
    // Set of collapsed "Domain|Subdomain" keys (the nested drop-downs inside
    // an open domain). Default: expanded, so opening a domain reveals its
    // categories in one click.
    collapsedSubdomains: new Set(),
  };

  // True once a returning visitor's collapse choices have been restored, so
  // renderCategories knows not to force the first-visit "all collapsed" default.
  let hadSavedCollapsed = false;

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

    initAreaCheckboxes();

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

  /* ---------- Neighbourhood multi-select ---------- */

  function initAreaCheckboxes() {
    const container = document.getElementById("area-options");
    if (!container) return;
    syncAreaCheckboxes();
    container.addEventListener("change", (e) => {
      const cb = e.target;
      if (!(cb instanceof HTMLInputElement) || !cb.dataset.areaValue) return;
      const value = cb.dataset.areaValue;
      if (value === ALL_AREA) {
        // "All of Vancouver" is mutually exclusive with the specific
        // neighbourhood toggles — checking it clears the rest.
        if (cb.checked) state.areas.clear();
      } else {
        if (cb.checked) state.areas.add(value);
        else state.areas.delete(value);
      }
      syncAreaCheckboxes();
      saveState();
      updateCategoryCounts();
      emit();
    });
  }

  function syncAreaCheckboxes() {
    const container = document.getElementById("area-options");
    if (!container) return;
    const showAll = state.areas.size === 0;
    container.querySelectorAll('input[type="checkbox"][data-area-value]').forEach((cb) => {
      const v = cb.dataset.areaValue;
      cb.checked = v === ALL_AREA ? showAll : state.areas.has(v);
    });
  }

  /** True if a place's area passes the current neighbourhood filter. */
  function areaMatches(place) {
    if (state.areas.size === 0) return true; // All of Vancouver
    if (!place.area) return false;
    return state.areas.has(place.area);
  }

  /* ---------- Category tree ---------- */

  /** Build the Domain → Subdomain → tile UI based on actual loaded data. */
  function renderCategories(places) {
    allPlaces = places;
    const container = document.getElementById("category-list");
    container.innerHTML = "";

    // First-visit default: collapse every domain so the categories present as
    // closed drop-down menus. Returning visitors keep their own choices.
    if (!hadSavedCollapsed) {
      for (const { domain } of window.AmenityCategories.tree()) {
        state.collapsedDomains.add(domain);
      }
    }

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

    // Build the Domain → Subdomain → tile tree.
    const tree = window.AmenityCategories.tree();
    for (const { domain, subdomains } of tree) {
      // Only surface domains that contain at least one group with data.
      const domainHasData = subdomains.some(({ groups }) =>
        groups.some((g) => (totalCounts.get(g.id) || 0) > 0)
      );
      if (!domainHasData) continue;

      const domainId = `domain-${slug(domain)}`;
      const isCollapsed = state.collapsedDomains.has(domain);
      const section = document.createElement("div");
      section.className = "domain-section";
      section.dataset.domain = domain;
      section.innerHTML = `
        <button class="domain-header" type="button"
                aria-expanded="${!isCollapsed}"
                aria-controls="${domainId}-body"
                data-domain-toggle="${escapeAttr(domain)}">
          <span class="domain-caret" aria-hidden="true">▾</span>
          <span class="domain-label">${escapeHtml(domain)}</span>
          <span class="domain-count" data-domain-count-for="${escapeAttr(domain)}">0</span>
        </button>
        <div class="domain-body" id="${domainId}-body" ${isCollapsed ? "hidden" : ""}></div>
      `;
      if (isCollapsed) section.classList.add("is-collapsed");
      container.appendChild(section);
      const body = section.querySelector(".domain-body");

      for (const { subdomain, groups } of subdomains) {
        // Skip subdomains with no data.
        const subHasData = groups.some((g) => (totalCounts.get(g.id) || 0) > 0);
        if (!subHasData) continue;

        const subKey = `${domain}|${subdomain}`;
        const subId = `sub-${slug(domain)}-${slug(subdomain)}`;
        const subCollapsed = state.collapsedSubdomains.has(subKey);
        const subSection = document.createElement("div");
        subSection.className = "subdomain-section";
        subSection.dataset.subdomain = subdomain;
        if (subCollapsed) subSection.classList.add("is-collapsed");
        subSection.innerHTML = `
          <button class="subdomain-header" type="button"
                  aria-expanded="${!subCollapsed}"
                  aria-controls="${subId}-body"
                  data-subdomain-toggle="${escapeAttr(subKey)}">
            <span class="subdomain-caret" aria-hidden="true">▾</span>
            <span class="subdomain-label">${escapeHtml(subdomain)}</span>
            <span class="subdomain-count" data-subdomain-count-for="${escapeAttr(subKey)}">0</span>
          </button>
          <div class="subdomain-body" id="${subId}-body" ${subCollapsed ? "hidden" : ""}>
            <div class="category-list" role="group" aria-label="${escapeAttr(subdomain)} categories"></div>
          </div>
        `;
        const list = subSection.querySelector(".category-list");

        for (const group of groups) {
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
            <span class="category-label">${escapeHtml(group.label)}</span>
            <span class="category-count" data-count-for="${group.id}">0</span>
          `;
          list.appendChild(label);
        }

        body.appendChild(subSection);
      }
    }

    // Event delegation for category toggles + domain accordions.
    container.addEventListener("change", (e) => {
      if (e.target.matches('input[type="checkbox"][data-group-id]')) {
        const id = e.target.dataset.groupId;
        if (e.target.checked) state.enabledGroups.add(id);
        else state.enabledGroups.delete(id);
        saveState();
        emit();
      }
    });

    container.addEventListener("click", (e) => {
      const domainToggle = e.target.closest("[data-domain-toggle]");
      if (domainToggle) {
        const domain = domainToggle.dataset.domainToggle;
        const section = domainToggle.closest(".domain-section");
        const body = section.querySelector(".domain-body");
        const isCollapsed = section.classList.toggle("is-collapsed");
        domainToggle.setAttribute("aria-expanded", String(!isCollapsed));
        body.hidden = isCollapsed;
        if (isCollapsed) state.collapsedDomains.add(domain);
        else state.collapsedDomains.delete(domain);
        saveState();
        return;
      }

      const subToggle = e.target.closest("[data-subdomain-toggle]");
      if (subToggle) {
        const key = subToggle.dataset.subdomainToggle;
        const section = subToggle.closest(".subdomain-section");
        const body = section.querySelector(".subdomain-body");
        const isCollapsed = section.classList.toggle("is-collapsed");
        subToggle.setAttribute("aria-expanded", String(!isCollapsed));
        if (body) body.hidden = isCollapsed;
        if (isCollapsed) state.collapsedSubdomains.add(key);
        else state.collapsedSubdomains.delete(key);
        saveState();
      }
    });

    // Counts reflect the active area + search filters — so the totals on the
    // tiles always reconcile with the "N places shown" status line.
    updateCategoryCounts();
    saveState();
    emit();
  }

  /**
   * Recompute the per-tile + rolled-up domain/subdomain counts based on the
   * current area + search filters (but NOT the per-group enabled state). This
   * is what makes the totals agree with what the user sees on the map when
   * they toggle a single group.
   */
  function updateCategoryCounts() {
    const search = state.search;
    const counts = new Map();
    for (const p of allPlaces) {
      if (!areaMatches(p)) continue;
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
      const tile = el.closest(".category-item");
      if (tile && !tile.querySelector("input").disabled) {
        tile.classList.toggle("is-empty", n === 0);
      }
    });

    // Roll up to subdomain + domain headers.
    const subTotals = new Map();
    const domainTotals = new Map();
    for (const group of window.AmenityCategories.groups) {
      const n = counts.get(group.id) || 0;
      const sKey = `${group.domain}|${group.subdomain}`;
      subTotals.set(sKey, (subTotals.get(sKey) || 0) + n);
      domainTotals.set(group.domain, (domainTotals.get(group.domain) || 0) + n);
    }
    document.querySelectorAll("[data-subdomain-count-for]").forEach((el) => {
      const key = el.getAttribute("data-subdomain-count-for");
      const n = subTotals.get(key) || 0;
      el.textContent = n.toLocaleString();
    });
    document.querySelectorAll("[data-domain-count-for]").forEach((el) => {
      const key = el.getAttribute("data-domain-count-for");
      const n = domainTotals.get(key) || 0;
      el.textContent = n.toLocaleString();
    });
  }

  /** Apply the current filter state to the master list. */
  function visiblePlaces() {
    const search = state.search;
    return allPlaces.filter((p) => {
      if (!state.enabledGroups.has(p.groupId)) return false;
      if (!areaMatches(p)) return false;
      if (search) {
        const haystack = normalizeForSearch(`${p.name} ${p.subCategory} ${p.amenity || ""} ${p.subdomain || ""} ${p.address}`);
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }

  function syncCheckboxes() {
    document
      .querySelectorAll('#category-list input[type="checkbox"][data-group-id]')
      .forEach((cb) => {
        cb.checked = state.enabledGroups.has(cb.dataset.groupId);
      });
  }

  function emit() {
    onChangeFn({
      enabledGroups: new Set(state.enabledGroups),
      areas: new Set(state.areas),
      search: state.search,
      visiblePlaces: visiblePlaces(),
    });
  }

  /* ---------- Persistence ---------- */

  function saveState() {
    try {
      sessionStorage.setItem(
        "wesn-amenities-filters",
        JSON.stringify({
          enabledGroups: [...state.enabledGroups],
          areas: [...state.areas],
          search: state.search,
          collapsedDomains: [...state.collapsedDomains],
          collapsedSubdomains: [...state.collapsedSubdomains],
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
      if (Array.isArray(saved.areas)) {
        state.areas = new Set(saved.areas);
      } else if (typeof saved.area === "string") {
        // Migrate single-area state from the previous version.
        state.areas = saved.area === "all" ? new Set() : new Set([saved.area]);
      }
      if (Array.isArray(saved.collapsedDomains)) {
        state.collapsedDomains = new Set(saved.collapsedDomains);
        hadSavedCollapsed = true;
      }
      if (Array.isArray(saved.collapsedSubdomains))
        state.collapsedSubdomains = new Set(saved.collapsedSubdomains);
      if (typeof saved.search === "string") {
        state.search = normalizeForSearch(saved.search);
        document.getElementById("search-input").value = saved.search;
      }
    } catch (_) {
      /* ignore */
    }
  }

  /* ---------- Helpers ---------- */

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(s) {
    return escapeHtml(s);
  }

  return { init, renderCategories, KNOWN_AREAS };
})();
