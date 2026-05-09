/**
 * Leaflet map module for the WESN Vancouver Amenities Map.
 *
 * Responsibilities:
 *   - Initialize the Leaflet instance over Vancouver.
 *   - Render markers for a list of Place objects, grouped by category for
 *     fast show/hide.
 *   - Build informative popups that include directions links.
 */
window.AmenityMap = (function () {
  // West End / Downtown Vancouver — close to WESN's catchment.
  const DEFAULT_CENTER = [49.286, -123.135];
  const DEFAULT_ZOOM = 14;

  let map;
  /** Map<groupId, L.LayerGroup> */
  const layerByGroup = new Map();

  function init(elementId) {
    map = L.map(elementId, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      preferCanvas: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Each category group gets its own marker-cluster layer so toggling
    // visibility is just addLayer/removeLayer, and dense areas auto-collapse
    // into readable cluster bubbles instead of an overwhelming pile of pins.
    const ClusterCtor = L.markerClusterGroup || L.layerGroup;
    for (const group of window.AmenityCategories.groups) {
      const layer = ClusterCtor === L.markerClusterGroup
        ? L.markerClusterGroup({
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            disableClusteringAtZoom: 17,
            maxClusterRadius: 60,
            iconCreateFunction: (cluster) =>
              buildClusterIcon(cluster.getChildCount(), group),
          })
        : L.layerGroup();
      layerByGroup.set(group.id, layer);
      layer.addTo(map);
    }

    return map;
  }

  function buildClusterIcon(count, group) {
    const color = group?.color || "#0e3b25";
    const size = count >= 100 ? 56 : count >= 25 ? 50 : 42;
    return L.divIcon({
      className: "amenity-cluster-wrap",
      html:
        `<div class="amenity-cluster" style="--cl-color:${color};width:${size}px;height:${size}px">` +
          `<span class="amenity-cluster-count">${count}</span>` +
        `</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  function buildMarkerIcon(group) {
    const color = group?.color || "#0b4c7a";
    const icon = group?.icon || "📍";
    return L.divIcon({
      className: "",
      html:
        `<div class="amenity-marker" style="background:${color}" ` +
        `aria-label="${group?.label || "Amenity"}">${icon}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    });
  }

  function popupHtml(place, group) {
    const directions = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
    const subLabel = place.subCategory && place.subCategory !== group.label
      ? ` &middot; ${escapeHtml(place.subCategory)}`
      : "";
    const areaLabel = place.area ? `<p class="popup-address">${escapeHtml(place.area)}</p>` : "";
    // group.icon is trusted SVG markup from categories.js — render as HTML.
    // The label and any user-supplied data goes through escapeHtml().
    return [
      `<p class="popup-name">${escapeHtml(place.name)}</p>`,
      `<p class="popup-category">${group.icon}<span>${escapeHtml(group.label)}${subLabel}</span></p>`,
      place.address ? `<p class="popup-address">${escapeHtml(place.address)}</p>` : "",
      areaLabel,
      `<a class="popup-link" href="${directions}" target="_blank" rel="noopener">Get directions</a>`,
    ].join("");
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Replace all displayed markers with the given list of places.
   * Visibility is then controlled separately via setGroupVisible().
   */
  function setPlaces(places) {
    // Clear all layers.
    for (const layer of layerByGroup.values()) layer.clearLayers();

    for (const place of places) {
      if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) continue;
      const group = window.AmenityCategories.byId[place.groupId];
      if (!group) continue;
      const marker = L.marker([place.lat, place.lng], {
        icon: buildMarkerIcon(group),
        title: place.name,
        alt: `${group.label}: ${place.name}`,
        riseOnHover: true,
      });
      marker.bindPopup(popupHtml(place, group), { maxWidth: 320 });
      marker.addTo(layerByGroup.get(group.id));
    }
  }

  function setGroupVisible(groupId, visible) {
    const layer = layerByGroup.get(groupId);
    if (!layer) return;
    if (visible) {
      if (!map.hasLayer(layer)) map.addLayer(layer);
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
  }

  /** Pan and zoom to the bounding box of currently visible markers. */
  function fitToVisible() {
    const points = [];
    for (const [groupId, layer] of layerByGroup.entries()) {
      if (!map.hasLayer(layer)) continue;
      layer.eachLayer((m) => points.push(m.getLatLng()));
    }
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }

  return { init, setPlaces, setGroupVisible, fitToVisible };
})();
