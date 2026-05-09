/**
 * Search autocomplete for the WESN Vancouver Amenities Map.
 *
 * Reduces typing for seniors by suggesting matching place names, street
 * names, and service categories drawn from the loaded data. Implements the
 * ARIA 1.2 combobox pattern (input + listbox) so screen readers announce
 * suggestions correctly and keyboard users can navigate without a mouse.
 *
 * Selecting a suggestion writes its text into the search input and
 * dispatches a synthetic `input` event so the existing AmenityFilters
 * pipeline picks it up — autocomplete and filters stay decoupled.
 */
window.AmenitySearchAutocomplete = (function () {
  const MAX_SUGGESTIONS = 8;
  const MIN_QUERY_LENGTH = 2;

  let inputEl = null;
  let listboxEl = null;
  let statusEl = null;
  let index = { streets: [], places: [], categories: [] };
  let suggestions = [];
  let activeIdx = -1;
  let currentQuery = "";
  let isOpen = false;

  function init({ inputId, listboxId, statusId }) {
    inputEl = document.getElementById(inputId);
    listboxEl = document.getElementById(listboxId);
    statusEl = statusId ? document.getElementById(statusId) : null;
    if (!inputEl || !listboxEl) return;

    inputEl.setAttribute("role", "combobox");
    inputEl.setAttribute("aria-autocomplete", "list");
    inputEl.setAttribute("aria-expanded", "false");
    inputEl.setAttribute("aria-controls", listboxEl.id);
    inputEl.setAttribute("autocomplete", "off");
    inputEl.setAttribute("autocorrect", "off");
    inputEl.setAttribute("autocapitalize", "off");
    inputEl.setAttribute("spellcheck", "false");

    inputEl.addEventListener("input", onInput);
    inputEl.addEventListener("keydown", onKeyDown);
    inputEl.addEventListener("focus", onFocus);
    inputEl.addEventListener("blur", onBlur);

    // mousedown (not click) so we beat the input's blur and keep focus.
    listboxEl.addEventListener("mousedown", onListMouseDown);
    listboxEl.addEventListener("mousemove", onListMouseMove);

    document.addEventListener("click", onDocClick);
  }

  /** Collapse newlines / runs of whitespace so suggestions render on one line. */
  function clean(s) {
    return String(s).replace(/\s+/g, " ").trim();
  }

  /**
   * Reject text that looks like garbage from upstream encoding issues
   * (e.g. "????? ?????/OCCUPYING CHINATOWN") so it never surfaces as a hint.
   */
  function looksLikeNoise(s) {
    if (!s) return true;
    const letters = (s.match(/[A-Za-z]/g) || []).length;
    if (letters < 2) return true;
    const questionMarks = (s.match(/\?/g) || []).length;
    if (questionMarks >= 3 && questionMarks > letters / 4) return true;
    return false;
  }

  /** Build an index of unique streets, place names, and categories. */
  function setPlaces(places) {
    const streets = new Map();    // normalized -> display
    const placeNames = new Map();
    const categories = new Map();

    for (const p of places) {
      if (p.name) {
        const name = clean(p.name);
        if (name && !looksLikeNoise(name)) {
          const k = name.toLowerCase();
          if (!placeNames.has(k)) placeNames.set(k, name);
        }
      }
      const street = extractStreet(p.address);
      if (street) {
        const k = street.toLowerCase();
        if (!streets.has(k)) streets.set(k, street);
      }
      if (p.subCategory) {
        const sub = clean(p.subCategory);
        if (sub && !looksLikeNoise(sub)) {
          const k = sub.toLowerCase();
          if (!categories.has(k)) categories.set(k, sub);
        }
      }
    }

    const cmp = (a, b) => a.localeCompare(b, undefined, { sensitivity: "base" });
    index = {
      streets: [...streets.values()].sort(cmp),
      places: [...placeNames.values()].sort(cmp),
      categories: [...categories.values()].sort(cmp),
    };

    // If the input already has a value when data finishes loading, refresh.
    if (document.activeElement === inputEl && inputEl.value.trim().length >= MIN_QUERY_LENGTH) {
      updateSuggestions(inputEl.value);
    }
  }

  /**
   * Pull a clean street name out of a full address.
   *   - Drops anything after the first comma (city/province).
   *   - Strips a leading civic number (with optional letter or range suffix).
   *   - Rejects intersections and descriptive locations ("Corner of X and Y").
   *   - Expands common suffix abbreviations (St→Street, Ave→Avenue, …) so
   *     "Robson St" and "Robson Street" don't both surface as suggestions.
   * Returns "" when the result isn't a usable street name.
   */
  function extractStreet(address) {
    if (!address) return "";
    let head = String(address).split(",")[0].trim();
    // Strip stray leading punctuation (some upstream rows start with "- ").
    head = head.replace(/^[^A-Za-z0-9]+/, "").trim();
    // Strip leading civic number with optional letter or range suffix.
    head = head.replace(/^\d+[A-Za-z]?(?:[\-–]\d+[A-Za-z]?)?\s+/, "").trim();
    // Drop a trailing parenthetical ("Alberni Street (at Bute)" → "Alberni Street").
    head = head.replace(/\s*\(.*$/, "").trim();
    // Collapse runs of whitespace.
    head = head.replace(/\s+/g, " ");

    // Real street names start with a capital letter or a digit ("12th
    // Avenue"). Lowercase starts ("adjacent to play area") are descriptions.
    if (!/^[A-Z0-9]/.test(head)) return "";

    const lower = head.toLowerCase();
    if (/^(in|at|near|behind|beside|inside|outside|corner|opposite|across|under|on|adjacent)\b/.test(lower)) {
      return "";
    }
    // Skip intersections — the user can find those via either street alone.
    if (/\s(and|&)\s/i.test(head)) return "";

    // Reject orphan single-letter prefixes ("B Industrial Av") unless they're
    // a compass directional ("N Boundary Road").
    const firstWord = head.split(/\s+/)[0] || "";
    if (firstWord.length === 1 && !/^[NSEW]$/i.test(firstWord)) return "";

    head = head
      .replace(/\bSt\.?$/i, "Street")
      .replace(/\b(Ave|Av)\.?$/i, "Avenue")
      .replace(/\bBlvd\.?$/i, "Boulevard")
      .replace(/\bRd\.?$/i, "Road")
      .replace(/\bDr\.?$/i, "Drive")
      .replace(/\bHwy\.?$/i, "Highway")
      .replace(/\bPl\.?$/i, "Place")
      .replace(/\bCres\.?$/i, "Crescent");

    if (head.length < 3) return "";
    if (!/^[A-Za-z]/.test(head)) return "";
    if (head.split(/\s+/).length > 5) return "";
    return head;
  }

  /* ---------- search ---------- */

  function rankMatch(text, q) {
    const lower = text.toLowerCase();
    const i = lower.indexOf(q);
    if (i === -1) return -1;
    if (i === 0) return 0;                       // prefix match
    if (lower.charAt(i - 1) === " ") return 1;   // word-boundary match
    return 2;                                    // mid-token match
  }

  /** Returns matches in a list, ranked best-first (prefix > word-boundary > mid). */
  function rankedMatches(list, q) {
    const buckets = [[], [], []];
    for (const item of list) {
      const r = rankMatch(item, q);
      if (r === -1) continue;
      buckets[r].push(item);
    }
    return [...buckets[0], ...buckets[1], ...buckets[2]];
  }

  function pushMatches(out, seen, items, type, limit) {
    let added = 0;
    for (const item of items) {
      if (added >= limit) break;
      if (out.length >= MAX_SUGGESTIONS) break;
      const k = `${type}::${item.toLowerCase()}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ value: item, type });
      added++;
    }
  }

  function search(q) {
    const out = [];
    const seen = new Set();
    const streets = rankedMatches(index.streets, q);
    const places = rankedMatches(index.places, q);
    const categories = rankedMatches(index.categories, q);

    // Reserve a balanced mix first so each kind gets a fair share.
    pushMatches(out, seen, streets, "street", 4);
    pushMatches(out, seen, places, "place", 3);
    pushMatches(out, seen, categories, "category", 1);
    // Top up remaining slots from whichever list still has matches.
    pushMatches(out, seen, streets, "street", MAX_SUGGESTIONS);
    pushMatches(out, seen, places, "place", MAX_SUGGESTIONS);
    pushMatches(out, seen, categories, "category", MAX_SUGGESTIONS);
    return out;
  }

  /* ---------- rendering ---------- */

  const TYPE_LABEL = {
    street: "street",
    place: "place",
    category: "service",
  };

  // Inline SVGs (Lucide-style, 16x16) — kept tiny so they layer cleanly with the row text.
  const TYPE_ICON = {
    street:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 20l-5.4 1.8a1 1 0 0 1-1.3-1.3L4 15"/><path d="M15 4l5.4-1.8a1 1 0 0 1 1.3 1.3L20 9"/><path d="M4 15 15 4"/><path d="M9 20 20 9"/></svg>',
    place:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    category:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>',
  };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function highlight(text, q) {
    if (!q) return escapeHtml(text);
    const lower = text.toLowerCase();
    const i = lower.indexOf(q.toLowerCase());
    if (i === -1) return escapeHtml(text);
    const before = text.slice(0, i);
    const match = text.slice(i, i + q.length);
    const after = text.slice(i + q.length);
    return `${escapeHtml(before)}<mark>${escapeHtml(match)}</mark>${escapeHtml(after)}`;
  }

  function render() {
    listboxEl.innerHTML = "";
    if (suggestions.length === 0) {
      close();
      return;
    }
    const frag = document.createDocumentFragment();
    suggestions.forEach((s, i) => {
      const li = document.createElement("li");
      li.id = `search-suggestion-${i}`;
      li.className = `suggestion suggestion-${s.type}`;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      li.dataset.index = String(i);
      li.innerHTML = `
        <span class="suggestion-icon" aria-hidden="true">${TYPE_ICON[s.type]}</span>
        <span class="suggestion-text">${highlight(s.value, currentQuery)}</span>
        <span class="suggestion-type" aria-hidden="true">${TYPE_LABEL[s.type]}</span>
      `;
      frag.appendChild(li);
    });
    listboxEl.appendChild(frag);
    open();
    setActive(-1);
    announce(
      suggestions.length === 1
        ? "1 suggestion. Use up and down arrow keys to navigate, Enter to select."
        : `${suggestions.length} suggestions. Use up and down arrow keys to navigate, Enter to select.`
    );
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    listboxEl.hidden = false;
    inputEl.setAttribute("aria-expanded", "true");
  }

  function close() {
    if (!isOpen) {
      // Always ensure DOM stays consistent.
      listboxEl.hidden = true;
      inputEl.setAttribute("aria-expanded", "false");
      inputEl.removeAttribute("aria-activedescendant");
      return;
    }
    isOpen = false;
    listboxEl.hidden = true;
    inputEl.setAttribute("aria-expanded", "false");
    inputEl.removeAttribute("aria-activedescendant");
    activeIdx = -1;
  }

  function setActive(idx) {
    const items = listboxEl.querySelectorAll(".suggestion");
    items.forEach((el) => {
      el.classList.remove("is-active");
      el.setAttribute("aria-selected", "false");
    });
    activeIdx = idx;
    if (idx < 0 || idx >= items.length) {
      inputEl.removeAttribute("aria-activedescendant");
      return;
    }
    const el = items[idx];
    el.classList.add("is-active");
    el.setAttribute("aria-selected", "true");
    inputEl.setAttribute("aria-activedescendant", el.id);
    // Keep the active row visible inside the dropdown.
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < listboxEl.scrollTop) listboxEl.scrollTop = top;
    else if (bottom > listboxEl.scrollTop + listboxEl.clientHeight) {
      listboxEl.scrollTop = bottom - listboxEl.clientHeight;
    }
  }

  function announce(msg) {
    if (!statusEl) return;
    // Toggle text so screen readers re-announce identical messages.
    statusEl.textContent = "";
    setTimeout(() => { statusEl.textContent = msg; }, 30);
  }

  /* ---------- selection ---------- */

  function selectSuggestion(idx) {
    if (idx < 0 || idx >= suggestions.length) return;
    const s = suggestions[idx];
    inputEl.value = s.value;
    // Tell AmenityFilters about the change.
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    close();
    inputEl.focus();
    applyAfterSelect();
  }

  /**
   * Run after a search submission (suggestion picked or Enter pressed).
   * If the current neighbourhood filter excludes all results, fall back to
   * "All of Vancouver" so the senior actually sees the matches. Then pan
   * and zoom the map to fit those matches.
   */
  function applyAfterSelect() {
    const countEl = document.getElementById("result-count");
    const noMatches = /No places match/i.test(countEl?.textContent || "");
    const areaSelect = document.getElementById("area-select");
    if (noMatches && areaSelect && areaSelect.value !== "all") {
      areaSelect.value = "all";
      areaSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (window.AmenityMap && typeof window.AmenityMap.fitToVisible === "function") {
      window.AmenityMap.fitToVisible();
    }
  }

  /* ---------- event handlers ---------- */

  function updateSuggestions(rawValue) {
    const q = rawValue.trim();
    currentQuery = q;
    if (q.length < MIN_QUERY_LENGTH) {
      suggestions = [];
      close();
      return;
    }
    suggestions = search(q);
    render();
  }

  function onInput(e) {
    updateSuggestions(e.target.value);
  }

  function onFocus() {
    if (inputEl.value.trim().length >= MIN_QUERY_LENGTH) {
      updateSuggestions(inputEl.value);
    }
  }

  function onBlur() {
    // Defer so a click on a suggestion can run first.
    setTimeout(() => {
      if (document.activeElement !== inputEl && !listboxEl.contains(document.activeElement)) {
        close();
      }
    }, 80);
  }

  function onKeyDown(e) {
    const itemsCount = suggestions.length;
    switch (e.key) {
      case "ArrowDown":
        if (!isOpen && inputEl.value.trim().length >= MIN_QUERY_LENGTH) {
          updateSuggestions(inputEl.value);
        }
        if (itemsCount === 0) return;
        e.preventDefault();
        setActive((activeIdx + 1) % itemsCount);
        break;
      case "ArrowUp":
        if (itemsCount === 0) return;
        e.preventDefault();
        setActive(activeIdx <= 0 ? itemsCount - 1 : activeIdx - 1);
        break;
      case "Home":
        if (!isOpen || itemsCount === 0) return;
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        if (!isOpen || itemsCount === 0) return;
        e.preventDefault();
        setActive(itemsCount - 1);
        break;
      case "Enter":
        if (isOpen && activeIdx >= 0) {
          e.preventDefault();
          selectSuggestion(activeIdx);
        } else {
          // No active suggestion — submit the typed text as-is, dismiss
          // the dropdown, and zoom the map to whatever it now matches.
          close();
          if (inputEl.value.trim().length >= MIN_QUERY_LENGTH) {
            applyAfterSelect();
          }
        }
        break;
      case "Escape":
        if (isOpen) {
          e.preventDefault();
          close();
        }
        break;
      case "Tab":
        // Don't steal Tab. If a suggestion is highlighted, accept it on Tab too.
        if (isOpen && activeIdx >= 0) {
          selectSuggestion(activeIdx);
        } else {
          close();
        }
        break;
      default:
        break;
    }
  }

  function onListMouseDown(e) {
    const li = e.target.closest(".suggestion");
    if (!li) return;
    e.preventDefault(); // keep input focused
    const idx = Number(li.dataset.index);
    if (Number.isFinite(idx)) selectSuggestion(idx);
  }

  function onListMouseMove(e) {
    const li = e.target.closest(".suggestion");
    if (!li) return;
    const idx = Number(li.dataset.index);
    if (Number.isFinite(idx) && idx !== activeIdx) setActive(idx);
  }

  function onDocClick(e) {
    if (!isOpen) return;
    if (e.target === inputEl) return;
    if (listboxEl.contains(e.target)) return;
    close();
  }

  return { init, setPlaces };
})();
