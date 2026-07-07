/**
 * Essentials256 — Firestore Seed Script (essentials-main)
 *
 * Run from inside the server/ folder:
 * node utils/seed.js
 *
 * Schema matches exactly what the admin panel creates/reads.
 * Fields not managed by the admin (halfSizes, widths, lining, etc.)
 * are intentionally omitted — add them manually via the admin panel
 * if needed for specific products.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { db } = require('../config/firebase');

// ── Wipe a collection cleanly ─────────────────────────────────────────────────
async function deleteCollection(name, batchSize = 100) {
  const ref   = db.collection(name);
  const query = ref.limit(batchSize);
  return new Promise((resolve, reject) => {
    deleteBatch(query, resolve, reject);
  });
}

async function deleteBatch(query, resolve, reject) {
  try {
    const snap = await query.get();
    if (snap.size === 0) { resolve(); return; }
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    process.nextTick(() => deleteBatch(query, resolve, reject));
  } catch (err) { reject(err); }
}

// ── Seed ──────────────────────────────────────────────────────────────────────
const seed = async () => {
  console.log('🌱 Connecting to Firestore essentials-main...');

  console.log('🧹 Clearing existing collections...');
  await Promise.all([
    deleteCollection('users'),
    deleteCollection('products'),
    deleteCollection('orders'),
    deleteCollection('coupons'),
    deleteCollection('otps'),
    deleteCollection('couponRedemptions'),
  ]);

  // ── Passwords ──────────────────────────────────────────────────────────────
  console.log('🔐 Hashing passwords...');
  const adminHash    = await bcrypt.hash('Admin@123', 12);
  const customerHash = await bcrypt.hash('Customer@123', 12);

  // ── Stable IDs for cross-references ───────────────────────────────────────
  const adminId = db.collection('users').doc().id;
  const janeId  = db.collection('users').doc().id;
  const maryId  = db.collection('users').doc().id;
  const now     = new Date().toISOString();

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('👥 Creating users...');
  const userBatch = db.batch();

  userBatch.set(db.collection('users').doc(adminId), {
    name:         'Admin Essentials',
    email:        'admin@essentials256.com',
    passwordHash: adminHash,
    role:         'admin',
    phone:        '+256700000000',
    addresses:    [],
    preferences:  {},
    tokenVersion: 1, // Set to 1 for JWT revocation support
    createdAt:    now,
    updatedAt:    now,
  });

  userBatch.set(db.collection('users').doc(janeId), {
    name:         'Jane Doe',
    email:        'jane@example.com',
    passwordHash: customerHash,
    role:         'customer',
    phone:        '+256788123456',
    addresses:    [{
      city:      'Kampala',
      district:  'Central',
      country:   'Uganda',
      isDefault: true,
    }],
    preferences:  {},
    tokenVersion: 1, // Set to 1 for JWT revocation support
    createdAt:    now,
    updatedAt:    now,
  });

  userBatch.set(db.collection('users').doc(maryId), {
    name:         'Mary Smith',
    email:        'mary@example.com',
    passwordHash: customerHash,
    role:         'customer',
    phone:        '+256772987654',
    addresses:    [{
      city:      'Ntinda',
      district:  'Kampala',
      country:   'Uganda',
      isDefault: true,
    }],
    preferences:  {},
    tokenVersion: 1, // Set to 1 for JWT revocation support
    createdAt:    now,
    updatedAt:    now,
  });

  await userBatch.commit();

  // ── Products ───────────────────────────────────────────────────────────────
  console.log('🛍️ Creating products...');

  const products = [
    // ── Footwear ──────────────────────────────────────────────────────────
    {
      sku:              'E256-FW001',
      type:             'footwear',
      name:             'Classic Pump Heels',
      slug:             'classic-pump-heels',
      category:         'Heels',
      shortDescription: 'Timeless Italian leather stiletto pumps.',
      description:      'Timeless pointed-toe pumps with a 9cm stiletto heel. Crafted from premium Italian leather with cushioned insole for all-day elegance.',
      price:            145000,
      compareAtPrice:   195000,
      images:           [
        'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=85&fit=crop',
        'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800&q=85&fit=crop',
      ],
      stock:    15,
      featured: true,
      status:   'active',
      tags:     ['heels', 'formal', 'office', 'evening', 'bestseller'],
      footwearDetails: {
        sizes:      [36, 37, 38, 39, 40, 41],
        heelHeight: 9,
        material:   'Italian Leather',
        occasion:   ['Office', 'Evening', 'Formal'],
      },
      createdAt: now, updatedAt: now,
    },
    {
      sku:              'E256-FW002',
      type:             'footwear',
      name:             'White Leather Sneakers',
      slug:             'white-leather-sneakers',
      category:         'Sneakers',
      shortDescription: 'Clean minimal white leather sneakers.',
      description:      'Minimalist white leather sneakers with vulcanized sole. Versatile for casual outings or smart-casual office days.',
      price:            128000,
      compareAtPrice:   0,
      images:           [
        'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&q=85&fit=crop',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85&fit=crop',
      ],
      stock:    22,
      featured: true,
      status:   'active',
      tags:     ['sneakers', 'casual', 'white', 'minimal', 'new'],
      footwearDetails: {
        sizes:      [36, 37, 38, 39, 40, 41, 42],
        heelHeight: 2,
        material:   'Genuine Leather',
        occasion:   ['Casual', 'Office', 'Weekend'],
      },
      createdAt: now, updatedAt: now,
    },
    {
      sku:              'E256-FW003',
      type:             'footwear',
      name:             'Suede Ankle Boots',
      slug:             'suede-ankle-boots',
      category:         'Boots',
      shortDescription: 'Luxe block-heel suede ankle boots.',
      description:      'Soft suede ankle boots with block heel. Side zip closure and cushioned footbed. Perfect for cooler evenings.',
      price:            210000,
      compareAtPrice:   260000,
      images:           [
        'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&q=85&fit=crop',
      ],
      stock:    8,
      featured: false,
      status:   'active',
      tags:     ['boots', 'suede', 'ankle', 'sale'],
      footwearDetails: {
        sizes:      [36, 37, 38, 39, 40],
        heelHeight: 6,
        material:   'Premium Suede',
        occasion:   ['Office', 'Evening', 'Casual'],
      },
      createdAt: now, updatedAt: now,
    },
    {
      sku:              'E256-FW004',
      type:             'footwear',
      name:             'Strappy Heeled Sandals',
      slug:             'strappy-heeled-sandals',
      category:         'Sandals',
      shortDescription: 'Elegant adjustable strappy sandals.',
      description:      'Elegant strappy sandals with adjustable ankle strap and 7cm heel. Padded footbed for extended wear.',
      price:            98000,
      compareAtPrice:   0,
      images:           [
        'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=800&q=85&fit=crop',
      ],
      stock:    18,
      featured: false,
      status:   'active',
      tags:     ['sandals', 'heels', 'evening', 'party'],
      footwearDetails: {
        sizes:      [36, 37, 38, 39, 40, 41],
        heelHeight: 7,
        material:   'Synthetic Leather',
        occasion:   ['Evening', 'Beach', 'Party'],
      },
      createdAt: now, updatedAt: now,
    },
    {
      sku:              'E256-FW005',
      type:             'footwear',
      name:             'Leather Ballet Flats',
      slug:             'leather-ballet-flats',
      category:         'Flats',
      shortDescription: 'Soft nappa leather bow ballet flats.',
      description:      'Classic ballet flats in soft nappa leather. Bow detail at toe, cushioned sole, flexible construction for all-day wear.',
      price:            85000,
      compareAtPrice:   0,
      images:           [
        'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&q=85&fit=crop',
      ],
      stock:    25,
      featured: true,
      status:   'active',
      tags:     ['flats', 'ballet', 'comfortable', 'everyday'],
      footwearDetails: {
        sizes:      [35, 36, 37, 38, 39, 40, 41, 42],
        heelHeight: 1,
        material:   'Nappa Leather',
        occasion:   ['Office', 'Casual', 'Travel'],
      },
      createdAt: now, updatedAt: now,
    },

    // ── Decor ─────────────────────────────────────────────────────────────
    {
      sku:              'E256-DC001',
      type:             'decor',
      name:             'Abstract Canvas Wall Art',
      slug:             'abstract-canvas-wall-art',
      category:         'Wall Art',
      shortDescription: 'Bold earth-tone abstract oil on canvas.',
      description:      'Large format abstract oil painting on stretched canvas. Warm earth tones with bold brushwork. Ready to hang with wall hardware included.',
      price:            120000,
      compareAtPrice:   0,
      images:           [
        'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&q=85&fit=crop',
        'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&q=85&fit=crop',
      ],
      stock:    10,
      featured: true,
      status:   'active',
      tags:     ['wall art', 'abstract', 'modern', 'featured'],
      decorDetails: {
        dimensions:    { height: 60, width: 90, depth: 3 },
        weight:        2.5,
        material:      'Oil on Stretched Canvas',
        room:          ['Living Room', 'Office', 'Hallway'],
        style:         ['Modern', 'Abstract'],
        indoorOutdoor: 'indoor',
      },
      createdAt: now, updatedAt: now,
    },
    {
      sku:              'E256-DC002',
      type:             'decor',
      name:             'Ceramic Vase Set (Set of 3)',
      slug:             'ceramic-vase-set',
      category:         'Vases',
      shortDescription: 'Hand-thrown matte ceramic vase trio.',
      description:      'Set of 3 artisan ceramic vases in graduating heights. Hand-thrown with matte glaze finish. Perfect for dried or fresh florals.',
      price:            89000,
      compareAtPrice:   115000,
      images:           [
        'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800&q=85&fit=crop',
        'https://images.unsplash.com/photo-1602872030490-4a484a7b3ba6?w=800&q=85&fit=crop',
      ],
      stock:    12,
      featured: false,
      status:   'active',
      tags:     ['vase', 'ceramic', 'boho', 'sale'],
      decorDetails: {
        dimensions:    { height: 25, width: 12, depth: 0 },
        weight:        1.8,
        material:      'Stoneware Ceramic',
        room:          ['Living Room', 'Bedroom', 'Dining Room'],
        style:         ['Boho', 'Minimalist'],
        indoorOutdoor: 'indoor',
      },
      createdAt: now, updatedAt: now,
    },
    {
      sku:              'E256-DC003',
      type:             'decor',
      name:             'Boho Cushion Covers (2-Pack)',
      slug:             'boho-cushion-covers',
      category:         'Cushions',
      shortDescription: '2-pack hand-woven tassel cushion covers.',
      description:      'Set of 2 hand-woven cushion covers with decorative tassels. Cotton-linen blend. Zipper closure. Insert not included.',
      price:            65000,
      compareAtPrice:   0,
      images:           [
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=85&fit=crop',
      ],
      stock:    30,
      featured: false,
      status:   'active',
      tags:     ['cushion', 'boho', 'textile', 'new'],
      decorDetails: {
        dimensions:    { height: 45, width: 45, depth: 0 },
        weight:        0.4,
        material:      'Cotton-Linen Blend',
        room:          ['Living Room', 'Bedroom'],
        style:         ['Boho', 'Vintage'],
        indoorOutdoor: 'indoor',
      },
      createdAt: now, updatedAt: now,
    },
    {
      sku:              'E256-DC004',
      type:             'decor',
      name:             'Modern Arc Floor Lamp',
      slug:             'modern-arc-floor-lamp',
      category:         'Lighting',
      shortDescription: 'Brushed gold arc reading floor lamp.',
      description:      'Elegant arc floor lamp with brushed gold finish. Height-adjustable arm, includes E27 bulb socket. The perfect reading and ambiance lamp.',
      price:            285000,
      compareAtPrice:   0,
      images:           [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85&fit=crop',
      ],
      stock:    6,
      featured: true,
      status:   'active',
      tags:     ['lighting', 'lamp', 'modern', 'gold'],
      decorDetails: {
        dimensions:    { height: 160, width: 50, depth: 0 },
        weight:        4.5,
        material:      'Steel & Fabric Shade',
        room:          ['Living Room', 'Bedroom', 'Office'],
        style:         ['Modern', 'Minimalist'],
        indoorOutdoor: 'indoor',
      },
      createdAt: now, updatedAt: now,
    },
    {
      sku:              'E256-DC005',
      type:             'decor',
      name:             'Macramé Plant Hanger',
      slug:             'macrame-plant-hanger',
      category:         'Planters',
      shortDescription: 'Handmade natural cotton macramé hanger.',
      description:      'Handmade natural cotton macramé plant hanger. Suitable for pots up to 20cm diameter. Includes ceiling hook and care card.',
      price:            45000,
      compareAtPrice:   0,
      images:           [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85&fit=crop',
      ],
      stock:    40,
      featured: false,
      status:   'active',
      tags:     ['macrame', 'planter', 'boho', 'handmade'],
      decorDetails: {
        dimensions:    { height: 80, width: 20, depth: 0 },
        weight:        0.3,
        material:      'Natural Cotton Cord',
        room:          ['Living Room', 'Balcony', 'Bedroom'],
        style:         ['Boho', 'Natural'],
        indoorOutdoor: 'both',
      },
      createdAt: now, updatedAt: now,
    },
  ];

  const productBatch = db.batch();
  products.forEach(p => {
    productBatch.set(db.collection('products').doc(p.slug), p);
  });
  await productBatch.commit();

  // ── Sample orders ──────────────────────────────────────────────────────────
  console.log('📦 Creating sample orders...');
  const orderBatch = db.batch();

  orderBatch.set(db.collection('orders').doc(), {
    orderNumber:     'E256-000001',
    customerId:      janeId,
    shippingAddress: { name: 'Jane Doe', phone: '+256788123456', city: 'Kampala', district: 'Central', country: 'Uganda' },
    items:           [{ productId: 'classic-pump-heels', sku: 'E256-FW001', name: 'Classic Pump Heels', price: 145000, quantity: 1, size: 38 }],
    subtotal:        145000,
    shippingFee:     10000,
    discountAmount:  0,
    total:           155000,
    paymentStatus:   'paid',
    orderStatus:     'delivered',
    deliveryZone:    'Zone 1 — Central',
    statusHistory:   [
      { status: 'pending',    note: 'Order placed',         updatedAt: now },
      { status: 'processing', note: 'Payment confirmed',    updatedAt: now },
      { status: 'shipped',    note: 'Dispatched via rider', updatedAt: now },
      { status: 'delivered',  note: 'Delivered',            updatedAt: now },
    ],
    createdAt: now, updatedAt: now,
  });

  orderBatch.set(db.collection('orders').doc(), {
    orderNumber:     'E256-000002',
    customerId:      maryId,
    shippingAddress: { name: 'Mary Smith', phone: '+256772987654', city: 'Ntinda', district: 'Kampala', country: 'Uganda' },
    items:           [
      { productId: 'white-leather-sneakers',  sku: 'E256-FW002', name: 'White Leather Sneakers',  price: 128000, quantity: 1, size: 37 },
      { productId: 'abstract-canvas-wall-art', sku: 'E256-DC001', name: 'Abstract Canvas Wall Art', price: 120000, quantity: 1 },
    ],
    subtotal:        248000,
    shippingFee:     10000,
    discountAmount:  0,
    total:           258000,
    paymentStatus:   'paid',
    orderStatus:     'shipped',
    deliveryZone:    'Zone 2 — Near Suburbs',
    trackingNumber:  'KLA-9987',
    statusHistory:   [
      { status: 'pending',    note: 'Order placed',            updatedAt: now },
      { status: 'processing', note: 'Payment confirmed',       updatedAt: now },
      { status: 'shipped',    note: 'Dispatched via courier',  updatedAt: now },
    ],
    createdAt: now, updatedAt: now,
  });

  await orderBatch.commit();

  // ── Welcome coupon ─────────────────────────────────────────────────────────
  console.log('🎟️  Creating welcome coupon...');
  await db.collection('coupons').add({
    code:                'WELCOME10',
    couponType:          'welcome',
    discountType:        'percentage',
    type:                'percentage',
    discountValue:       10,
    value:               10,
    minSubtotalRequired: 0,
    minTotal:            0,
    maxDiscountAmount:   null,
    usageLimit:          null,
    maxClaims:           null,
    usageCount:          0,
    currentClaims:       0,
    usesCount:           0,
    expiresAt:           null,
    status:              'active',
    isActive:            true,
    createdAt:           now,
    updatedAt:           now,
  });

  // ── Counter doc (for order number generation) ──────────────────────────────
  console.log('🔢 Initialising order counter...');
  await db.collection('_counters').doc('orders').set({
    count:     2,
    updatedAt: now,
  });

  console.log('\n✅ Seed complete!');
  console.log('   Admin:    admin@essentials256.com  /  Admin@123');
  console.log('   Customer: jane@example.com         /  Customer@123');
  console.log('   Customer: mary@example.com         /  Customer@123');
  console.log('   Products: 10 (5 footwear, 5 decor)');
  console.log('   Orders:   2 sample orders');
  console.log('   Coupons:  WELCOME10 (10% off, welcome type)\n');
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});