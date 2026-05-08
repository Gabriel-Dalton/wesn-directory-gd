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
- Includes a text-size toggle and high-contrast styling for low-vision users.
- Works on phones, tablets, and desktops.

## How it works

This is a static site — no server, no build step, no framework.

```
index.html        ← page shell
css/styles.css    ← senior-friendly styling
js/categories.js  ← category groupings (Clinics, Pharmacies, Libraries…)
js/data.js        ← fetches GeoJSON from City of Vancouver Open Data
js/map.js         ← Leaflet map + custom markers
js/filters.js     ← sidebar filter logic
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

## Refreshing data

The map fetches live data on each visit, so most of the time there's nothing
to refresh. To update the offline CSV fallback to the latest snapshot:

```sh
node scripts/fetch-data.mjs
```

(Requires Node 18+.)

## Adding more categories

Edit [`js/categories.js`](./js/categories.js):

1. To add a new senior-relevant grouping based on the existing storefront
   data, append a new entry to `groups` with a list of `subCategories` to
   include.
2. To pull from a new Vancouver Open Data dataset, add a `sources` entry
   referencing the dataset slug, then add a small loader in
   [`js/data.js`](./js/data.js) following the pattern of `loadLibraries`,
   `loadCommunityCentres`, etc.

## Accessibility

- Minimum body text 18px; user-toggleable to 20.25px.
- All interactive elements are keyboard reachable with visible focus.
- Colour contrast meets WCAG AA against the background.
- Touch targets ≥ 44×44 px.
- Respects `prefers-reduced-motion`.

## Credits

- Map tiles by [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
- Map library: [Leaflet](https://leafletjs.com/).
- Data from the [City of Vancouver Open Data Portal](https://opendata.vancouver.ca/).
