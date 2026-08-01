# Graph Report - .  (2026-05-08)

## Corpus Check
- Corpus is ~4,872 words - fits in a single context window. You may not need a graph.

## Summary
- 91 nodes · 155 edges · 11 communities detected
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_App Shell & DOM|App Shell & DOM]]
- [[_COMMUNITY_Data Loading & Classification|Data Loading & Classification]]
- [[_COMMUNITY_Data Sources & Datasets|Data Sources & Datasets]]
- [[_COMMUNITY_Filter & Search Logic|Filter & Search Logic]]
- [[_COMMUNITY_Leaflet Map Rendering|Leaflet Map Rendering]]
- [[_COMMUNITY_WESN Brand Identity|WESN Brand Identity]]
- [[_COMMUNITY_App Bootstrap & UI|App Bootstrap & UI]]
- [[_COMMUNITY_Data Refresh Script|Data Refresh Script]]
- [[_COMMUNITY_Accessibility Features|Accessibility Features]]
- [[_COMMUNITY_Place Detail Dialog|Place Detail Dialog]]
- [[_COMMUNITY_About Section|About Section]]

## God Nodes (most connected - your core abstractions)
1. `Vancouver Amenities Map (index.html)` - 13 edges
2. `js/data.js` - 9 edges
3. `geojsonUrl()` - 7 edges
4. `fetchJson()` - 7 edges
5. `GeoJSON export endpoint pattern` - 7 edges
6. `js/filters.js` - 6 edges
7. `loadStorefrontsFromCsv()` - 5 edges
8. `emit()` - 5 edges
9. `js/app.js` - 5 edges
10. `Data sources documentation` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Pattern: extend categories via groups + sources + loader` --rationale_for--> `js/data.js`  [EXTRACTED]
  README.md → index.html
- `featureToStorefrontPlace()` --calls--> `classifyStorefront()`  [INFERRED]
  js/data.js → js/categories.js
- `loadStorefrontsFromCsv()` --calls--> `classifyStorefront()`  [INFERRED]
  js/data.js → js/categories.js
- `West End Seniors' Network (WESN)` --conceptually_related_to--> `Vancouver Amenities Map (index.html)`  [EXTRACTED]
  README.md → index.html
- `Vancouver Amenities Map (index.html)` --references--> `City of Vancouver Open Data Portal`  [EXTRACTED]
  index.html → README.md

## Hyperedges (group relationships)
- **App.js wires categories, data, map, and filters** — index_html_app_js, index_html_categories_js, index_html_data_js, index_html_map_js, index_html_filters_js [EXTRACTED 0.95]
- **Vancouver Open Data → GeoJSON endpoint → data.js loaders** — city_vancouver_open_data, geojson_export_endpoint, index_html_data_js, dataset_storefronts_inventory [EXTRACTED 0.90]
- **Offline fallback: fetch-data.mjs → CSV snapshot → no-coordinates constraint** — readme_fetch_data_script, csv_schema_storefronts, csv_no_coordinates_constraint, readme_offline_fallback [EXTRACTED 0.90]

## Communities

### Community 0 - "App Shell & DOM"
Cohesion: 0.15
Nodes (18): js/app.js, Neighbourhood select (#area-select), js/categories.js, Category list (#category-list), js/filters.js, Leaflet CSS (CDN), Leaflet JS (CDN), Map container (#map) (+10 more)

### Community 1 - "Data Loading & Classification"
Cohesion: 0.3
Nodes (13): classifyStorefront(), featureToStorefrontPlace(), fetchJson(), geojsonUrl(), loadAll(), loadCommunityCentres(), loadLibraries(), loadParks() (+5 more)

### Community 2 - "Data Sources & Datasets"
Cohesion: 0.24
Nodes (14): City of Vancouver Open Data Portal, CSV lacks coordinates — no map pins offline, CSV schema (Storefronts inventory columns), Data sources documentation, Dataset: community-centres, Dataset: libraries, Dataset: parks-polygon-representation, Dataset: public-washrooms (+6 more)

### Community 3 - "Filter & Search Logic"
Cohesion: 0.47
Nodes (8): emit(), init(), onChangeFn(), renderCategories(), restoreState(), saveState(), syncCheckboxes(), visiblePlaces()

### Community 4 - "Leaflet Map Rendering"
Cohesion: 0.47
Nodes (7): buildMarkerIcon(), escapeHtml(), fitToVisible(), init(), popupHtml(), setGroupVisible(), setPlaces()

### Community 5 - "WESN Brand Identity"
Cohesion: 0.33
Nodes (9): WESN Acronym, WESN Brand Identity, Three Circling Human Figures Mark, Yellow-Green-Blue Color Palette, Community and Connection, WESN Logo, West End Seniors' Network, Seniors Services (+1 more)

### Community 6 - "App Bootstrap & UI"
Cohesion: 0.57
Nodes (5): setStatus(), setupSidebarDrawer(), setupTextSizeToggle(), updateResultCount(), updateToggleBadge()

### Community 7 - "Data Refresh Script"
Cohesion: 0.67
Nodes (1): main()

### Community 8 - "Accessibility Features"
Cohesion: 1.0
Nodes (2): Text-size toggle (#text-size-toggle), Accessibility design (senior-friendly, WCAG AA)

### Community 9 - "Place Detail Dialog"
Cohesion: 1.0
Nodes (1): Place detail dialog (#place-detail)

### Community 10 - "About Section"
Cohesion: 1.0
Nodes (1): About section

## Knowledge Gaps
- **16 isolated node(s):** `Leaflet CSS (CDN)`, `css/styles.css`, `Sidebar (filters & search)`, `Map container (#map)`, `Place detail dialog (#place-detail)` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Data Refresh Script`** (3 nodes): `fetch-data.mjs`, `main()`, `fetch-data.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Accessibility Features`** (2 nodes): `Text-size toggle (#text-size-toggle)`, `Accessibility design (senior-friendly, WCAG AA)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Place Detail Dialog`** (1 nodes): `Place detail dialog (#place-detail)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `About Section`** (1 nodes): `About section`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Vancouver Amenities Map (index.html)` connect `App Shell & DOM` to `Data Sources & Datasets`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `js/data.js` connect `Data Sources & Datasets` to `App Shell & DOM`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `js/data.js` (e.g. with `js/app.js` and `City of Vancouver Open Data Portal`) actually correct?**
  _`js/data.js` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Leaflet CSS (CDN)`, `css/styles.css`, `Sidebar (filters & search)` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._