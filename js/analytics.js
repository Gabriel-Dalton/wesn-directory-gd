/**
 * Accessibility Analytics for the WESN Vancouver Amenities Map.
 *
 * Answers the question seniors and planners actually care about: "how easy is
 * it to reach an essential service from where people already are?" — a light
 * network-analysis / accessibility layer.
 *
 * The analysis treats every mapped amenity as a sample point ("demand") and,
 * for a chosen service (default: Groceries), measures how many of those points
 * fall within a comfortable walk of the nearest service location. Results are
 * reported citywide and broken down by neighbourhood, and can be visualised on
 * the map as service "coverage areas" (walk-radius catchments).
 *
 * Distances are straight-line (haversine) walking estimates — a deliberate,
 * clearly-labelled approximation: a true road-network isochrone needs a
 * routing engine and isn't feasible in a static, no-backend site. Straight-line
 * distance is a well-understood proxy for relative walkability between areas.
 */
window.AmenityAnalytics = (function () {
  // Average comfortable senior walking pace ≈ 80 m/min, so 5/10/15-minute
  // walks map to the radii below. These match the <select> in index.html.
  const DEFAULT_METRES = 800;
  // Drawing a catchment circle per location is cheap, but a category with
  // thousands of points (e.g. all retail) would flood the map; cap it.
  const MAX_CATCHMENT_CIRCLES = 800;

  let allPlaces = [];
  let map = null;
  let catchmentLayer = null;

  let serviceSelect, walkSelect, catchmentToggle, output, body, toggleBtn;

  function init() {
    const panel = document.getElementById("analytics-panel");
    if (!panel) return;

    toggleBtn = document.getElementById("analytics-toggle");
    body = document.getElementById("analytics-body");
    serviceSelect = document.getElementById("analytics-service");
    walkSelect = document.getElementById("analytics-walk");
    catchmentToggle = document.getElementById("analytics-catchment");
    output = document.getElementById("analytics-output");

    // Drop-down disclosure for the whole panel (mirrors the category menus).
    if (toggleBtn && body) {
      toggleBtn.addEventListener("click", () => {
        const collapsed = panel.classList.toggle("is-collapsed");
        toggleBtn.setAttribute("aria-expanded", String(!collapsed));
        body.hidden = collapsed;
        // Recompute on first open so the map sizing/overlays settle correctly.
        if (!collapsed) recompute();
      });
    }

    if (serviceSelect) serviceSelect.addEventListener("change", recompute);
    if (walkSelect) walkSelect.addEventListener("change", recompute);
    if (catchmentToggle) catchmentToggle.addEventListener("change", recompute);
  }

  /** Receive the loaded places and (re)populate the service picker. */
  function setPlaces(places) {
    allPlaces = (places || []).filter(
      (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
    );
    populateServiceSelect();
    recompute();
  }

  /** List every category that actually has locations, default to Groceries. */
  function populateServiceSelect() {
    if (!serviceSelect) return;
    const counts = new Map();
    for (const p of allPlaces) counts.set(p.groupId, (counts.get(p.groupId) || 0) + 1);

    const prev = serviceSelect.value;
    serviceSelect.innerHTML = "";
    for (const group of window.AmenityCategories.groups) {
      const n = counts.get(group.id) || 0;
      if (n === 0) continue;
      const opt = document.createElement("option");
      opt.value = group.id;
      opt.textContent = `${group.label} (${n.toLocaleString()})`;
      serviceSelect.appendChild(opt);
    }
    // Keep a prior choice if still valid, else default to Groceries.
    if (prev && counts.get(prev)) serviceSelect.value = prev;
    else if (counts.get("groceries")) serviceSelect.value = "groceries";
  }

  /* ---------- Geometry ---------- */

  function haversineMetres(aLat, aLng, bLat, bLng) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const lat1 = toRad(aLat);
    const lat2 = toRad(bLat);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  /** Nearest distance (m) from a point to any target location. */
  function nearestDistance(lat, lng, targets) {
    let best = Infinity;
    for (const t of targets) {
      const d = haversineMetres(lat, lng, t.lat, t.lng);
      if (d < best) best = d;
    }
    return best;
  }

  /* ---------- Analysis ---------- */

  function recompute() {
    if (!output) return;
    if (allPlaces.length === 0) {
      output.innerHTML = `<p class="analytics-empty">Loading data…</p>`;
      return;
    }

    const groupId = serviceSelect ? serviceSelect.value : "groceries";
    const group = window.AmenityCategories.byId[groupId];
    const radius = walkSelect ? Number(walkSelect.value) || DEFAULT_METRES : DEFAULT_METRES;

    const targets = allPlaces.filter((p) => p.groupId === groupId);
    if (targets.length === 0) {
      output.innerHTML = `<p class="analytics-empty">No locations available for this service.</p>`;
      drawCatchments([], radius, group);
      return;
    }

    // "Demand" points: every other mapped amenity (i.e. the places people go).
    const demand = allPlaces.filter((p) => p.groupId !== groupId);
    const sample = demand.length ? demand : allPlaces;

    let within = 0;
    let distSum = 0;
    const byArea = new Map(); // area -> { total, within, distSum }

    for (const p of sample) {
      const d = nearestDistance(p.lat, p.lng, targets);
      distSum += d;
      const ok = d <= radius;
      if (ok) within += 1;
      const area = p.area || "Other areas";
      const rec = byArea.get(area) || { total: 0, within: 0, distSum: 0 };
      rec.total += 1;
      rec.distSum += d;
      if (ok) rec.within += 1;
      byArea.set(area, rec);
    }

    const coverage = Math.round((within / sample.length) * 100);
    const avgWalk = Math.round(distSum / sample.length);

    renderStats({ group, radius, targets, sample, coverage, avgWalk, byArea });
    drawCatchments(targets, radius, group);
  }

  function walkMinutes(metres) {
    return Math.max(1, Math.round(metres / 80));
  }

  function fmtDistance(m) {
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  }

  function renderStats({ group, radius, targets, sample, coverage, avgWalk, byArea }) {
    const mins = walkMinutes(radius);
    const label = group ? group.label.toLowerCase() : "this service";

    // Neighbourhood rows sorted by accessibility (best coverage first).
    const rows = [...byArea.entries()]
      .map(([area, r]) => ({
        area,
        pct: Math.round((r.within / r.total) * 100),
        avg: Math.round(r.distSum / r.total),
        total: r.total,
      }))
      .filter((r) => r.total >= 5) // ignore noise from tiny areas
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 8);

    const rowsHtml = rows
      .map(
        (r) => `
        <li class="analytics-bar-row">
          <span class="analytics-bar-label">${escapeHtml(r.area)}</span>
          <span class="analytics-bar-track">
            <span class="analytics-bar-fill" style="width:${r.pct}%;background:${group ? group.color : "#0e7287"}"></span>
          </span>
          <span class="analytics-bar-val">${r.pct}%</span>
        </li>`
      )
      .join("");

    output.innerHTML = `
      <div class="analytics-headline">
        <span class="analytics-big" style="color:${group ? group.color : "#0e7287"}">${coverage}%</span>
        <span class="analytics-big-cap">of mapped places are within a
          ${mins}-minute walk of ${escapeHtml(label)}</span>
      </div>
      <ul class="analytics-stats">
        <li><strong>${targets.length.toLocaleString()}</strong> ${escapeHtml(label)} locations</li>
        <li><strong>${fmtDistance(avgWalk)}</strong> average walk to the nearest one</li>
        <li>based on <strong>${sample.length.toLocaleString()}</strong> sample points across the city</li>
      </ul>
      ${
        rows.length
          ? `<h4 class="analytics-subhead">Accessibility by neighbourhood</h4>
             <ul class="analytics-bars">${rowsHtml}</ul>
             <p class="analytics-note">Share of nearby places within a ${mins}-minute
                (${fmtDistance(radius)}) walk. Straight-line estimate.</p>`
          : `<p class="analytics-note">Straight-line walking estimate.</p>`
      }
    `;
  }

  /* ---------- Map coverage layer ---------- */

  function drawCatchments(targets, radius, group) {
    if (!map) map = window.AmenityMap && window.AmenityMap.getMap();
    if (!map) return;

    if (catchmentLayer) {
      map.removeLayer(catchmentLayer);
      catchmentLayer = null;
    }
    if (!catchmentToggle || !catchmentToggle.checked) return;

    if (targets.length > MAX_CATCHMENT_CIRCLES) {
      // Too many to draw legibly — tell the user instead of freezing the map.
      const note = output && output.querySelector(".analytics-note");
      if (note) {
        note.textContent =
          `Too many locations (${targets.length.toLocaleString()}) to show coverage areas — pick a more specific service.`;
      }
      return;
    }

    const color = group ? group.color : "#0e7287";
    const circles = targets.map((t) =>
      L.circle([t.lat, t.lng], {
        radius,
        color,
        weight: 1,
        opacity: 0.35,
        fillColor: color,
        fillOpacity: 0.08,
        interactive: false,
      })
    );
    catchmentLayer = L.layerGroup(circles).addTo(map);
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  return { init, setPlaces };
})();
