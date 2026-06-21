/**
 * Category configuration for the WESN Vancouver Amenities Map.
 *
 * `groups` defines what users see in the sidebar — senior-relevant amenity
 * groupings. Each group lists the canonical Amenity names (from the WESN
 * taxonomy, see `js/taxonomy.js`) that should appear under it. Order in the
 * array is the order shown in the sidebar.
 *
 * Why amenity names and not raw `Sub_Category` strings? Because the Sub_Category
 * field on the Vancouver storefronts API is noisy (typos, plural drift,
 * deli-style sub-types) and changes over time. The taxonomy normalizes
 * everything to a canonical Amenity, so this file only changes when WESN
 * decides to add or rename a sidebar grouping.
 *
 * ## Icons
 *
 * Every icon below is the verbatim inner markup of an official Lucide icon
 * (https://lucide.dev — ISC licensed). Each entry is keyed by a local name
 * and annotated with the Lucide source filename, so future edits can pull
 * fresh paths from https://raw.githubusercontent.com/lucide-icons/lucide/
 * main/icons/<name>.svg. Do not hand-edit the path data; if an icon needs
 * updating, copy the new path from Lucide and update the comment.
 *
 * Sizing: each path is drawn on a 24×24 grid with stroke-width 2,
 * stroke-linecap/linejoin "round", and fill "none" — matching Lucide's
 * canonical viewBox. svgIcon() wraps the inner markup with that outer <svg>.
 */
window.AmenityCategories = (function () {
  const STOREFRONTS = "storefronts-inventory";

  // Verified Lucide icon paths (https://lucide.dev). Keys are the local
  // semantic names used by the sidebar groups below; comments record the
  // canonical Lucide filename so future updates can be pulled directly from
  // https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/<name>.svg
  const I = {
    // lucide: heart-pulse — Clinics & Health
    heart:        '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/><path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
    // lucide: pill — Pharmacies
    pill:         '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
    // lucide: stethoscope — Dentists & Optometrists. Lucide has no tooth or
    // dental icon; stethoscope is the closest medical-professional glyph.
    stethoscope:  '<path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>',
    // lucide: shopping-cart — Groceries
    cart:         '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    // lucide: coffee — Bakeries & Cafés
    coffee:       '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
    // lucide: landmark — Banks (columned classical building)
    landmark:     '<path d="M10 18v-7"/><path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/>',
    // lucide: scissors — Personal Services
    scissors:     '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
    // lucide: building-2 — Community Centres. Differentiates from `landmark`
    // (banks), which previously shared an identical path with this entry.
    building:     '<path d="M10 12h4"/><path d="M10 8h4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>',
    // lucide: library — Libraries (books on a shelf)
    library:      '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
    // lucide: toilet — Public Washrooms
    toilet:       '<path d="M7 12h13a1 1 0 0 1 1 1 5 5 0 0 1-5 5h-.598a.5.5 0 0 0-.424.765l1.544 2.47a.5.5 0 0 1-.424.765H5.402a.5.5 0 0 1-.424-.765L7 18"/><path d="M8 18a5 5 0 0 1-5-5V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8"/>',
    // lucide: trees — Parks
    trees:        '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>',
    // lucide: droplets — Drinking Fountains
    droplets:     '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',
    // lucide: palette — Cultural Spaces. The four small dots use
    // fill="currentColor" to render as solid colour wells, matching Lucide.
    palette:      '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>',
    // lucide: image — Public Art
    image:        '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    // lucide: utensils — Restaurants
    utensils:     '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    // lucide: wine — Liquor, Cannabis & Smoke Shops
    wine:         '<path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/>',
    // lucide: sparkles — Personal Care Products. The small circle uses no
    // fill override (stays open) to match Lucide rendering.
    sparkles:     '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>',
    // lucide: paw-print — Veterinary
    pawPrint:     '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
    // lucide: music — Entertainment & Leisure
    music:        '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    // lucide: graduation-cap — Schools & Colleges
    graduationCap:'<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    // lucide: house — Housing
    house:        '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    // lucide: bed — Shelters
    bed:          '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    // lucide: flame — Fire Halls
    flame:        '<path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/>',
    // lucide: accessibility — Disability Parking
    accessibility:'<circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/>',
    // lucide: users — Community & Social Services
    users:        '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
    // lucide: scale — Government & Legal
    scale:        '<path d="M12 3v18"/><path d="m19 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"/><path d="m5 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M7 21h10"/>',
    // lucide: store — Shops & Other Retail
    store:        '<path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"/><path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"/><path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"/>',
    // lucide: package — Other Services
    package:      '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/>',
    // lucide: receipt — Tax Services
    receipt:      '<path d="M12 17V7"/><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8"/><path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"/>',
    // lucide: shield — Insurance Company
    shield:       '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    // lucide: key — Real Estate Service
    key:          '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
    // lucide: truck — Courier Company
    truck:        '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    // lucide: washing-machine — Laundry and Dry Cleaner
    washingMachine:'<path d="M3 6h3"/><path d="M17 6h.01"/><rect width="18" height="20" x="3" y="2" rx="2"/><circle cx="12" cy="13" r="5"/><path d="M12 18a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 1 0-5"/>',
    // lucide: stamp — Notary
    stamp:        '<path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13"/><path d="M20 15.5a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z"/><path d="M5 22h14"/>',
    // lucide: footprints — Shoe & Bag Repair
    footprints:   '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/>',
  };

  function svgIcon(inner, opts = {}) {
    const stroke = opts.stroke || 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  }

  // Per-amenity icon overrides. A sidebar group carries a single icon, but a
  // few groups (notably "Personal Services") bundle amenities that share
  // nothing visually — a hair salon, a tax office, and a dry cleaner all
  // landed under the same scissors glyph. This map lets an individual canonical
  // Amenity opt into a more fitting icon for its map marker and popup, keyed by
  // the canonical Amenity name. Anything not listed here falls back to the
  // group icon, so this stays small and only records genuine exceptions.
  const iconByAmenity = {
    // "Personal Services" group — scissors only fits hair/tailoring, so the
    // service-desk amenities get their own glyphs.
    "Tax Services":            svgIcon(I.receipt),
    "Insurance Company":       svgIcon(I.shield),
    "Real Estate Service":     svgIcon(I.key),
    "Courier Company":         svgIcon(I.truck),
    "Laundry and Dry Cleaner": svgIcon(I.washingMachine),
    "Notary":                  svgIcon(I.stamp),
    "Shoe & Bag Repair":       svgIcon(I.footprints),
  };

  /**
   * Icon SVG markup to use for a specific canonical Amenity, or null when the
   * amenity has no override and the caller should fall back to the group icon.
   * Accepts raw or canonical amenity names.
   */
  function iconForAmenity(amenity) {
    if (!amenity) return null;
    const canon = window.AmenityTaxonomy.canonicalAmenity(amenity);
    return iconByAmenity[canon] || iconByAmenity[amenity] || null;
  }

  // Sidebar groups. The `amenities` array lists canonical Amenity names from
  // the taxonomy (js/taxonomy.js). When the API returns a new Sub_Category, the
  // classifier normalizes it to one of these — no edits needed here unless
  // WESN wants the new Amenity surfaced under a different sidebar group.
  //
  // `domain` and `subdomain` slot each group into the WHO Age-Friendly
  // Communities hierarchy (mirrors taxonomy.js). The sidebar uses them to
  // render Domain → Subdomain sections; groups whose amenities span multiple
  // subdomains use the most representative one.
  const groups = [
    {
      id: "healthcare",
      label: "Clinics & Health",
      domain: "Community & Healthcare Services",
      subdomain: "Healthcare",
      icon: svgIcon(I.heart),
      color: "#c62828",
      amenities: [
        "Clinic", "Doctor", "Health & Wellness", "Health & Social Services",
        "Lab", "LifeLabs",
        "Three Bridges Community Health Centre",
        "Safer Alternative for Emergency Response",
      ],
    },
    {
      id: "pharmacy",
      label: "Pharmacies",
      domain: "Community & Healthcare Services",
      subdomain: "Healthcare",
      icon: svgIcon(I.pill),
      color: "#1e8a3a",
      amenities: ["Pharmacy"],
    },
    {
      id: "dental-vision",
      label: "Dentists & Optometrists",
      domain: "Community & Healthcare Services",
      subdomain: "Healthcare",
      icon: svgIcon(I.stethoscope),
      color: "#0e7287",
      amenities: ["Dentist", "Optometry"],
    },
    {
      id: "veterinary",
      label: "Veterinary",
      domain: "Community & Healthcare Services",
      subdomain: "Healthcare",
      icon: svgIcon(I.pawPrint),
      color: "#6d4c41",
      amenities: ["Vet"],
    },
    {
      id: "groceries",
      label: "Groceries",
      domain: "Outdoor Spaces and Amenities",
      subdomain: "Retail & Commercial Services",
      icon: svgIcon(I.cart),
      color: "#558b2f",
      amenities: [
        "Grocery Store", "Supermarket", "Convenience Store", "Produce Store",
      ],
    },
    {
      id: "cafes",
      label: "Bakeries & Cafés",
      domain: "Outdoor Spaces and Amenities",
      subdomain: "Retail & Commercial Services",
      icon: svgIcon(I.coffee),
      color: "#8d6e63",
      amenities: ["Bakery & Cafe", "Dessert & Sweet Food Shops"],
    },
    {
      id: "restaurants",
      label: "Restaurants",
      domain: "Outdoor Spaces and Amenities",
      subdomain: "Retail & Commercial Services",
      icon: svgIcon(I.utensils),
      color: "#d84315",
      amenities: ["Food & Beverage"],
    },
    {
      id: "liquor-cannabis",
      label: "Liquor, Cannabis & Smoke Shops",
      domain: "Outdoor Spaces and Amenities",
      subdomain: "Retail & Commercial Services",
      icon: svgIcon(I.wine),
      color: "#7e57c2",
      amenities: ["Alcohol Retail", "Cannabis Store", "Vape & Smoke Shop"],
    },
    {
      id: "shops-other",
      label: "Shops & Other Retail",
      domain: "Outdoor Spaces and Amenities",
      subdomain: "Retail & Commercial Services",
      icon: svgIcon(I.store),
      color: "#795548",
      amenities: [
        "Other Businesses", "Dollarama", "Supplement Products",
        "Flower Shop", "Mushroom Shop", "Automotive Goods & Services",
        "Telecom Stores", "Computer & Mobile Phone Service",
      ],
    },
    {
      id: "personal-care",
      label: "Personal Care Products",
      domain: "Outdoor Spaces and Amenities",
      subdomain: "Personal Care Products",
      icon: svgIcon(I.sparkles),
      color: "#ec407a",
      amenities: ["Personal Care Products"],
    },
    {
      id: "personal-services",
      label: "Personal Services",
      domain: "Outdoor Spaces and Amenities",
      subdomain: "Personal & Household Services",
      icon: svgIcon(I.scissors),
      color: "#6a1b9a",
      amenities: [
        "Beauty & Wellness", "Tax Services", "Notary", "Insurance Company",
        "Real Estate Service", "Courier Company",
        "Laundry and Dry Cleaner", "Tailoring & Alterations",
        "Shoe & Bag Repair",
      ],
    },
    {
      id: "banking",
      label: "Banks",
      domain: "Outdoor Spaces and Amenities",
      subdomain: "Financial Services",
      icon: svgIcon(I.landmark),
      color: "#5d4037",
      amenities: ["Bank", "Financial Advisors", "Currency Exchange"],
    },
    {
      id: "libraries",
      label: "Libraries",
      domain: "Outdoor Spaces and Amenities",
      subdomain: "Education & Cultural Services",
      icon: svgIcon(I.library),
      color: "#283593",
      amenities: ["Library"],
    },
    {
      id: "cultural-spaces",
      label: "Cultural Spaces",
      domain: "Outdoor Spaces and Amenities",
      subdomain: "Education & Cultural Services",
      icon: svgIcon(I.palette),
      color: "#ad1457",
      amenities: ["Art & Cultural Space", "BC Alliance for Arts and Culture"],
    },
    {
      id: "public-art",
      label: "Public Art",
      domain: "Outdoor Spaces and Amenities",
      subdomain: "Education & Cultural Services",
      icon: svgIcon(I.image),
      color: "#b76e0e",
      amenities: ["Public Art"],
    },
    {
      id: "schools",
      label: "Schools & Colleges",
      domain: "Outdoor Spaces and Amenities",
      subdomain: "Education & Cultural Services",
      icon: svgIcon(I.graduationCap),
      color: "#1565c0",
      amenities: [
        "Elementary School", "High School", "Secondary School",
        "K-12 Private General School", "Language School", "Film School",
        "College", "The Community Solution Education System",
      ],
    },
    {
      id: "entertainment",
      label: "Entertainment & Leisure",
      domain: "Outdoor Spaces and Amenities",
      subdomain: "Entertainment and Leisure",
      icon: svgIcon(I.music),
      color: "#c2185b",
      amenities: ["Entertainment and Leisure", "Dragon Boat BC", "Media Company"],
    },
    {
      id: "parks",
      label: "Parks",
      domain: "Outdoor Spaces and Amenities",
      subdomain: "Green Space",
      icon: svgIcon(I.trees),
      color: "#1e8a3a",
      amenities: ["Green Space", "Community Garden"],
    },
    {
      id: "washrooms",
      label: "Public Washrooms",
      domain: "Outdoor Spaces and Amenities",
      subdomain: "Rest Areas",
      icon: svgIcon(I.toilet),
      color: "#00838f",
      amenities: ["Public Washroom"],
    },
    {
      id: "drinking-fountains",
      label: "Drinking Fountains",
      domain: "Outdoor Spaces and Amenities",
      subdomain: "Rest Areas",
      icon: svgIcon(I.droplets),
      color: "#0e7287",
      amenities: ["Water Fountain"],
    },
    {
      id: "government-legal",
      label: "Government & Legal",
      domain: "Outdoor Spaces and Amenities",
      subdomain: "Government & Public Services",
      icon: svgIcon(I.scale),
      color: "#455a64",
      amenities: [
        "ICBC Driver Licensing", "Work BC Centre",
        "Army Navy Head Office", "Avi Lewis (NDP) Campaign office",
        "M.L.A Spencer Chandra Herbert",
        "Notary", "Law Office",
      ],
    },
    {
      id: "other-services",
      label: "Other Services",
      domain: "Outdoor Spaces and Amenities",
      subdomain: "Other",
      icon: svgIcon(I.package),
      color: "#546e7a",
      amenities: ["Other Services"],
    },
    {
      id: "community-centres",
      label: "Community Centres",
      domain: "Social Participation and Inclusion",
      subdomain: "Community & Social Services",
      icon: svgIcon(I.building),
      color: "#0277bd",
      amenities: ["Community Centre"],
    },
    {
      id: "community-services",
      label: "Community & Social Services",
      domain: "Social Participation and Inclusion",
      subdomain: "Community & Social Services",
      icon: svgIcon(I.users),
      color: "#00695c",
      amenities: [
        "Community & Social Services",
        "Community Policing Centre",
        "Chinese Community Policing Centre",
        "West End Coal Harbour community policing centre",
        "Community Services Access Point Society",
        "Community Affordable Groceries",
        "Directions Youth Resource Centre",
        "Elizabeth Fry Society",
        "Youth Centre",
        "Muslim Care Centre",
        "Muslim Food Bank",
        "Pace Society Office",
        "QMUNITY BC's Queer Resource",
        "SUCCESS",
        "SUCCESS social service centre",
        "Vancouver Women's Health Collective",
        "Vancouver Native Housing Society",
        "BC Indigenous Housing Society",
        "Indigenous Innovations YVR",
        "Neighbourhood Housing Society",
        "Chinese national league of Canada",
        "Hastings Crossing BIA",
        "Vancouver Chinatown BIA Society",
      ],
    },
    {
      id: "housing",
      label: "Housing",
      domain: "Housing",
      subdomain: "Affordable Housing",
      icon: svgIcon(I.house),
      color: "#2e7d32",
      amenities: ["Non-market Housing"],
    },
    {
      id: "shelters",
      label: "Shelters",
      domain: "Housing",
      subdomain: "Emergency Housing",
      icon: svgIcon(I.bed),
      color: "#ef6c00",
      amenities: ["Shelter"],
    },
    {
      id: "disability-parking",
      label: "Disability Parking",
      domain: "Transportation",
      subdomain: "Parking Infrastructure",
      icon: svgIcon(I.accessibility),
      color: "#1976d2",
      amenities: ["Disability Parking"],
    },
    {
      id: "fire-halls",
      label: "Fire Halls",
      domain: "Safety",
      subdomain: "Built Environment Safety",
      icon: svgIcon(I.flame),
      color: "#b71c1c",
      amenities: ["Fire Hall"],
    },
  ];

  // Order the Domain accordions in the sidebar. Anything not listed here will
  // fall through to the end in insertion order — but every domain produced by
  // the taxonomy is enumerated explicitly below.
  const DOMAIN_ORDER = [
    "Community & Healthcare Services",
    "Outdoor Spaces and Amenities",
    "Social Participation and Inclusion",
    "Housing",
    "Transportation",
    "Safety",
  ];

  /**
   * Build the Domain → Subdomain → groups tree the sidebar renders.
   * Returns: [{ domain, subdomains: [{ subdomain, groups: [group] }] }]
   */
  function tree() {
    const byDomain = new Map();
    for (const g of groups) {
      const d = g.domain || "Other";
      if (!byDomain.has(d)) byDomain.set(d, new Map());
      const subdomains = byDomain.get(d);
      const s = g.subdomain || "Other";
      if (!subdomains.has(s)) subdomains.set(s, []);
      subdomains.get(s).push(g);
    }
    const domainKey = (name) => {
      const i = DOMAIN_ORDER.indexOf(name);
      return i === -1 ? DOMAIN_ORDER.length : i;
    };
    return [...byDomain.entries()]
      .sort((a, b) => domainKey(a[0]) - domainKey(b[0]))
      .map(([domain, subMap]) => ({
        domain,
        subdomains: [...subMap.entries()].map(([subdomain, gs]) => ({
          subdomain,
          groups: gs,
        })),
      }));
  }

  const byId = Object.fromEntries(groups.map((g) => [g.id, g]));

  // Reverse lookup: canonical Amenity → groupId. Built once at startup so
  // classifyStorefront/classifyAmenity are O(1).
  const groupByAmenity = (() => {
    const map = {};
    for (const g of groups) {
      for (const a of g.amenities || []) map[a] = g.id;
    }
    return map;
  })();

  /**
   * Given a canonical Amenity name, return the sidebar groupId it belongs
   * to (or null if no sidebar group surfaces this Amenity — the record is
   * still tracked by the taxonomy, just not shown in the sidebar).
   */
  function groupIdForAmenity(amenity) {
    if (!amenity) return null;
    const canon = window.AmenityTaxonomy.canonicalAmenity(amenity);
    return groupByAmenity[canon] || null;
  }

  /**
   * Storefronts compatibility shim. Old callers pass a raw API record and
   * expect a groupId back; under the hood we now route through the
   * taxonomy-aware classifier.
   */
  function classifyStorefront(record) {
    const triple = window.AmenityClassifier.classifyStorefront(record);
    if (!triple) return null;
    return groupIdForAmenity(triple.amenity);
  }

  return {
    groups,
    byId,
    tree,
    classifyStorefront,
    groupIdForAmenity,
    iconForAmenity,
    STOREFRONTS,
  };
})();
