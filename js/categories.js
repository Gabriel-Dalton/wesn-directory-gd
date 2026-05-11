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
 * `icon` holds an inline SVG string (Lucide-style, 24×24, currentColor stroke).
 */
window.AmenityCategories = (function () {
  const STOREFRONTS = "storefronts-inventory";

  // Compact Lucide-style icon library. Each value is the *inner* markup of
  // a 24×24 SVG (paths only); svgIcon() wraps it with the outer <svg>.
  const I = {
    heart:        '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
    pill:         '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
    tooth:        '<path d="M12 5.5c-1.5-.6-3-1.1-4.5-1A3.5 3.5 0 0 0 4 8c0 3.5 1 4.5 1 9 0 1.5 1 3 2 3s2-2 2.5-4S11 13 12 13s2 1 2.5 3S15 20 16 20s2-1.5 2-3c0-4.5 1-5.5 1-9a3.5 3.5 0 0 0-3.5-3.5c-1.5-.1-3 .4-4.5 1Z"/>',
    cart:         '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 2h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
    coffee:       '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2"/><path d="M10 2v2"/><path d="M14 2v2"/>',
    bank:         '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 21 7 3 7"/>',
    scissors:     '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>',
    landmark:     '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
    book:         '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2Z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z"/>',
    toilet:       '<path d="M5 21V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v13"/><path d="M5 13h14"/><path d="M9 21v-2"/><path d="M15 21v-2"/>',
    tree:         '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-1.7a1 1 0 0 1-.7-1.7L8 9H6.3A1 1 0 0 1 5.6 7.4L12 1l6.4 6.4A1 1 0 0 1 17.7 9H16l3.3 3.3A1 1 0 0 1 18.7 14Z"/><path d="M12 22v-3"/>',
    droplet:      '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z"/>',
    palette:      '<circle cx="13.5" cy="6.5" r=".75"/><circle cx="17.5" cy="10.5" r=".75"/><circle cx="8.5" cy="7.5" r=".75"/><circle cx="6.5" cy="12.5" r=".75"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.83-.44-1.12-.29-.29-.44-.65-.44-1.12a1.64 1.64 0 0 1 1.67-1.67h1.99c3.05 0 5.55-2.5 5.55-5.55C22 6 17.5 2 12 2Z"/>',
    image:        '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    utensils:     '<path d="M3 2v7c0 1.1.9 2 2 2h2v9"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"/>',
    wineGlass:    '<path d="M8 22h8"/><path d="M12 16v6"/><path d="M5 2h14l-2 8a5 5 0 0 1-10 0Z"/>',
    sparkles:     '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/><path d="M19 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1Z"/>',
    paw:          '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><circle cx="7" cy="6" r="2"/><circle cx="4" cy="14" r="2"/><path d="M9 12a4 4 0 0 0-4 4c0 2 1.5 3 3 4s2 2 4 2 2.5-1 4-2 3-2 3-4a4 4 0 0 0-4-4Z"/>',
    music:        '<circle cx="6" cy="18" r="3"/><circle cx="18" cy="15" r="3"/><path d="M9 18V5l12-2v13"/>',
    gradCap:      '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/>',
    house:        '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    bed:          '<path d="M2 17v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5"/><path d="M2 17h20v3H2z"/><path d="M5 10V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3"/>',
    flame:        '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.4 0 2.5-1.1 2.5-2.5 0-1-.7-2.3-1.5-3-1-.9-2-1.8-2.5-2.8-.7 1.5-1 2.5-1 3.3 0 1 .5 2 1 2.5Z"/><path d="M12 22c5 0 9-4 9-9 0-3-1-5-3-7-1.5-1.5-3-3-3.5-4.5-.5 1.5-1.5 2.5-3 3.5-4 3-5 5-5 8a9 9 0 0 0 9 9Z"/>',
    accessible:   '<circle cx="12" cy="4" r="2"/><path d="M19 13a7 7 0 1 1-9.3-6.6"/><path d="M11 12h4l3 8"/><path d="M10 6v8h5"/>',
    users:        '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    scale:        '<path d="M16 16a4 4 0 0 1-4 4 4 4 0 0 1-4-4"/><path d="M12 4v16"/><path d="M3 9h6l-3 8a3 3 0 0 1-3-3Z"/><path d="M15 9h6l-3 8a3 3 0 0 1-3-3Z"/>',
    store:        '<path d="m2 7 2-4h16l2 4"/><path d="M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7"/><path d="M4 7h16"/><path d="M9 21V12h6v9"/>',
    cube:         '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  };

  function svgIcon(inner, opts = {}) {
    const stroke = opts.stroke || 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  }

  // Sidebar groups. The `amenities` array lists canonical Amenity names from
  // the taxonomy (js/taxonomy.js). When the API returns a new Sub_Category, the
  // classifier normalizes it to one of these — no edits needed here unless
  // WESN wants the new Amenity surfaced under a different sidebar group.
  const groups = [
    {
      id: "healthcare",
      label: "Clinics & Health",
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
      icon: svgIcon(I.pill),
      color: "#1e8a3a",
      amenities: ["Pharmacy"],
    },
    {
      id: "dental-vision",
      label: "Dentists & Optometrists",
      icon: svgIcon(I.tooth),
      color: "#0e7287",
      amenities: ["Dentist", "Optometry"],
    },
    {
      id: "groceries",
      label: "Groceries",
      icon: svgIcon(I.cart),
      color: "#558b2f",
      amenities: [
        "Grocery Store", "Supermarket", "Convenience Store", "Produce Store",
      ],
    },
    {
      id: "cafes",
      label: "Bakeries & Cafés",
      icon: svgIcon(I.coffee),
      color: "#8d6e63",
      amenities: ["Bakery & Cafe", "Dessert & Sweet Food Shops"],
    },
    {
      id: "banking",
      label: "Banks",
      icon: svgIcon(I.bank),
      color: "#5d4037",
      amenities: ["Bank", "Financial Advisors", "Currency Exchange"],
    },
    {
      id: "personal-services",
      label: "Personal Services",
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
      id: "community-centres",
      label: "Community Centres",
      icon: svgIcon(I.landmark),
      color: "#0277bd",
      amenities: ["Community Centre"],
    },
    {
      id: "libraries",
      label: "Libraries",
      icon: svgIcon(I.book),
      color: "#283593",
      amenities: ["Library"],
    },
    {
      id: "washrooms",
      label: "Public Washrooms",
      icon: svgIcon(I.toilet),
      color: "#00838f",
      amenities: ["Public Washroom"],
    },
    {
      id: "parks",
      label: "Parks",
      icon: svgIcon(I.tree),
      color: "#1e8a3a",
      amenities: ["Green Space", "Community Garden"],
    },
    {
      id: "drinking-fountains",
      label: "Drinking Fountains",
      icon: svgIcon(I.droplet),
      color: "#0e7287",
      amenities: ["Water Fountain"],
    },
    {
      id: "cultural-spaces",
      label: "Cultural Spaces",
      icon: svgIcon(I.palette),
      color: "#ad1457",
      amenities: ["Art & Cultural Space", "BC Alliance for Arts and Culture"],
    },
    {
      id: "public-art",
      label: "Public Art",
      icon: svgIcon(I.image),
      color: "#b76e0e",
      amenities: ["Public Art"],
    },

    // -- Newly added groups (driven by the WESN curated All Amenities set). --
    // Order placed after the senior-priority groups so the sidebar's most-used
    // toggles stay near the top.

    {
      id: "restaurants",
      label: "Restaurants",
      icon: svgIcon(I.utensils),
      color: "#d84315",
      amenities: ["Food & Beverage"],
    },
    {
      id: "liquor-cannabis",
      label: "Liquor, Cannabis & Smoke Shops",
      icon: svgIcon(I.wineGlass),
      color: "#7e57c2",
      amenities: ["Alcohol Retail", "Cannabis Store", "Vape & Smoke Shop"],
    },
    {
      id: "personal-care",
      label: "Personal Care Products",
      icon: svgIcon(I.sparkles),
      color: "#ec407a",
      amenities: ["Personal Care Products"],
    },
    {
      id: "veterinary",
      label: "Veterinary",
      icon: svgIcon(I.paw),
      color: "#6d4c41",
      amenities: ["Vet"],
    },
    {
      id: "entertainment",
      label: "Entertainment & Leisure",
      icon: svgIcon(I.music),
      color: "#c2185b",
      amenities: ["Entertainment and Leisure", "Dragon Boat BC", "Media Company"],
    },
    {
      id: "schools",
      label: "Schools & Colleges",
      icon: svgIcon(I.gradCap),
      color: "#1565c0",
      amenities: [
        "Elementary School", "High School", "Secondary School",
        "K-12 Private General School", "Language School", "Film School",
        "College", "The Community Solution Education System",
      ],
    },
    {
      id: "housing",
      label: "Housing",
      icon: svgIcon(I.house),
      color: "#2e7d32",
      amenities: ["Non-market Housing"],
    },
    {
      id: "shelters",
      label: "Shelters",
      icon: svgIcon(I.bed),
      color: "#ef6c00",
      amenities: ["Shelter"],
    },
    {
      id: "fire-halls",
      label: "Fire Halls",
      icon: svgIcon(I.flame),
      color: "#b71c1c",
      amenities: ["Fire Hall"],
    },
    {
      id: "disability-parking",
      label: "Disability Parking",
      icon: svgIcon(I.accessible),
      color: "#1976d2",
      amenities: ["Disability Parking"],
    },
    {
      id: "community-services",
      label: "Community & Social Services",
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
      id: "government-legal",
      label: "Government & Legal",
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
      id: "shops-other",
      label: "Shops & Other Retail",
      icon: svgIcon(I.store),
      color: "#795548",
      amenities: [
        "Other Businesses", "Dollarama", "Supplement Products",
        "Flower Shop", "Mushroom Shop", "Automotive Goods & Services",
        "Telecom Stores", "Computer & Mobile Phone Service",
      ],
    },
    {
      id: "other-services",
      label: "Other Services",
      icon: svgIcon(I.cube),
      color: "#546e7a",
      amenities: ["Other Services"],
    },
  ];

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
    classifyStorefront,
    groupIdForAmenity,
    STOREFRONTS,
  };
})();
