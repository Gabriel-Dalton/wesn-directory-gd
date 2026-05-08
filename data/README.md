# Data sources

The map fetches **live geocoded data** from the City of Vancouver Open Data
Portal at page load. The CSV in this folder is a curated snapshot used as an
offline-degraded fallback only.

## Live datasets used

| Dataset slug                       | Used for                            |
| ---------------------------------- | ----------------------------------- |
| `storefronts-inventory`            | Clinics, pharmacies, banks, etc.    |
| `community-centres`                | Community centres                   |
| `libraries`                        | Public library branches             |
| `public-washrooms`                 | Public washrooms                    |
| `parks-polygon-representation`     | Parks                               |

All are exported as GeoJSON via:

```
https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/{slug}/exports/geojson
```

## Refreshing the snapshot

The CSV snapshot only matters if you want a useful offline experience. To
refresh it from the latest live data:

```sh
node scripts/fetch-data.mjs
```

This rewrites `data/storefronts-vancouver-2025.csv` with the most recent
year_recorded records.

## CSV schema

Columns match the City of Vancouver "Storefronts inventory" export:

```
OBJECTID, Store_ID, Address, Unit, Civic_Numb, Street, Address_Ab,
Business_N, Year_Recor, General_Bu, BIA_Name, ID_Year, Local_Area,
Sub_Category, Sub_Category1
```

The CSV does **not** include coordinates — when offline-degraded mode is
active, records are shown in lists/search but not as map pins.
