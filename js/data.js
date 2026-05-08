/**
 * Data loading for the WESN Vancouver Amenities Map.
 *
 * Fetches GeoJSON from the City of Vancouver Open Data Portal, normalizes
 * each feature into a common `Place` shape, and falls back to a bundled
 * CSV snapshot if the network is unavailable.
 *
 * Place shape:
 *   {
 *     id: string,           // stable identifier
 *     name: string,         // display name
 *     groupId: string,      // matches AmenityCategories group id
 *     subCategory: string,  // raw sub-category from the source
 *     address: string,
 *     area: string,         // City of Vancouver "Local Area" (or "")
 *     lat: number,
 *     lng: number,
 *   }
 */
window.AmenityData = (function () {
  const API_BASE = "https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets";
  const CSV_FALLBACK = "data/storefronts-vancouver-2025.csv";
  const CURRENT_YEAR = 2025;

  /** Build the GeoJSON export URL for a given dataset slug. */
  function geojsonUrl(slug, where) {
    let url = `${API_BASE}/${encodeURIComponent(slug)}/exports/geojson?lang=en&timezone=America%2FLos_Angeles`;
    if (where) url += `&where=${encodeURIComponent(where)}`;
    return url;
  }

  /** Fetch JSON with a clear error message on failure. */
  async function fetchJson(url) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status} ${res.statusText} — ${url}`);
    }
    return res.json();
  }

  /** Pull lat/lng out of a GeoJSON feature, ignoring features with no point. */
  function pointOf(feature) {
    const g = feature.geometry;
    if (!g) return null;
    if (g.type === "Point") return { lat: g.coordinates[1], lng: g.coordinates[0] };
    // For polygons (parks etc.), use the first coordinate as a representative point.
    if (g.type === "Polygon") {
      const ring = g.coordinates[0];
      if (!ring?.length) return null;
      const [lng, lat] = ring[0];
      return { lat, lng };
    }
    if (g.type === "MultiPolygon") {
      const ring = g.coordinates[0]?.[0];
      if (!ring?.length) return null;
      const [lng, lat] = ring[0];
      return { lat, lng };
    }
    return null;
  }

  /* ---------- Storefronts ---------- */

  async function loadStorefronts() {
    const url = geojsonUrl(
      "storefronts-inventory",
      `year_recorded=${CURRENT_YEAR}`
    );
    const fc = await fetchJson(url);
    return (fc.features || [])
      .map(featureToStorefrontPlace)
      .filter(Boolean);
  }

  function featureToStorefrontPlace(feature) {
    const p = feature.properties || {};
    const groupId = window.AmenityCategories.classifyStorefront(p);
    if (!groupId) return null;
    const pt = pointOf(feature);
    if (!pt) return null;
    return {
      id: `sf-${p.id_year || p.objectid || `${p.civic_number || ""}-${p.street || ""}`}`,
      name: p.business_name || p.business_n || "(Unnamed business)",
      groupId,
      subCategory: p.sub_category || "",
      address: p.address || `${p.civic_number || ""} ${p.street || ""}`.trim(),
      area: p.local_area || "",
      lat: pt.lat,
      lng: pt.lng,
    };
  }

  /* ---------- Community Centres ---------- */

  async function loadCommunityCentres() {
    const fc = await fetchJson(geojsonUrl("community-centres"));
    return (fc.features || [])
      .map((f) => {
        const p = f.properties || {};
        const pt = pointOf(f);
        if (!pt) return null;
        return {
          id: `cc-${p.mapid || p.name}`,
          name: p.name || "Community Centre",
          groupId: "community-centres",
          subCategory: "Community Centre",
          address: p.address || "",
          area: p.geo_local_area || p.local_area || "",
          lat: pt.lat,
          lng: pt.lng,
        };
      })
      .filter(Boolean);
  }

  /* ---------- Libraries ---------- */

  async function loadLibraries() {
    const fc = await fetchJson(geojsonUrl("libraries"));
    return (fc.features || [])
      .map((f) => {
        const p = f.properties || {};
        const pt = pointOf(f);
        if (!pt) return null;
        return {
          id: `lib-${p.name}`,
          name: p.name || "Public Library",
          groupId: "libraries",
          subCategory: "Library",
          address: p.address || "",
          area: p.geo_local_area || "",
          lat: pt.lat,
          lng: pt.lng,
        };
      })
      .filter(Boolean);
  }

  /* ---------- Public Washrooms ---------- */

  async function loadWashrooms() {
    const fc = await fetchJson(geojsonUrl("public-washrooms"));
    return (fc.features || [])
      .map((f) => {
        const p = f.properties || {};
        const pt = pointOf(f);
        if (!pt) return null;
        return {
          id: `wr-${p.name || p.location || pt.lat + ":" + pt.lng}`,
          name: p.name || p.location || "Public Washroom",
          groupId: "washrooms",
          subCategory: "Public Washroom",
          address: p.address || p.location || "",
          area: p.geo_local_area || "",
          lat: pt.lat,
          lng: pt.lng,
        };
      })
      .filter(Boolean);
  }

  /* ---------- Parks ---------- */

  async function loadParks() {
    // Parks are polygons; use their representative point.
    const fc = await fetchJson(geojsonUrl("parks-polygon-representation"));
    return (fc.features || [])
      .map((f) => {
        const p = f.properties || {};
        const pt = pointOf(f);
        if (!pt) return null;
        return {
          id: `park-${p.park_id || p.name}`,
          name: p.name || "Park",
          groupId: "parks",
          subCategory: "Park",
          address: p.streetnumber
            ? `${p.streetnumber} ${p.streetname || ""}`.trim()
            : p.streetname || "",
          area: p.neighbourhoodname || "",
          lat: pt.lat,
          lng: pt.lng,
        };
      })
      .filter(Boolean);
  }

  /* ---------- CSV fallback ---------- */

  /**
   * Minimal RFC 4180-ish CSV parser. Handles quoted fields with commas and
   * embedded quotes. The Vancouver storefronts CSV uses CRLF line endings;
   * we normalize to LF.
   */
  function parseCsv(text) {
    const rows = [];
    const src = text.replace(/\r\n/g, "\n");
    let i = 0;
    let field = "";
    let row = [];
    let inQuotes = false;
    while (i < src.length) {
      const c = src[i];
      if (inQuotes) {
        if (c === '"' && src[i + 1] === '"') { field += '"'; i += 2; continue; }
        if (c === '"') { inQuotes = false; i++; continue; }
        field += c; i++; continue;
      }
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ",") { row.push(field); field = ""; i++; continue; }
      if (c === "\n") {
        row.push(field); field = "";
        rows.push(row); row = [];
        i++; continue;
      }
      field += c; i++;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  /**
   * Parse the bundled CSV. The CSV has no coordinates, so we cannot place
   * pins on the map without additional geocoding. We still surface the
   * records so search/filter works in offline-degraded mode (with a warning).
   */
  async function loadStorefrontsFromCsv() {
    const res = await fetch(CSV_FALLBACK);
    if (!res.ok) throw new Error("CSV fallback unavailable");
    const text = await res.text();
    const rows = parseCsv(text);
    if (!rows.length) return [];
    const header = rows[0].map((h) => h.trim());
    const idx = (name) => header.indexOf(name);
    const out = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length < header.length / 2) continue;
      const props = {
        id_year: r[idx("ID_Year")],
        business_n: r[idx("Business_N")],
        business_name: r[idx("Business_N")],
        sub_category: r[idx("Sub_Category")],
        sub_category1: r[idx("Sub_Category1")],
        local_area: r[idx("Local_Area")],
        address: r[idx("Address")],
        civic_number: r[idx("Civic_Numb")],
        street: r[idx("Street")],
      };
      const groupId = window.AmenityCategories.classifyStorefront(props);
      if (!groupId) continue;
      out.push({
        id: `sf-csv-${props.id_year}`,
        name: props.business_name,
        groupId,
        subCategory: props.sub_category,
        address: props.address,
        area: props.local_area,
        lat: NaN,
        lng: NaN,
        offline: true,
      });
    }
    return out;
  }

  /* ---------- Orchestration ---------- */

  /**
   * Load all amenity sources concurrently.
   * Each source is allowed to fail independently — we log the failure and
   * continue with whatever we got. Returns { places, errors }.
   */
  async function loadAll() {
    const sources = [
      { name: "Storefronts", fn: loadStorefronts },
      { name: "Community Centres", fn: loadCommunityCentres },
      { name: "Libraries", fn: loadLibraries },
      { name: "Public Washrooms", fn: loadWashrooms },
      { name: "Parks", fn: loadParks },
    ];

    const settled = await Promise.allSettled(sources.map((s) => s.fn()));
    const places = [];
    const errors = [];

    settled.forEach((result, i) => {
      const source = sources[i];
      if (result.status === "fulfilled") {
        places.push(...result.value);
      } else {
        console.warn(`[AmenityData] ${source.name} failed:`, result.reason);
        errors.push({ source: source.name, message: String(result.reason) });
      }
    });

    // If storefronts failed (the bulk of the data), try CSV fallback.
    const storefrontsFailed = errors.some((e) => e.source === "Storefronts");
    if (storefrontsFailed) {
      try {
        const fallback = await loadStorefrontsFromCsv();
        places.push(...fallback);
        errors.push({
          source: "Storefronts",
          message: "Live data unavailable — using offline CSV (no map pins).",
          recovered: true,
        });
      } catch (e) {
        console.warn("[AmenityData] CSV fallback failed:", e);
      }
    }

    return { places, errors };
  }

  return { loadAll };
})();
