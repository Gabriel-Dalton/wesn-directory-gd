/**
 * Amenity Taxonomy — single source of truth for the
 * Domain → Subdomain → Amenity hierarchy used to describe every place on the
 * map.
 *
 * This taxonomy was derived from the curated WESN "All Amenities" dataset.
 * The City of Vancouver Open Data Portal does **not** publish these three
 * fields; they are layered on top of API data by `js/classify.js`, so when
 * the API adds new sub-categories you only need to update this file.
 *
 * Three lookup tables exposed:
 *   - TRIPLES                 every [domain, subdomain, amenity] combination
 *   - SUB_CATEGORY_ALIASES    storefronts API "Sub_Category" → canonical Amenity
 *   - DATASET_AMENITY         dataset slug → fixed Amenity (or null = varies)
 *
 * Helpers:
 *   - lookupByAmenity(name)   { domain, subdomain, amenity } | null
 *   - defaultForDataset(slug) { domain, subdomain, amenity } | null
 *   - amenitiesOf(subdomain)  string[]
 *   - subdomainsOf(domain)    string[]
 *   - allDomains()            string[]
 */
window.AmenityTaxonomy = (function () {
  // Full Domain → Subdomain → Amenity tree. Order is irrelevant; uniqueness
  // is enforced by the indexing step below. Update this list when WESN adds
  // a new Amenity to the master directory.
  const TRIPLES = [
    // --- Community & Healthcare Services ---
    ["Community & Healthcare Services", "Healthcare", "Clinic"],
    ["Community & Healthcare Services", "Healthcare", "Doctor"],
    ["Community & Healthcare Services", "Healthcare", "Dentist"],
    ["Community & Healthcare Services", "Healthcare", "Optometry"],
    ["Community & Healthcare Services", "Healthcare", "Pharmacy"],
    ["Community & Healthcare Services", "Healthcare", "Lab"],
    ["Community & Healthcare Services", "Healthcare", "LifeLabs"],
    ["Community & Healthcare Services", "Healthcare", "Vet"],
    ["Community & Healthcare Services", "Healthcare", "Health & Wellness"],
    ["Community & Healthcare Services", "Healthcare", "Safer Alternative for Emergency Response"],
    ["Community & Healthcare Services", "Healthcare", "Three Bridges Community Health Centre"],
    ["Community & Healthcare Services", "Health & Social Services", "Health & Social Services"],

    // --- Housing ---
    ["Housing", "Affordable Housing", "Non-market Housing"],
    ["Housing", "Emergency Housing", "Shelter"],

    // --- Outdoor Spaces and Amenities ---
    ["Outdoor Spaces and Amenities", "Retail & Commercial Services", "Food & Beverage"],
    ["Outdoor Spaces and Amenities", "Retail & Commercial Services", "Bakery & Cafe"],
    ["Outdoor Spaces and Amenities", "Retail & Commercial Services", "Dessert & Sweet Food Shops"],
    ["Outdoor Spaces and Amenities", "Retail & Commercial Services", "Grocery Store"],
    ["Outdoor Spaces and Amenities", "Retail & Commercial Services", "Supermarket"],
    ["Outdoor Spaces and Amenities", "Retail & Commercial Services", "Convenience Store"],
    ["Outdoor Spaces and Amenities", "Retail & Commercial Services", "Produce Store"],
    ["Outdoor Spaces and Amenities", "Retail & Commercial Services", "Flower Shop"],
    ["Outdoor Spaces and Amenities", "Retail & Commercial Services", "Mushroom Shop"],
    ["Outdoor Spaces and Amenities", "Retail & Commercial Services", "Alcohol Retail"],
    ["Outdoor Spaces and Amenities", "Retail & Commercial Services", "Cannabis Store"],
    ["Outdoor Spaces and Amenities", "Retail & Commercial Services", "Vape & Smoke Shop"],
    ["Outdoor Spaces and Amenities", "Retail & Commercial Services", "Automotive Goods & Services"],
    ["Outdoor Spaces and Amenities", "Retail & Commercial Services", "Dollarama"],
    ["Outdoor Spaces and Amenities", "Retail & Commercial Services", "Supplement Products"],

    ["Outdoor Spaces and Amenities", "Personal Care Products", "Personal Care Products"],

    ["Outdoor Spaces and Amenities", "Beauty & Wellness", "Beauty & Wellness"],

    ["Outdoor Spaces and Amenities", "Personal & Household Services", "Laundry and Dry Cleaner"],
    ["Outdoor Spaces and Amenities", "Personal & Household Services", "Tailoring & Alterations"],
    ["Outdoor Spaces and Amenities", "Personal & Household Services", "Shoe & Bag Repair"],

    ["Outdoor Spaces and Amenities", "Communication & Delivery Services", "Telecom Stores"],
    ["Outdoor Spaces and Amenities", "Communication & Delivery Services", "Computer & Mobile Phone Service"],

    ["Outdoor Spaces and Amenities", "Postal & Courier", "Courier Company"],

    ["Outdoor Spaces and Amenities", "Financial Services", "Bank"],
    ["Outdoor Spaces and Amenities", "Financial Services", "Financial Advisors"],
    ["Outdoor Spaces and Amenities", "Financial Services", "Insurance Company"],
    ["Outdoor Spaces and Amenities", "Financial Services", "Currency Exchange"],
    ["Outdoor Spaces and Amenities", "Financial Services", "Tax Services"],
    ["Outdoor Spaces and Amenities", "Financial Services", "Real Estate Service"],

    ["Outdoor Spaces and Amenities", "Legal Services", "Notary"],
    ["Outdoor Spaces and Amenities", "Legal Services", "Law Office"],

    ["Outdoor Spaces and Amenities", "Government & Public Services", "ICBC Driver Licensing"],
    ["Outdoor Spaces and Amenities", "Government & Public Services", "Work BC Centre"],
    ["Outdoor Spaces and Amenities", "Government & Public Services", "Army Navy Head Office"],
    ["Outdoor Spaces and Amenities", "Government & Public Services", "Avi Lewis (NDP) Campaign office"],
    ["Outdoor Spaces and Amenities", "Government & Public Services", "M.L.A Spencer Chandra Herbert"],

    ["Outdoor Spaces and Amenities", "Education & Cultural Services", "Library"],
    ["Outdoor Spaces and Amenities", "Education & Cultural Services", "Public Art"],
    ["Outdoor Spaces and Amenities", "Education & Cultural Services", "Art & Cultural Space"],
    ["Outdoor Spaces and Amenities", "Education & Cultural Services", "BC Alliance for Arts and Culture"],
    ["Outdoor Spaces and Amenities", "Education & Cultural Services", "Elementary School"],
    ["Outdoor Spaces and Amenities", "Education & Cultural Services", "High School"],
    ["Outdoor Spaces and Amenities", "Education & Cultural Services", "Secondary School"],
    ["Outdoor Spaces and Amenities", "Education & Cultural Services", "K-12 Private General School"],
    ["Outdoor Spaces and Amenities", "Education & Cultural Services", "Language School"],
    ["Outdoor Spaces and Amenities", "Education & Cultural Services", "Film School"],
    ["Outdoor Spaces and Amenities", "Education & Cultural Services", "College"],
    ["Outdoor Spaces and Amenities", "Education & Cultural Services", "The Community Solution Education System"],

    ["Outdoor Spaces and Amenities", "Entertainment and Leisure", "Entertainment and Leisure"],
    ["Outdoor Spaces and Amenities", "Entertainment and Leisure", "Dragon Boat BC"],
    ["Outdoor Spaces and Amenities", "Entertainment and Leisure", "Media Company"],

    ["Outdoor Spaces and Amenities", "Green Space", "Green Space"],
    ["Outdoor Spaces and Amenities", "Green Space", "Community Garden"],

    ["Outdoor Spaces and Amenities", "Rest Areas", "Public Washroom"],
    ["Outdoor Spaces and Amenities", "Rest Areas", "Water Fountain"],

    ["Outdoor Spaces and Amenities", "Other", "Other Businesses"],
    ["Outdoor Spaces and Amenities", "Other", "Other Services"],

    // --- Transportation ---
    ["Transportation", "Parking Infrastructure", "Disability Parking"],

    // --- Safety ---
    ["Safety", "Built Environment Safety", "Fire Hall"],

    // --- Social Participation and Inclusion ---
    // The Community & Social Services subdomain is a long tail of named
    // organizations rather than reusable types — each entry is its own Amenity.
    ["Social Participation and Inclusion", "Community & Social Services", "Community Centre"],
    ["Social Participation and Inclusion", "Community & Social Services", "Community Policing Centre"],
    ["Social Participation and Inclusion", "Community & Social Services", "Chinese Community Policing Centre"],
    ["Social Participation and Inclusion", "Community & Social Services", "West End Coal Harbour community policing centre"],
    ["Social Participation and Inclusion", "Community & Social Services", "Community & Social Services"],
    ["Social Participation and Inclusion", "Community & Social Services", "Community Services Access Point Society"],
    ["Social Participation and Inclusion", "Community & Social Services", "Community Affordable Groceries"],
    ["Social Participation and Inclusion", "Community & Social Services", "Directions Youth Resource Centre"],
    ["Social Participation and Inclusion", "Community & Social Services", "Elizabeth Fry Society"],
    ["Social Participation and Inclusion", "Community & Social Services", "Youth Centre"],
    ["Social Participation and Inclusion", "Community & Social Services", "Muslim Care Centre"],
    ["Social Participation and Inclusion", "Community & Social Services", "Muslim Food Bank"],
    ["Social Participation and Inclusion", "Community & Social Services", "Pace Society Office"],
    ["Social Participation and Inclusion", "Community & Social Services", "QMUNITY BC's Queer Resource"],
    ["Social Participation and Inclusion", "Community & Social Services", "SUCCESS"],
    ["Social Participation and Inclusion", "Community & Social Services", "SUCCESS social service centre"],
    ["Social Participation and Inclusion", "Community & Social Services", "Vancouver Women's Health Collective"],
    ["Social Participation and Inclusion", "Community & Social Services", "Vancouver Native Housing Society"],
    ["Social Participation and Inclusion", "Community & Social Services", "BC Indigenous Housing Society"],
    ["Social Participation and Inclusion", "Community & Social Services", "Indigenous Innovations YVR"],
    ["Social Participation and Inclusion", "Community & Social Services", "Neighbourhood Housing Society"],
    ["Social Participation and Inclusion", "Community & Social Services", "Chinese national league of Canada"],
    ["Social Participation and Inclusion", "Community & Social Services", "Hastings Crossing BIA"],
    ["Social Participation and Inclusion", "Community & Social Services", "Vancouver Chinatown BIA Society"],

    // --- Vacant (kept as its own domain so it can be excluded from default views) ---
    ["Vacant", "Vacant", "Vacant"],
  ];

  // Storefronts API publishes `Sub_Category` strings that are *usually*
  // identical to the canonical Amenity. This table normalizes the exceptions
  // (typos, plural/singular drift, deli-style names that roll up to a broader
  // amenity, etc.). Add new aliases here as the API surfaces them.
  const SUB_CATEGORY_ALIASES = {
    // Typos in the source data
    "Perosnal & Household Services": "Beauty & Wellness",
    "Elementry School": "Elementary School",
    "Highschool": "High School",

    // Personal & Household Services in the API is too broad — in the curated
    // data it always lands under Beauty & Wellness when the row is a salon.
    "Personal & Household Services": "Beauty & Wellness",

    // Specialty food shops roll up to Produce Store in the curated taxonomy.
    "Gourmet Grocery Store": "Produce Store",
    "Gourmet Produce": "Produce Store",
    "Meat Shop": "Produce Store",
    "Italian Deli Food": "Produce Store",
    "European Deli": "Produce Store",

    // Bakery sub-types roll up to Bakery & Cafe.
    "Bakery": "Bakery & Cafe",
    "Cafe": "Bakery & Cafe",
    "Pastries": "Bakery & Cafe",

    // Plural/singular drift
    "Financial Advisor": "Financial Advisors",
    "Insurance Advisor": "Insurance Company",
    "Real Estate Services": "Real Estate Service",
    "Courier Companies": "Courier Company",
    "Labs": "Lab",

    // Some API rows say "Beauty & Health" — same intent as Beauty & Wellness.
    "Beauty & Health": "Beauty & Wellness",
  };

  // For datasets where every record maps to the same Amenity, name it here.
  // `null` means "varies — defer to the storefront classifier or a per-loader
  // override".
  const DATASET_AMENITY = {
    "storefronts-inventory": null,
    "libraries": "Library",
    "community-centres": "Community Centre",
    "public-washrooms": "Public Washroom",
    "drinking-fountains": "Water Fountain",
    "parks-polygon-representation": "Green Space",
    "public-art": "Public Art",
    "cultural-spaces": "Art & Cultural Space",
    // Datasets the user listed in the All Amenities export but that are not
    // yet wired into js/data.js — adding a loader is enough to surface them.
    "non-market-housing-rental-stock": "Non-market Housing",
    "homeless-shelter-locations": "Shelter",
    "disability-parking": "Disability Parking",
    "fire-halls": "Fire Hall",
    "community-gardens-and-food-trees": "Community Garden",
    "schools": null, // school type comes from the dataset's own field
  };

  // ---------- Indexing ----------
  const amenityIndex = {};
  const domainIndex = {};
  for (const [domain, subdomain, amenity] of TRIPLES) {
    amenityIndex[amenity] = { domain, subdomain, amenity };
    if (!domainIndex[domain]) domainIndex[domain] = {};
    if (!domainIndex[domain][subdomain]) domainIndex[domain][subdomain] = [];
    if (!domainIndex[domain][subdomain].includes(amenity)) {
      domainIndex[domain][subdomain].push(amenity);
    }
  }

  function canonicalAmenity(name) {
    if (!name) return null;
    const trimmed = String(name).trim();
    if (!trimmed) return null;
    return SUB_CATEGORY_ALIASES[trimmed] || trimmed;
  }

  function lookupByAmenity(name) {
    const canon = canonicalAmenity(name);
    return canon ? amenityIndex[canon] || null : null;
  }

  function defaultForDataset(slug) {
    if (!slug) return null;
    const name = DATASET_AMENITY[slug];
    return name ? lookupByAmenity(name) : null;
  }

  function amenitiesOf(subdomain) {
    for (const d of Object.keys(domainIndex)) {
      if (domainIndex[d][subdomain]) return domainIndex[d][subdomain].slice();
    }
    return [];
  }

  function subdomainsOf(domain) {
    return Object.keys(domainIndex[domain] || {});
  }

  function allDomains() {
    return Object.keys(domainIndex);
  }

  return {
    TRIPLES,
    SUB_CATEGORY_ALIASES,
    DATASET_AMENITY,
    lookupByAmenity,
    defaultForDataset,
    amenitiesOf,
    subdomainsOf,
    allDomains,
    canonicalAmenity,
  };
})();
