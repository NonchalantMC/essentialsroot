// client/src/utils/deliveryZones.js
// Keep this file in sync with server/utils/deliveryZones.js

export const DELIVERY_ZONES = {
  zone1: {
    fee: 5000, label: "Kampala Zone 1 — Central", km: "0–6 km", eta: "1–2 hrs",
    areas: ["nakawa","naguru","mbuya","bugolobi","kyambogo","kinawataka","kitintale","ntinda","luzira","kololo","kampala central","cbd","portbell","mutungo","bukoto","kamwokya","nakasero"]
  },
  zone2: {
    fee: 7000, label: "Kampala Zone 2 — Near Suburbs", km: "7–12 km", eta: "1–3 hrs",
    areas: ["kisaasi","wandegeya","naalya","najjera","mulago","makerere","nsambya","katwe","buziga","mengo","namirembe","bwaise","nakulabye","muyenga","kabalagala","rubaga","lubaga","kawempe","makindye","kyaliwajjala","kira town","lungujja","ggaba","muyonyo","bweyogerere","nateete","bunga","kansanga"]
  },
  zone3: {
    fee: 10000, label: "Kampala Zone 3 — Mid Distance", km: "13–15 km", eta: "2–4 hrs",
    areas: ["seeta","namugongo","busega","nsangi","lubowa","zana","namasuba","kitende"]
  },
  zone4: {
    fee: 12000, label: "Kampala Zone 4 — Outer Suburbs", km: "14–19 km", eta: "3–5 hrs",
    areas: ["kira","mukono","kasangati","bulindo","mulawa"]
  },
  zone5: {
    fee: 15000, label: "Kampala Zone 5 — Far / Peri-urban", km: "20+ km", eta: "Same/next day",
    areas: ["gayaza","wakiso","buloba","matugga","kajjansi","kigo","entebbe"]
  }
};

// Reverse lookup built once at module load: area name -> zone.
// First zone to claim an area wins (matters only for the couple of areas
// still duplicated across zones — see the note you're handling separately).
const AREA_TO_ZONE = {};
for (const zone of Object.values(DELIVERY_ZONES)) {
  for (const area of zone.areas) {
    if (!(area in AREA_TO_ZONE)) AREA_TO_ZONE[area] = zone;
  }
}

export function getDeliveryFee(cityInput, subtotal) {
  if (!cityInput || cityInput.trim().length < 2) {
    return { fee: 0, label: "Waiting for area...", eta: "—", isEstimated: true, isValid: false };
  }

  const zone = AREA_TO_ZONE[cityInput.toLowerCase().trim()];

  // The dropdown only ever sends a value straight out of DELIVERY_ZONES, so
  // this branch means the value was tampered with, or the town list drifted
  // out of sync — not a case to guess a fee for.
  if (!zone) {
    return { fee: 0, label: "Please select a valid town", eta: "—", isEstimated: true, isValid: false };
  }

  return { fee: zone.fee, label: zone.label, eta: zone.eta, isEstimated: false, isValid: true };
}
