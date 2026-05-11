/**
 * Auto-classifier: derive { domain, subdomain, amenity } for any record
 * coming back from the Vancouver Open Data Portal.
 *
 * Strategy (in order):
 *   1. If the source dataset has a fixed Amenity (e.g. every row in the
 *      `libraries` dataset is a Library), use that.
 *   2. For storefronts, look up the API's Sub_Category in the taxonomy
 *      (after running it through SUB_CATEGORY_ALIASES).
 *   3. Otherwise, fall back to coarse General_Bu buckets so brand-new
 *      Sub_Category strings still land somewhere reasonable.
 *   4. Return `null` only when even the fallback can't classify the record.
 *
 * Adding a new dataset: register it in `DATASET_AMENITY` (taxonomy.js).
 * Adding a new Sub_Category that should roll up to a different Amenity:
 * add the alias to `SUB_CATEGORY_ALIASES` (taxonomy.js).
 */
window.AmenityClassifier = (function () {
  // Coarse fallback for storefront rows whose Sub_Category we don't yet know.
  // Keys are General_Bu (general business) buckets exactly as published by
  // the Vancouver Open Data Portal.
  const GENERAL_BU_FALLBACK = {
    "Food & Beverage": "Food & Beverage",
    "Comparison Goods": "Other Businesses",
    "Service Commercial": "Other Services",
    "Convenience Goods": "Convenience Store",
    "Automotive Goods & Services": "Automotive Goods & Services",
    "Entertainment and Leisure": "Entertainment and Leisure",
    "Vacant": "Vacant",
    "Vacant UC": "Vacant",
  };

  /** Read a property from a record, tolerating snake_case / PascalCase. */
  function pick(record, ...keys) {
    if (!record) return "";
    for (const k of keys) {
      const v = record[k];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  }

  /**
   * Classify a storefront row.
   * Accepts both the API's snake_case keys and the CSV's PascalCase keys.
   */
  function classifyStorefront(record) {
    const sub = pick(record, "sub_category", "sub_category1", "Sub_Category", "Sub_Category1");
    if (sub) {
      const hit = window.AmenityTaxonomy.lookupByAmenity(sub);
      if (hit) return hit;
    }
    const gen = pick(record, "general_bu", "general_business", "General_Bu");
    const fallback = GENERAL_BU_FALLBACK[gen];
    if (fallback) {
      const hit = window.AmenityTaxonomy.lookupByAmenity(fallback);
      if (hit) return hit;
    }
    return null;
  }

  /**
   * Classify any record. `sourceHint` is the dataset slug (e.g. "libraries")
   * or `"storefronts-inventory"` for the omnibus storefronts dataset.
   *
   * Optional `overrideAmenity` lets a caller force a specific Amenity when
   * a dataset's records vary by an internal field — e.g. a schools dataset
   * where each row has a `school_type` column.
   */
  function classify(record, sourceHint, overrideAmenity) {
    if (overrideAmenity) {
      const hit = window.AmenityTaxonomy.lookupByAmenity(overrideAmenity);
      if (hit) return hit;
    }
    if (sourceHint && sourceHint !== "storefronts-inventory") {
      const fixed = window.AmenityTaxonomy.defaultForDataset(sourceHint);
      if (fixed) return fixed;
    }
    return classifyStorefront(record);
  }

  return { classify, classifyStorefront, GENERAL_BU_FALLBACK };
})();
