// server/utils/deliveryZones.js

const DELIVERY_ZONES = {
  zone1: { fee: 5000, label: "Zone 1 — Central", areas: ["nakawa","naguru","mbuya","bugolobi","kyambogo","kinawataka","kitintale","ntinda","luzira","kololo","kampala central","cbd","portbell","mutungo","bukoto","kamwokya","nakasero"] },
  zone2: { fee: 7000, label: "Zone 2 — Near Suburbs", areas: ["kisaasi","wandegeya","naalya","najjera","mulago","makerere","nsambya","katwe","buziga","mengo","namirembe","bwaise","nakulabye","muyenga","kabalagala","rubaga","lubaga","kawempe","makindye","kyaliwajjala","kira town","lungujja","ggaba","muyonyo","bweyogerere","nateete","bweyogerere","bunga", "kansanga"] },
  zone3: { fee: 10000, label: "Zone 3 — Mid Distance", areas: ["seeta","namugongo","busega","nsangi","lubowa","zana","namasuba","kitende","nateete","busega"] },
  zone4: { fee: 12000, label: "Zone 4 — Outer Suburbs", areas: ["kira","mukono","kasangati","bulindo","mulawa"] },
  zone5: { fee: 15000, label: "Zone 5 — Far / Peri-urban", areas: ["gayaza","wakiso","buloba","matugga","kajjansi","kigo","entebbe"] }
};

function calculateServerDeliveryFee(cityInput, subtotal) {
  if (!cityInput) return { fee: 7000, label: "Zone 2 (Fallback)" };

  const q = cityInput.toLowerCase().trim();
  const qWords = q.split(/\s+/);

  let bestMatch = null;

  for (const [key, zone] of Object.entries(DELIVERY_ZONES)) {
    for (const area of zone.areas) {
      const isMatch = q === area || q.includes(area) || qWords.includes(area);
      if (isMatch && (!bestMatch || area.length > bestMatch.area.length)) {
        bestMatch = { zone, key, area };
      }
    }
  }

  if (!bestMatch) return { fee: 7000, label: "Zone 2 (Fallback)" };

  const { zone, key } = bestMatch;
  if (subtotal >= 200000) return { fee: 0, label: `${zone.label} (Free)` };
  if (subtotal >= 100000 && (key === 'zone1' || key === 'zone2')) {
    return { fee: 0, label: `${zone.label} (Free)` };
  }

  return { fee: zone.fee, label: zone.label };
}

module.exports = { calculateServerDeliveryFee };