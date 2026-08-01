/**
 * deliveryZones.js
 * -----------------
 * Two-level delivery zone structure for Essentials256 / Trading Point.
 *
 * LEVEL 1 (first dropdown)  -> "region" key, e.g. "kampala", "arua", "gulu"
 * LEVEL 2 (second dropdown) -> "area" key inside that region's `areas` object
 *
 * Every area carries its own delivery fee. For Kampala, the old zone1-zone5
 * fees have been preserved per-area (so Nakawa is still 5,000 and Gayaza is
 * still 15,000 etc.) — only the UX grouping changed, not the pricing logic.
 *
 * Upcountry towns are flat UGX 15,000 with a single area (the town itself),
 * so the second dropdown for those can either be skipped in the UI or just
 * show one option — the data shape stays consistent either way.
 */

const deliveryZones = {

  // ---------------------------------------------------------------------
  // KAMPALA — one region, many areas, each with its own fee
  // ---------------------------------------------------------------------
  kampala: {
    label: "Kampala",
    areas: {
      // --- formerly Zone 1 — Central (5,000 | 0–6 km | 1–2 hrs) ---
      "nakawa":         { fee: 5000, km: "0–6 km",  eta: "1–2 hrs" },
      "naguru":         { fee: 5000, km: "0–6 km",  eta: "1–2 hrs" },
      "mbuya":          { fee: 5000, km: "0–6 km",  eta: "1–2 hrs" },
      "bugolobi":       { fee: 5000, km: "0–6 km",  eta: "1–2 hrs" },
      "kyambogo":       { fee: 5000, km: "0–6 km",  eta: "1–2 hrs" },
      "kinawataka":     { fee: 5000, km: "0–6 km",  eta: "1–2 hrs" },
      "kitintale":      { fee: 5000, km: "0–6 km",  eta: "1–2 hrs" },
      "ntinda":         { fee: 5000, km: "0–6 km",  eta: "1–2 hrs" },
      "luzira":         { fee: 5000, km: "0–6 km",  eta: "1–2 hrs" },
      "kololo":         { fee: 5000, km: "0–6 km",  eta: "1–2 hrs" },
      "kampala central":{ fee: 5000, km: "0–6 km",  eta: "1–2 hrs" },
      "cbd":            { fee: 5000, km: "0–6 km",  eta: "1–2 hrs" },
      "portbell":       { fee: 5000, km: "0–6 km",  eta: "1–2 hrs" },
      "mutungo":        { fee: 5000, km: "0–6 km",  eta: "1–2 hrs" },
      "bukoto":         { fee: 5000, km: "0–6 km",  eta: "1–2 hrs" },
      "kamwokya":       { fee: 5000, km: "0–6 km",  eta: "1–2 hrs" },
      "nakasero":       { fee: 5000, km: "0–6 km",  eta: "1–2 hrs" },

      // --- formerly Zone 2 — Near Suburbs (7,000 | 7–12 km | 1–3 hrs) ---
      "kisaasi":        { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "wandegeya":      { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "naalya":         { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "najjera":        { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "mulago":         { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "makerere":       { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "nsambya":        { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "katwe":          { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "buziga":         { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "mengo":          { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "namirembe":      { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "bwaise":         { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "nakulabye":      { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "muyenga":        { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "kabalagala":     { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "rubaga":         { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "lubaga":         { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "kawempe":        { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "makindye":       { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "kyaliwajjala":   { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "kira town":      { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "lungujja":       { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "ggaba":          { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "muyonyo":        { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "bweyogerere":    { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "nateete":        { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "bunga":          { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },
      "kansanga":       { fee: 7000, km: "7–12 km", eta: "1–3 hrs" },

      // --- formerly Zone 3 — Mid Distance (10,000 | 13–15 km | 2–4 hrs) ---
      "seeta":          { fee: 10000, km: "13–15 km", eta: "2–4 hrs" },
      "namugongo":      { fee: 10000, km: "13–15 km", eta: "2–4 hrs" },
      "busega":         { fee: 10000, km: "13–15 km", eta: "2–4 hrs" },
      "nsangi":         { fee: 10000, km: "13–15 km", eta: "2–4 hrs" },
      "lubowa":         { fee: 10000, km: "13–15 km", eta: "2–4 hrs" },
      "zana":           { fee: 10000, km: "13–15 km", eta: "2–4 hrs" },
      "namasuba":       { fee: 10000, km: "13–15 km", eta: "2–4 hrs" },
      "kitende":        { fee: 10000, km: "13–15 km", eta: "2–4 hrs" },

      // --- formerly Zone 4 — Outer Suburbs (12,000 | 14–19 km | 3–5 hrs) ---
      "kira":           { fee: 12000, km: "14–19 km", eta: "3–5 hrs" },
      "mukono":         { fee: 12000, km: "14–19 km", eta: "3–5 hrs" },
      "kasangati":      { fee: 12000, km: "14–19 km", eta: "3–5 hrs" },
      "bulindo":        { fee: 12000, km: "14–19 km", eta: "3–5 hrs" },
      "mulawa":         { fee: 12000, km: "14–19 km", eta: "3–5 hrs" },

      // --- formerly Zone 5 — Far / Peri-urban (15,000 | 20+ km | Same/next day) ---
      "gayaza":         { fee: 15000, km: "20+ km", eta: "Same/next day" },
      "wakiso":         { fee: 15000, km: "20+ km", eta: "Same/next day" },
      "buloba":         { fee: 15000, km: "20+ km", eta: "Same/next day" },
      "matugga":        { fee: 15000, km: "20+ km", eta: "Same/next day" },
      "kajjansi":       { fee: 15000, km: "20+ km", eta: "Same/next day" },
      "kigo":           { fee: 15000, km: "20+ km", eta: "Same/next day" },
      "entebbe":        { fee: 15000, km: "20+ km", eta: "Same/next day" },
    }
  },

  // ---------------------------------------------------------------------
  // UPCOUNTRY — flat UGX 15,000 each, single area = the town itself
  // ---------------------------------------------------------------------
  arua:       { label: "Arua",        areas: { "arua":        { fee: 15000, eta: "Same/next day" } } },
  lira:       { label: "Lira",        areas: { "lira":        { fee: 15000, eta: "Same/next day" } } },
  gulu:       { label: "Gulu",        areas: { "gulu":        { fee: 15000, eta: "Same/next day" } } },
  mbarara:    { label: "Mbarara",     areas: { "mbarara":     { fee: 15000, eta: "Same/next day" } } },
  jinja:      { label: "Jinja",       areas: { "jinja":       { fee: 15000, eta: "Same/next day" } } },
  mbale:      { label: "Mbale",       areas: { "mbale":       { fee: 15000, eta: "Same/next day" } } },
  soroti:     { label: "Soroti",      areas: { "soroti":      { fee: 15000, eta: "Same/next day" } } },
  fortportal: { label: "Fort Portal", areas: { "fort portal": { fee: 15000, eta: "Same/next day" } } },
};

// Reverse lookup built once at module load: area name -> { fee, eta, label,
// regionKey }. Object keys within a region are inherently unique, so unlike
// the old flat zone1-zone5 arrays, there's no possibility of the same area
// silently existing in two places (that used to happen with "nateete").
const AREA_INDEX = {};
for (const [regionKey, region] of Object.entries(deliveryZones)) {
  const areaEntries = Object.entries(region.areas);
  const isSingleAreaRegion = areaEntries.length === 1;
  for (const [areaKey, area] of areaEntries) {
    AREA_INDEX[areaKey] = {
      fee:       area.fee,
      eta:       area.eta,
      regionKey,
      // Upcountry regions have exactly one area (the town itself), so just
      // show the region label. Kampala's areas are real sub-choices, so show
      // both, e.g. "Kampala — Ntinda". Checking area count rather than
      // string-matching regionKey === areaKey, since that breaks the moment
      // a region's key and area name aren't spelled identically (e.g.
      // "fortportal" the key vs "fort portal" the area name).
      label: isSingleAreaRegion
        ? region.label
        : `${region.label} — ${areaKey.replace(/\b\w/g, c => c.toUpperCase())}`,
    };
  }
}

function calculateServerDeliveryFee(cityInput, subtotal) {
  // No cityInput at all — nothing to look up, so this is invalid rather
  // than a fallback fee. Caller must reject the order in this case.
  if (!cityInput) return { fee: null, label: null, isValid: false };

  const match = AREA_INDEX[cityInput.toLowerCase().trim()];

  // The client only ever sends a town chosen from this same zone list, so
  // an unmatched value here means the request bypassed the UI (or the two
  // zone files drifted out of sync). Reject rather than guess a fee.
  if (!match) return { fee: null, label: null, isValid: false };

  return { fee: match.fee, label: match.label, isValid: true };
}

module.exports = { calculateServerDeliveryFee, deliveryZones };
