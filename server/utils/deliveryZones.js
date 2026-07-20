// server/utils/deliveryZones.js

const DELIVERY_ZONES = {
  zone1: { fee: 5000, label: "Kampala Zone 1 — Central", areas: ["nakawa","naguru","mbuya","bugolobi","kyambogo","kinawataka","kitintale","ntinda","luzira","kololo","kampala central","cbd","portbell","mutungo","bukoto","kamwokya","nakasero"] },
  zone2: { fee: 7000, label: "Kampala Zone 2 — Near Suburbs", areas: ["kisaasi","wandegeya","naalya","najjera","mulago","makerere","nsambya","katwe","buziga","mengo","namirembe","bwaise","nakulabye","muyenga","kabalagala","rubaga","lubaga","kawempe","makindye","kyaliwajjala","kira town","lungujja","ggaba","muyonyo","nateete","bweyogerere","bunga", "kansanga"] },
  zone3: { fee: 10000, label: "Kampala Zone 3 — Mid Distance", areas: ["seeta","namugongo","busega","nsangi","lubowa","zana","namasuba","kitende","nateete"] },
  zone4: { fee: 12000, label: "Kampala Zone 4 — Outer Suburbs", areas: ["kira","mukono","kasangati","bulindo","mulawa"] },
  zone5: { fee: 15000, label: "Kampala Zone 5 — Far / Peri-urban", areas: ["gayaza","wakiso","buloba","matugga","kajjansi","kigo","entebbe"] }
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

function calculateServerDeliveryFee(cityInput, subtotal) {
  // No cityInput at all — nothing to look up, so this is invalid rather
  // than a fallback fee. Caller must reject the order in this case.
  if (!cityInput) return { fee: null, label: null, isValid: false };

  const zone = AREA_TO_ZONE[cityInput.toLowerCase().trim()];

  // The client only ever sends a town chosen from this same zone list, so
  // an unmatched value here means the request bypassed the UI (or the two
  // zone files drifted out of sync). Reject rather than guess a fee.
  if (!zone) return { fee: null, label: null, isValid: false };

  return { fee: zone.fee, label: zone.label, isValid: true };
}

module.exports = { calculateServerDeliveryFee };
