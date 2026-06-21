// server/utils/deliveryZones.js

const DELIVERY_ZONES = {
  zone1: { fee: 5000, label: "Zone 1 — Central", areas: ["nakawa","naguru","mbuya","bugolobi","kyambogo","kinawataka","kitintale","ntinda","luzira","kololo","kampala central","cbd","portbell","mutungo","bukoto","kamwokya","nakasero"] },
  zone2: { fee: 7000, label: "Zone 2 — Near Suburbs", areas: ["kisaasi","wandegeya","naalya","najjera","mulago","makerere","nsambya","katwe","buziga","mengo","namirembe","bwaise","nakulabye","muyenga","kabalagala","rubaga","lubaga","kawempe","makindye","kyaliwajjala","kira town","lungujja","ggaba","muyonyo","bweyogerere","nateete"] },
  zone3: { fee: 10000, label: "Zone 3 — Mid Distance", areas: ["seeta","namugongo","busega","nsangi"] },
  zone4: { fee: 12000, label: "Zone 4 — Outer Suburbs", areas: ["kira","mukono","kasangati"] },
  zone5: { fee: 15000, label: "Zone 5 — Far / Peri-urban", areas: ["gayaza","wakiso","buloba","matugga","kajjansi","kigo","entebbe"] }
};

function calculateServerDeliveryFee(cityInput, subtotal) {
  if (!cityInput) return { fee: 7000, label: "Zone 2 (Fallback)" };

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

  if (!matchedZone) return { fee: 7000, label: "Zone 2 (Fallback)" };

  if (subtotal >= 200000) return { fee: 0, label: `${matchedZone.label} (Free)` };
  if (subtotal >= 100000 && (matchedKey === 'zone1' || matchedKey === 'zone2')) {
    return { fee: 0, label: `${matchedZone.label} (Free)` };
  }

  return { fee: matchedZone.fee, label: matchedZone.label };
}

module.exports = { calculateServerDeliveryFee };