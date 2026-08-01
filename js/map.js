/**
 * Leaflet map module for the WESN Vancouver Amenities Map.
 *
 * Responsibilities:
 *   - Initialize the Leaflet instance over Vancouver.
 *   - Render markers for a list of Place objects, grouped by category for
 *     fast show/hide.
 *   - Build informative popups that include directions links.
 *
 * ## Background map (basemap)
 *
 * The map renders immediately on a clean, Google-Maps-style raster basemap
 * (CARTO "Voyager") so it works with no API key. If a Google Maps Platform
 * key is supplied in `window.WESN_CONFIG.googleMapsApiKey`, the module loads
 * the Google Maps JavaScript API + the Leaflet.GoogleMutant plugin and
 * swaps in the *real* Google Maps tiles — giving the familiar Google look
 * seniors recognize. No key means it transparently keeps the Google-style
 * fallback; an invalid key logs a warning and keeps the fallback too.
 */
window.AmenityMap = (function () {
  // West End / Downtown Vancouver — close to WESN's catchment.
  const DEFAULT_CENTER = [49.286, -123.135];
  const DEFAULT_ZOOM = 14;

  // Google-Maps-style fallback basemap (clean, low-clutter, familiar look).
  const STYLE_TILE_URL =
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  const STYLE_TILE_ATTR =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
  const GOOGLEMUTANT_URL =
    "https://unpkg.com/leaflet.gridlayer.googlemutant@0.14.1/dist/Leaflet.GoogleMutant.js";

  let map;
  let baseLayer = null;
  /** Map<groupId, L.LayerGroup> */
  const layerByGroup = new Map();

  function init(elementId) {
    map = L.map(elementId, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      preferCanvas: false,
    });

    setupBasemap();

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

  /**
   * Add the background map. Always starts on the Google-Maps-style raster
   * fallback so something renders instantly; upgrades to real Google Maps
   * tiles asynchronously if a key is configured.
   */
  function setupBasemap() {
    baseLayer = L.tileLayer(STYLE_TILE_URL, {
      attribution: STYLE_TILE_ATTR,
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    const key = (window.WESN_CONFIG || {}).googleMapsApiKey;
    if (!key) return;

    loadGoogleBasemap(key)
      .then((googleLayer) => {
        if (!googleLayer) return;
        googleLayer.addTo(map);
        // Drop the fallback once Google tiles are live.
        if (baseLayer && map.hasLayer(baseLayer)) map.removeLayer(baseLayer);
        baseLayer = googleLayer;
      })
      .catch((err) => {
        console.warn(
          "[AmenityMap] Google Maps unavailable — keeping Google-style fallback basemap.",
          err
        );
      });
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });
  }

  /** Load the Google Maps JS API + GoogleMutant plugin and build the layer. */
  async function loadGoogleBasemap(key) {
    if (!(window.google && window.google.maps)) {
      await loadScript(
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=quarterly`
      );
    }
    if (!(L.gridLayer && L.gridLayer.googleMutant)) {
      await loadScript(GOOGLEMUTANT_URL);
    }
    if (L.gridLayer && typeof L.gridLayer.googleMutant === "function") {
      return L.gridLayer.googleMutant({ type: "roadmap", maxZoom: 21 });
    }
    return null;
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
    // Prefer the canonical Amenity from the WESN taxonomy when it's more
    // specific than the sidebar group label; fall back to the raw API
    // sub_category. (e.g. group "Bakeries & Cafés" → amenity "Bakery & Cafe".)
    const specific = place.amenity || place.subCategory;
    const subLabel = specific && specific !== group.label
      ? ` &middot; ${escapeHtml(specific)}`
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

  function invalidateSize() {
    if (map && typeof map.invalidateSize === "function") map.invalidateSize();
  }

  /** Expose the underlying Leaflet map so overlays (e.g. analytics) can attach. */
  function getMap() {
    return map;
  }

  return { init, setPlaces, setGroupVisible, fitToVisible, invalidateSize, getMap };
})();
