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
 *
 * `icon` holds an inline SVG string (Lucide-style, 24×24, currentColor stroke)
 * that the map markers and sidebar list both render. Inline SVG was chosen
 * over an icon font because it scales cleanly at every zoom and inherits the
 * brand colour palette via `currentColor`.
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
  };

  function svgIcon(inner, opts = {}) {
    const stroke = opts.stroke || 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  }

  const groups = [
    {
      id: "healthcare",
      label: "Clinics & Health",
      icon: svgIcon(I.heart),
      color: "#c62828",
      sources: [{ dataset: STOREFRONTS, subCategories: [
        "Clinic", "Doctor", "Health & Wellness", "Health & Social Services",
        "Lab", "Labs", "Beauty & Health",
        "Three Bridges Community Health Centre",
      ]}],
    },
    {
      id: "pharmacy",
      label: "Pharmacies",
      icon: svgIcon(I.pill),
      color: "#1e8a3a",
      sources: [{ dataset: STOREFRONTS, subCategories: ["Pharmacy"] }],
    },
    {
      id: "dental-vision",
      label: "Dentists & Optometrists",
      icon: svgIcon(I.tooth),
      color: "#0e7287",
      sources: [{ dataset: STOREFRONTS, subCategories: ["Dentist", "Optometry"] }],
    },
    {
      id: "groceries",
      label: "Groceries",
      icon: svgIcon(I.cart),
      color: "#558b2f",
      sources: [{ dataset: STOREFRONTS, subCategories: [
        "Grocery Store", "Gourmet Grocery Store", "Supermarket",
        "Convenience Store", "Produce Store", "Gourmet Produce",
        "Meat Shop", "Italian Deli Food", "European Deli",
      ]}],
    },
    {
      id: "cafes",
      label: "Bakeries & Cafés",
      icon: svgIcon(I.coffee),
      color: "#8d6e63",
      sources: [{ dataset: STOREFRONTS, subCategories: [
        "Bakery & Cafe", "Bakery", "Cafe", "Pastries",
      ]}],
    },
    {
      id: "banking",
      label: "Banks",
      icon: svgIcon(I.bank),
      color: "#5d4037",
      sources: [{ dataset: STOREFRONTS, subCategories: [
        "Bank", "Financial Advisor", "Financial Advisors", "Currency Exchange",
      ]}],
    },
    {
      id: "personal-services",
      label: "Personal Services",
      icon: svgIcon(I.scissors),
      color: "#6a1b9a",
      sources: [{ dataset: STOREFRONTS, subCategories: [
        "Personal & Household Services",
        "Perosnal & Household Services",
        "Beauty & Wellness", "Tax Services", "Notary",
        "Insurance Company", "Insurance Advisor",
        "Real Estate Services", "Real Estate Service",
        "Courier Company", "Courier Companies",
      ]}],
    },
    {
      id: "community-centres",
      label: "Community Centres",
      icon: svgIcon(I.landmark),
      color: "#0277bd",
      sources: [{ dataset: "community-centres" }],
    },
    {
      id: "libraries",
      label: "Libraries",
      icon: svgIcon(I.book),
      color: "#283593",
      sources: [{ dataset: "libraries" }],
    },
    {
      id: "washrooms",
      label: "Public Washrooms",
      icon: svgIcon(I.toilet),
      color: "#00838f",
      sources: [{ dataset: "public-washrooms" }],
    },
    {
      id: "parks",
      label: "Parks",
      icon: svgIcon(I.tree),
      color: "#1e8a3a",
      sources: [{ dataset: "parks-polygon-representation" }],
    },
    {
      id: "drinking-fountains",
      label: "Drinking Fountains",
      icon: svgIcon(I.droplet),
      color: "#0e7287",
      sources: [{ dataset: "drinking-fountains" }],
    },
    {
      id: "cultural-spaces",
      label: "Cultural Spaces",
      icon: svgIcon(I.palette),
      color: "#ad1457",
      sources: [{ dataset: "cultural-spaces" }],
    },
    {
      id: "public-art",
      label: "Public Art",
      icon: svgIcon(I.image),
      color: "#b76e0e",
      sources: [{ dataset: "public-art" }],
    },
  ];

  const byId = Object.fromEntries(groups.map((g) => [g.id, g]));

  function classifyStorefront(record) {
    const sub = (record.sub_category || record.sub_category1 || "").trim();
    if (!sub || sub === "Vacant") return null;
    for (const group of groups) {
      const storefrontSource = group.sources.find((s) => s.dataset === STOREFRONTS);
      if (!storefrontSource) continue;
      if (storefrontSource.subCategories.includes(sub)) return group.id;
    }
    return null;
  }

  return { groups, byId, classifyStorefront, STOREFRONTS };
})();
