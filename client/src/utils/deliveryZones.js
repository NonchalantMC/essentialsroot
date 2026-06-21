// client/src/utils/deliveryZones.js

export const DELIVERY_ZONES = {
  zone1: {
    fee: 5000, label: "Zone 1 — Central", km: "0–6 km", eta: "1–2 hrs",
    areas: ["nakawa","naguru","mbuya","bugolobi","kyambogo","kinawataka","kitintale","ntinda","luzira","kololo","kampala central","cbd","portbell","mutungo","bukoto","kamwokya","nakasero"]
  },
  zone2: {
    fee: 7000, label: "Zone 2 — Near Suburbs", km: "7–12 km", eta: "1–3 hrs",
    areas: ["kisaasi","wandegeya","naalya","najjera","mulago","makerere","nsambya","katwe","buziga","mengo","namirembe","bwaise","nakulabye","muyenga","kabalagala","rubaga","lubaga","kawempe","makindye","kyaliwajjala","kira town","lungujja","ggaba","muyonyo","bweyogerere","nateete"]
  },
  zone3: {
    fee: 10000, label: "Zone 3 — Mid Distance", km: "13–15 km", eta: "2–4 hrs",
    areas: ["seeta","namugongo","busega","nsangi"]
  },
  zone4: {
    fee: 12000, label: "Zone 4 — Outer Suburbs", km: "14–19 km", eta: "3–5 hrs",
    areas: ["kira","mukono","kasangati"]
  },
  zone5: {
    fee: 15000, label: "Zone 5 — Far / Peri-urban", km: "20+ km", eta: "Same/next day",
    areas: ["gayaza","wakiso","buloba","matugga","kajjansi","kigo","entebbe"]
  }
};

export function getDeliveryFee(cityInput, subtotal) {
  if (!cityInput || cityInput.trim().length < 2) {
    return { fee: 0, label: "Waiting for area...", eta: "—", isEstimated: true };
  }

  const q = cityInput.toLowerCase().trim();
  let matchedZone = null;
  let matchedKey = null;

  for (const [key, zone] of Object.entries(DELIVERY_ZONES)) {
    if (zone.areas.some(a => q.includes(a) || a.includes(q.split(" ")[0]))) {
      matchedZone = zone;
      matchedKey = key;
      break;
    }
  }

  // Fallback if area text matches nothing yet
  if (!matchedZone) {
    return { fee: 7000, label: "Zone 2 (Unlisted Area Fallback)", eta: "1–3 hrs", isEstimated: true };
  }

  // Evaluate Free Delivery Thresholds
  if (subtotal >= 200000) {
    return { fee: 0, label: `${matchedZone.label} (Free Delivery Promo 🎉)`, eta: matchedZone.eta, isEstimated: false };
  } 
  
  if (subtotal >= 100000 && (matchedKey === 'zone1' || matchedKey === 'zone2')) {
    return { fee: 0, label: `${matchedZone.label} (Free Delivery Promo 🎉)`, eta: matchedZone.eta, isEstimated: false };
  }

  return { fee: matchedZone.fee, label: matchedZone.label, eta: matchedZone.eta, isEstimated: false };
}