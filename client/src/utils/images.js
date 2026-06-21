export const PRODUCT_IMAGES = {
  'classic-pump-heels': [
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=85&fit=crop',
    'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800&q=85&fit=crop',
    'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=800&q=85&fit=crop',
  ],
  'white-leather-sneakers': [
    'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&q=85&fit=crop',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85&fit=crop',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=85&fit=crop',
  ],
  'suede-ankle-boots': [
    'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&q=85&fit=crop',
    'https://images.unsplash.com/photo-1511956861703-a6f3f3849182?w=800&q=85&fit=crop',
  ],
  'strappy-heeled-sandals': [
    'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=800&q=85&fit=crop',
    'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800&q=85&fit=crop',
  ],
  'leather-ballet-flats': [
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&q=85&fit=crop',
  ],
  'abstract-canvas-wall-art': [
    'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&q=85&fit=crop',
    'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&q=85&fit=crop',
  ],
  'ceramic-vase-set': [
    'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800&q=85&fit=crop',
    'https://images.unsplash.com/photo-1602872030490-4a484a7b3ba6?w=800&q=85&fit=crop',
  ],
  'boho-cushion-covers': [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=85&fit=crop',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=85&fit=crop',
  ],
  'modern-arc-floor-lamp': [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85&fit=crop',
  ],
  'macrame-plant-hanger': [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85&fit=crop',
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=85&fit=crop',
  ],
};

export const COLLECTION_IMAGES = {
  officeChic:   'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=600&q=85&fit=crop',
  bohoHome:     'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&q=85&fit=crop',
  weekendVibes: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=85&fit=crop',
  partySeason:  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=85&fit=crop',
};

export const getProductImage = (slug, index = 0) => {
  const imgs = PRODUCT_IMAGES[slug];
  return (imgs && imgs[index]) || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600&q=80&fit=crop';
};
