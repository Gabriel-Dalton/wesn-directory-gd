/**
 * Category configuration for the WESN Vancouver Amenities Map.
 *
 * `groups` defines what users see in the sidebar — senior-relevant amenity
 * groupings. Each group maps to either:
 *   - a list of `subCategories` from the storefront dataset, OR
 *   - a separate Vancouver Open Data dataset (`dataset` field), OR
 *   - both (for groups that combine sources).
 *
 * Order in the array is the order shown in the sidebar.
 */
window.AmenityCategories = (function () {
  const STOREFRONTS = "storefronts-inventory";

  const groups = [
    {
      id: "healthcare",
      label: "Clinics & Health",
      icon: "🏥",
      color: "#c62828",
      sources: [
        {
          dataset: STOREFRONTS,
          subCategories: [
            "Clinic",
            "Doctor",
            "Health & Wellness",
            "Health & Social Services",
            "Lab",
            "Labs",
            "Beauty & Health",
            "Three Bridges Community Health Centre",
          ],
        },
      ],
    },
    {
      id: "pharmacy",
      label: "Pharmacies",
      icon: "💊",
      color: "#2e7d32",
      sources: [
        {
          dataset: STOREFRONTS,
          subCategories: ["Pharmacy"],
        },
      ],
    },
    {
      id: "dental-vision",
      label: "Dentists & Optometrists",
      icon: "🦷",
      color: "#1565c0",
      sources: [
        {
          dataset: STOREFRONTS,
          subCategories: ["Dentist", "Optometry"],
        },
      ],
    },
    {
      id: "groceries",
      label: "Grocery & Supermarkets",
      icon: "🛒",
      color: "#558b2f",
      sources: [
        {
          dataset: STOREFRONTS,
          subCategories: [
            "Grocery Store",
            "Gourmet Grocery Store",
            "Supermarket",
            "Convenience Store",
            "Produce Store",
            "Gourmet Produce",
            "Meat Shop",
            "Italian Deli Food",
            "European Deli",
          ],
        },
      ],
    },
    {
      id: "cafes",
      label: "Bakeries & Cafés",
      icon: "🥐",
      color: "#8d6e63",
      sources: [
        {
          dataset: STOREFRONTS,
          subCategories: ["Bakery & Cafe", "Bakery", "Cafe", "Pastries"],
        },
      ],
    },
    {
      id: "banking",
      label: "Banks & Money Services",
      icon: "🏦",
      color: "#5d4037",
      sources: [
        {
          dataset: STOREFRONTS,
          subCategories: [
            "Bank",
            "Financial Advisor",
            "Financial Advisors",
            "Currency Exchange",
          ],
        },
      ],
    },
    {
      id: "personal-services",
      label: "Personal Services",
      icon: "✂️",
      color: "#6a1b9a",
      sources: [
        {
          dataset: STOREFRONTS,
          subCategories: [
            "Personal & Household Services",
            "Perosnal & Household Services", // typo present in source data
            "Beauty & Wellness",
            "Tax Services",
            "Notary",
            "Insurance Company",
            "Insurance Advisor",
            "Real Estate Services",
            "Real Estate Service",
            "Courier Company",
            "Courier Companies",
          ],
        },
      ],
    },
    {
      id: "community-centres",
      label: "Community Centres",
      icon: "🏛️",
      color: "#0277bd",
      sources: [
        { dataset: "community-centres" },
      ],
    },
    {
      id: "libraries",
      label: "Public Libraries",
      icon: "📚",
      color: "#283593",
      sources: [
        { dataset: "libraries" },
      ],
    },
    {
      id: "washrooms",
      label: "Public Washrooms",
      icon: "🚻",
      color: "#00838f",
      sources: [
        { dataset: "public-washrooms" },
      ],
    },
    {
      id: "parks",
      label: "Parks",
      icon: "🌳",
      color: "#2e7d32",
      sources: [
        { dataset: "parks-polygon-representation" },
      ],
    },
  ];

  /** Quick lookup by id. */
  const byId = Object.fromEntries(groups.map((g) => [g.id, g]));

  /**
   * Given a storefront record, return the matching group id (or null).
   * The storefront dataset uses `sub_category` as the most specific label.
   */
  function classifyStorefront(record) {
    const sub = (record.sub_category || record.sub_category1 || "").trim();
    if (!sub || sub === "Vacant") return null;

    for (const group of groups) {
      const storefrontSource = group.sources.find(
        (s) => s.dataset === STOREFRONTS
      );
      if (!storefrontSource) continue;
      if (storefrontSource.subCategories.includes(sub)) return group.id;
    }
    return null;
  }

  return { groups, byId, classifyStorefront, STOREFRONTS };
})();
