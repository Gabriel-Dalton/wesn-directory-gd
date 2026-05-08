#!/usr/bin/env node
/**
 * Refresh the offline storefronts CSV snapshot from the City of Vancouver
 * Open Data Portal.
 *
 * Usage:
 *   node scripts/fetch-data.mjs
 *
 * Requires Node 18+ (uses native fetch).
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "data", "storefronts-vancouver-2025.csv");

const YEAR = new Date().getFullYear();
const URL =
  `https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/` +
  `storefronts-inventory/exports/csv?lang=en&timezone=America%2FLos_Angeles` +
  `&where=year_recorded%3D${YEAR}`;

async function main() {
  console.log(`Fetching storefronts inventory for ${YEAR}…`);
  const res = await fetch(URL);
  if (!res.ok) {
    console.error(`Request failed: ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const text = await res.text();
  if (!text.trim()) {
    console.error("Empty response from Open Data API.");
    process.exit(1);
  }
  await writeFile(OUT, text, "utf8");
  const lines = text.split("\n").length - 1;
  console.log(`Wrote ${OUT} (${lines.toLocaleString()} lines).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
