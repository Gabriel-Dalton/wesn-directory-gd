# Vancouver Amenities Map · WESN

A senior-friendly map of community amenities across Vancouver — clinics,
pharmacies, dentists, banks, grocery stores, libraries, community centres,
public washrooms, parks, and more.

Built for the [West End Seniors' Network](https://www.wesn.ca/).

![Sidebar with category filters next to a Leaflet map of downtown Vancouver](./docs/screenshot-placeholder.png)

## What it does

- Shows amenities on an interactive map of Vancouver, centred on the West End.
- Lets users filter by category, search by name/address, and narrow by
  neighbourhood (West End, Downtown, Kitsilano, etc.).
- Each marker pops up with the place name, address, and a "Get directions"
  link that opens Google Maps.
- Categories are grouped into collapsible **drop-down menus** (Domain →
  Subdomain → category) so the sidebar stays tidy.
- An **Accessibility Analytics** panel measures how easy it is to reach an
  essential service (e.g. grocery stores) across the city, with a
  neighbourhood breakdown and optional coverage-area overlay on the map.
- Renders on a clean, **Google-Maps-style background map** out of the box, and
  can switch to the real Google Maps tiles with an API key (see below).
- Includes a text-size toggle and high-contrast styling for low-vision users.
- Works on phones, tablets, and desktops.

## How it works

This is a static site — no server, no build step, no framework.

```
index.html        ← page shell
css/styles.css    ← senior-friendly styling
js/taxonomy.js    ← Domain / Subdomain / Amenity hierarchy + alias tables
js/classify.js    ← auto-classifier: API record → { domain, subdomain, amenity }
js/categories.js  ← sidebar groupings (Clinics, Pharmacies, Libraries…)
js/data.js        ← fetches GeoJSON from City of Vancouver Open Data
js/map.js         ← Leaflet map + custom markers + Google-Maps basemap
js/filters.js     ← sidebar filter logic (drop-down category menus)
js/analytics.js   ← accessibility analytics (coverage to a chosen service)
js/app.js         ← wires the modules together
data/             ← offline-degraded CSV fallback
scripts/          ← node script to refresh the CSV
```

Data is fetched at page load from the
[City of Vancouver Open Data Portal](https://opendata.vancouver.ca/) — see
[`data/README.md`](./data/README.md) for the list of datasets.
If the portal is unreachable, the page falls back to the bundled CSV
(records visible in lists, but no map pins, since the CSV has no coordinates).

## Running locally

Any static server works. From the project root:

```sh
# Python
python3 -m http.server 8000

# or Node
npx serve .
```

Then open <http://localhost:8000>.

> Don't open `index.html` directly via `file://` — browsers block
> `fetch()` to local files in that mode, so the CSV fallback won't load.

## Deploying to a subdomain

The whole project is static files, so any static host works:

- **Netlify / Vercel / Cloudflare Pages**: connect this repo, no build
  command, publish directory `/`.
- **GitHub Pages**: enable Pages on this repo (root, default branch).
- **Existing web host**: upload the contents of this folder to the document
  root of the subdomain (e.g. `map.wesn.ca`).

No environment variables, no secrets.

## Background map (Google Maps)

The map ships with a clean, Google-Maps-style raster basemap (CARTO "Voyager")
so it looks familiar and works with **no API key or setup**.

To render the *real* Google Maps tiles instead, paste a
[Google Maps Platform](https://developers.google.com/maps) API key (with
billing enabled) into the one config line near the top of `index.html`:

```html
<script>
  window.WESN_CONFIG = {
    googleMapsApiKey: "YOUR_KEY_HERE",
  };
</script>
```

When a key is present, `js/map.js` loads the Google Maps JavaScript API and the
[Leaflet.GoogleMutant](https://github.com/Leaflet/Leaflet.GoogleMutant) plugin
and swaps Google's tiles in. If the key is missing or invalid, it silently keeps
the Google-style fallback — the map always works.

> Without billing enabled, Google overlays a "for development purposes only"
> watermark, so set up billing before going live.

## Accessibility Analytics

The **Accessibility analytics** drop-down in the sidebar answers "how easy is it
to reach an essential service?" Pick a service (default: grocery stores) and a
comfortable walking distance, and it reports the share of mapped places within
that walk, the average distance to the nearest one, and a per-neighbourhood
breakdown. Tick "Show coverage areas" to draw each location's walk-radius
catchment on the map. Distances are straight-line walking estimates (a
deliberate, labelled approximation — a true road-network isochrone would need a
routing backend this static site doesn't have).

## Refreshing data

The map fetches live data on each visit, so most of the time there's nothing
to refresh. To update the offline CSV fallback to the latest snapshot:

```sh
node scripts/fetch-data.mjs
```

(Requires Node 18+.)

## Adding more categories

The amenity taxonomy lives in [`js/taxonomy.js`](./js/taxonomy.js); the
sidebar groupings live in [`js/categories.js`](./js/categories.js). They
are decoupled on purpose — when the City of Vancouver renames a
`Sub_Category` on the portal, you only need to add a one-line alias in
`taxonomy.js` and every downstream consumer (filters, popups, search) picks
it up automatically.

1. **Add a new Amenity** (a leaf in the Domain → Subdomain → Amenity tree):
   append a row to `TRIPLES` in `taxonomy.js`. If the storefront API
   reports it under a different name, also add an entry to
   `SUB_CATEGORY_ALIASES`.
2. **Add a new sidebar grouping**: append an entry to `groups` in
   `categories.js`, listing the canonical `amenities` it should surface.
3. **Pull from a new Vancouver Open Data dataset**: register the slug in
   `DATASET_AMENITY` (`taxonomy.js`), then add a loader to
   [`js/data.js`](./js/data.js) following the `loadLibraries`/`loadParks`
   pattern. Each Place returned should call `applyTaxonomy(place, slug)`
   so it inherits the right `{ domain, subdomain, amenity }`.

## Accessibility

- Minimum body text 18px; user-toggleable to 20.25px.
- All interactive elements are keyboard reachable with visible focus.
- Colour contrast meets WCAG AA against the background.
- Touch targets ≥ 44×44 px.
- Respects `prefers-reduced-motion`.

## Credits

- Map data by [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors; default tiles by [CARTO](https://carto.com/attributions). Optional [Google Maps](https://developers.google.com/maps) tiles via [Leaflet.GoogleMutant](https://github.com/Leaflet/Leaflet.GoogleMutant).
- Map library: [Leaflet](https://leafletjs.com/).
- Data from the [City of Vancouver Open Data Portal](https://opendata.vancouver.ca/).
- Icons from [Lucide](https://lucide.dev/) (ISC licensed). Path data is
  inlined into [`js/categories.js`](./js/categories.js) and
  [`js/autocomplete.js`](./js/autocomplete.js); each entry is annotated
  with its source filename. To update an icon, copy the new inner markup
  from `https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/<name>.svg`.
