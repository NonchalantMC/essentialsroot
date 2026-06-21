/**
 * Essentials256 — Firestore Database Seed Script
 * Run from inside the server/ folder: npm run seed
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { db } = require('../config/firebase');

// Utility function to safely wipe a Firestore collection
async function deleteCollection(collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });
}

async function deleteQueryBatch(query, resolve, reject) {
  try {
    const snapshot = await query.get();
    if (snapshot.size === 0) {
      resolve();
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    process.nextTick(() => {
      deleteQueryBatch(query, resolve, reject);
    });
  } catch (err) {
    reject(err);
  }
}

const seed = async () => {
  console.log('🌱 Connecting to Firestore and starting seed process...');

  // 1. Clear existing Firestore collections cleanly
  console.log('🧹 Clearing old collections...');
  await Promise.all([
    deleteCollection('users'),
    deleteCollection('products'),
    deleteCollection('orders'),
    deleteCollection('reviews')
  ]);

  // 2. Hash passwords manually since we no longer have Mongoose pre-save hooks
  console.log('🔐 Hashing default user passwords...');
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const customerHash = await bcrypt.hash('Customer@123', 12);

  // 3. Generate explicit IDs for relational connections
  const adminId = db.collection('users').doc().id;
  const janeId = db.collection('users').doc().id;
  const maryId = db.collection('users').doc().id;

  // 4. Create Users
  console.log('👥 Inserting user documents...');
  const usersBatch = db.batch();
  
  usersBatch.set(db.collection('users').doc(adminId), {
    name: 'Admin Essentials', email: 'admin@essentials256.com',
    passwordHash: adminHash, role: 'admin', phone: '+250700000000',
    createdAt: new Date().toISOString()
  });

  usersBatch.set(db.collection('users').doc(janeId), {
    name: 'Jane Doe', email: 'jane@example.com',
    passwordHash: customerHash, role: 'customer', phone: '+250788123456',
    addresses: [{ type: 'home', street: 'KG 11 Ave, Kacyiru', city: 'Kigali', country: 'Rwanda', isDefault: true }],
    preferences: { shoeSize: 38, widthPreference: 'regular', decorStyle: ['modern', 'minimalist'] },
    createdAt: new Date().toISOString()
  });

  usersBatch.set(db.collection('users').doc(maryId), {
    name: 'Mary Smith', email: 'mary@example.com',
    passwordHash: customerHash, role: 'customer', phone: '+256772987654',
    addresses: [{ type: 'home', street: 'Kampala Road Plot 23', city: 'Kampala', district: 'Central', country: 'Uganda', isDefault: true }],
    preferences: { shoeSize: 37, widthPreference: 'regular', decorStyle: ['boho', 'vintage'] },
    createdAt: new Date().toISOString()
  });

  await usersBatch.commit();

  // 5. Create Products (Using slugs as unique Doc IDs for lightning-fast routing lookups)
  console.log('🛍️ Inserting product details...');
  const productsData = [
    {
      sku: 'E256-FW001', type: 'footwear', name: 'Classic Pump Heels',
      slug: 'classic-pump-heels',
      description: 'Timeless pointed-toe pumps with a 9cm stiletto heel. Crafted from premium Italian leather with cushioned insole for all-day elegance.',
      shortDescription: 'Timeless Italian leather stiletto pumps.',
      price: 145000, compareAtPrice: 195000,
      images: [
        'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=85&fit=crop',
        'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800&q=85&fit=crop',
      ],
      category: 'Heels', subcategory: 'Stiletto',
      tags: ['heels', 'formal', 'office', 'evening', 'bestseller'],
      stock: 15, featured: true, rating: 4.8, reviewCount: 124, status: 'active',
      footwearDetails: {
        sizes: [36,37,38,39,40,41], halfSizes: [36.5,37.5,38.5,39.5],
        widths: ['narrow','regular'], heelHeight: 9,
        material: 'Italian Leather', lining: 'Soft Suede', sole: 'Leather',
        closure: ['slip-on'], occasion: ['Office','Evening','Formal'],
        careInstructions: 'Wipe with damp cloth. Store with shoe trees.',
      },
      createdAt: new Date().toISOString()
    },
    {
      sku: 'E256-FW002', type: 'footwear', name: 'White Leather Sneakers',
      slug: 'white-leather-sneakers',
      description: 'Minimalist white leather sneakers with vulcanized sole. Versatile for casual outings or smart-casual office days.',
      shortDescription: 'Clean minimal white leather sneakers.',
      price: 128000, compareAtPrice: 0,
      images: [
        'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&q=85&fit=crop',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85&fit=crop',
      ],
      category: 'Sneakers',
      tags: ['sneakers', 'casual', 'white', 'minimal', 'new'],
      stock: 22, featured: true, rating: 4.9, reviewCount: 89, status: 'active',
      footwearDetails: {
        sizes: [36,37,38,39,40,41,42], widths: ['narrow','regular','wide'],
        heelHeight: 2, material: 'Genuine Leather', lining: 'Textile',
        sole: 'Rubber Vulcanized', closure: ['lace-up'],
        occasion: ['Casual','Office','Weekend'],
        careInstructions: 'Clean with white leather cleaner. Air dry.',
      },
      createdAt: new Date().toISOString()
    },
    {
      sku: 'E256-FW003', type: 'footwear', name: 'Suede Ankle Boots',
      slug: 'suede-ankle-boots',
      description: 'Soft suede ankle boots with block heel. Side zip closure and cushioned footbed. Perfect for cooler evenings.',
      shortDescription: 'Luxe block-heel suede ankle boots.',
      price: 210000, compareAtPrice: 260000,
      images: ['https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&q=85&fit=crop'],
      category: 'Boots',
      tags: ['boots', 'suede', 'ankle', 'sale'],
      stock: 8, featured: false, rating: 4.7, reviewCount: 67, status: 'active',
      footwearDetails: {
        sizes: [36,37,38,39,40], widths: ['regular'],
        heelHeight: 6, material: 'Premium Suede', lining: 'Leather',
        sole: 'Rubber', closure: ['zip'],
        occasion: ['Office','Evening','Casual'],
        careInstructions: 'Use suede protector spray. Brush with suede brush.',
      },
      createdAt: new Date().toISOString()
    },
    {
      sku: 'E256-FW004', type: 'footwear', name: 'Strappy Heeled Sandals',
      slug: 'strappy-heeled-sandals',
      description: 'Elegant strappy sandals with adjustable ankle strap and 7cm heel. Padded footbed for extended wear.',
      shortDescription: 'Elegant adjustable strappy sandals.',
      price: 98000, compareAtPrice: 0,
      images: ['https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=800&q=85&fit=crop'],
      category: 'Sandals',
      tags: ['sandals', 'heels', 'evening', 'party'],
      stock: 18, featured: false, rating: 4.6, reviewCount: 45, status: 'active',
      footwearDetails: {
        sizes: [36,37,38,39,40,41], widths: ['narrow','regular'],
        heelHeight: 7, material: 'Synthetic Leather', lining: 'Padded Insole',
        sole: 'TPR', closure: ['buckle'],
        occasion: ['Evening','Beach','Party'],
        careInstructions: 'Wipe clean. Avoid prolonged water exposure.',
      },
      createdAt: new Date().toISOString()
    },
    {
      sku: 'E256-FW005', type: 'footwear', name: 'Leather Ballet Flats',
      slug: 'leather-ballet-flats',
      description: 'Classic ballet flats in soft nappa leather. Bow detail at toe, cushioned sole, flexible construction for all-day wear.',
      shortDescription: 'Soft nappa leather bow ballet flats.',
      price: 85000, compareAtPrice: 0,
      images: ['https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&q=85&fit=crop'],
      category: 'Flats',
      tags: ['flats', 'ballet', 'comfortable', 'everyday'],
      stock: 25, featured: true, rating: 4.5, reviewCount: 92, status: 'active',
      footwearDetails: {
        sizes: [35,36,37,38,39,40,41,42], widths: ['narrow','regular','wide'],
        heelHeight: 1, material: 'Nappa Leather', lining: 'Soft Fabric',
        sole: 'Flexible Rubber', closure: ['slip-on'],
        occasion: ['Office','Casual','Travel'],
        careInstructions: 'Polish regularly. Avoid wet conditions.',
      },
      createdAt: new Date().toISOString()
    },
    {
      sku: 'E256-DC001', type: 'decor', name: 'Abstract Canvas Wall Art',
      slug: 'abstract-canvas-wall-art',
      description: 'Large format abstract oil painting on stretched canvas. Warm earth tones with bold brushwork. Ready to hang with wall hardware included.',
      shortDescription: 'Bold earth-tone abstract oil on canvas.',
      price: 120000, compareAtPrice: 0,
      images: [
        'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&q=85&fit=crop',
        'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&q=85&fit=crop',
      ],
      category: 'Wall Art',
      tags: ['wall art', 'abstract', 'modern', 'featured'],
      stock: 10, featured: true, rating: 4.9, reviewCount: 38, status: 'active',
      decorDetails: {
        dimensions: { height: 60, width: 90, depth: 3 }, weight: 2.5,
        material: 'Oil on Stretched Canvas', color: 'Earth Tones', colorFamily: 'Warm',
        room: ['Living Room','Office','Hallway'],
        style: ['Modern','Abstract'], assembly: false,
        careInstructions: 'Dust with soft dry cloth. Keep away from direct sunlight.',
        indoorOutdoor: 'indoor',
      },
      createdAt: new Date().toISOString()
    },
    {
      sku: 'E256-DC002', type: 'decor', name: 'Ceramic Vase Set (Set of 3)',
      slug: 'ceramic-vase-set',
      description: 'Set of 3 artisan ceramic vases in graduating heights. Hand-thrown with matte glaze finish. Perfect for dried or fresh florals.',
      shortDescription: 'Hand-thrown matte ceramic vase trio.',
      price: 89000, compareAtPrice: 115000,
      images: [
        'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800&q=85&fit=crop',
        'https://images.unsplash.com/photo-1602872030490-4a484a7b3ba6?w=800&q=85&fit=crop',
      ],
      category: 'Vases',
      tags: ['vase', 'ceramic', 'boho', 'sale'],
      stock: 12, featured: false, rating: 4.8, reviewCount: 55, status: 'active',
      decorDetails: {
        dimensions: { height: 25, width: 12 }, weight: 1.8,
        material: 'Stoneware Ceramic', color: 'Cream & Terracotta', colorFamily: 'Warm',
        room: ['Living Room','Bedroom','Kitchen','Dining Room'],
        style: ['Boho','Minimalist'], assembly: false,
        careInstructions: 'Hand wash only. Not dishwasher safe.',
        indoorOutdoor: 'indoor',
      },
      createdAt: new Date().toISOString()
    },
    {
      sku: 'E256-DC003', type: 'decor', name: 'Boho Cushion Covers (2-Pack)',
      slug: 'boho-cushion-covers',
      description: 'Set of 2 hand-woven cushion covers with decorative tassels. Cotton-linen blend. Zipper closure. Insert not included.',
      shortDescription: '2-pack hand-woven tassel cushion covers.',
      price: 65000, compareAtPrice: 0,
      images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=85&fit=crop'],
      category: 'Cushions',
      tags: ['cushion', 'boho', 'textile', 'new'],
      stock: 30, featured: false, rating: 4.6, reviewCount: 77, status: 'active',
      decorDetails: {
        dimensions: { height: 45, width: 45 }, weight: 0.4,
        material: 'Cotton-Linen Blend', color: 'Mustard & Cream', colorFamily: 'Warm',
        room: ['Living Room','Bedroom'],
        style: ['Boho','Vintage'], assembly: false,
        careInstructions: 'Machine wash cold, gentle cycle. Tumble dry low.',
        indoorOutdoor: 'indoor',
      },
      createdAt: new Date().toISOString()
    },
    {
      sku: 'E256-DC004', type: 'decor', name: 'Modern Arc Floor Lamp',
      slug: 'modern-arc-floor-lamp',
      description: 'Elegant arc floor lamp with brushed gold finish. Height-adjustable arm, includes E27 bulb socket. The perfect reading and ambiance lamp.',
      shortDescription: 'Brushed gold arc reading floor lamp.',
      price: 285000, compareAtPrice: 0,
      images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85&fit=crop'],
      category: 'Lighting',
      tags: ['lighting', 'lamp', 'modern', 'gold'],
      stock: 6, featured: true, rating: 4.7, reviewCount: 29, status: 'active',
      decorDetails: {
        dimensions: { height: 160, width: 50 }, weight: 4.5,
        material: 'Steel & Fabric Shade', color: 'Brushed Gold & Ivory', colorFamily: 'Neutral',
        room: ['Living Room','Bedroom','Office'],
        style: ['Modern','Minimalist'], assembly: true,
        careInstructions: 'Dust regularly. Clean with dry cloth.',
        indoorOutdoor: 'indoor',
      },
      createdAt: new Date().toISOString()
    },
    {
      sku: 'E256-DC005', type: 'decor', name: 'Macramé Plant Hanger',
      slug: 'macrame-plant-hanger',
      description: 'Handmade natural cotton macramé plant hanger. Suitable for pots up to 20cm diameter. Includes ceiling hook and care card.',
      shortDescription: 'Handmade natural cotton macramé hanger.',
      price: 45000, compareAtPrice: 0,
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85&fit=crop'],
      category: 'Planters',
      tags: ['macrame', 'planter', 'boho', 'handmade', 'natural'],
      stock: 40, featured: false, rating: 4.5, reviewCount: 63, status: 'active',
      decorDetails: {
        dimensions: { height: 80, width: 20 }, weight: 0.3,
        material: 'Natural Cotton Cord', color: 'Natural Cream', colorFamily: 'Neutral',
        room: ['Living Room','Balcony','Bedroom'],
        style: ['Boho','Natural'], assembly: false,
        careInstructions: 'Hand wash cold. Air dry. Keep away from direct rain.',
        indoorOutdoor: 'both',
      },
      createdAt: new Date().toISOString()
    }
  ];

  const productBatch = db.batch();
  productsData.forEach(p => {
    productBatch.set(db.collection('products').doc(p.slug), p);
  });
  await productBatch.commit();

  // 6. Create Orders
  console.log('📦 Generating transaction orders...');
  const shippingJane = { name: 'Jane Doe', phone: '+250788123456', street: 'KG 11 Ave, Kacyiru', city: 'Kigali', country: 'Rwanda' };
  const shippingMary = { name: 'Mary Smith', phone: '+256772987654', street: 'Kampala Road Plot 23', city: 'Kampala', district: 'Central', country: 'Uganda' };

  const orderBatch = db.batch();

  orderBatch.set(db.collection('orders').doc(), {
    orderNumber: 1001,
    customerId: janeId, shippingAddress: shippingJane, billingAddress: shippingJane,
    items: [{ productId: 'classic-pump-heels', sku: 'E256-FW001', name: 'Classic Pump Heels', price: 145000, quantity: 1, size: 38 }],
    subtotal: 145000, shippingFee: 10000, total: 155000,
    paymentStatus: 'paid', orderStatus: 'delivered', deliveryMethod: 'standard',
    pesapalTrackingId: 'TEST-TRK-001',
    statusHistory: [
      { status: 'pending',    note: 'Order placed', ts: new Date().toISOString() },
      { status: 'processing', note: 'Payment confirmed', ts: new Date().toISOString() },
      { status: 'shipped',    note: 'Dispatched via courier', ts: new Date().toISOString() },
      { status: 'delivered',  note: 'Delivered successfully', ts: new Date().toISOString() },
    ],
    createdAt: new Date().toISOString()
  });

  orderBatch.set(db.collection('orders').doc(), {
    orderNumber: 1002,
    customerId: maryId, shippingAddress: shippingMary, billingAddress: shippingMary,
    items: [
      { productId: 'white-leather-sneakers', sku: 'E256-FW002', name: 'White Leather Sneakers', price: 128000, quantity: 1, size: 37 },
      { productId: 'abstract-canvas-wall-art', sku: 'E256-DC001', name: 'Abstract Canvas Wall Art', price: 120000, quantity: 1 },
    ],
    subtotal: 248000, shippingFee: 10000, total: 258000,
    paymentStatus: 'paid', orderStatus: 'shipped', deliveryMethod: 'express',
    trackingNumber: 'KGL-UGA-9987',
    statusHistory: [
      { status: 'pending',    note: 'Order placed', ts: new Date().toISOString() },
      { status: 'processing', note: 'Payment confirmed', ts: new Date().toISOString() },
      { status: 'shipped',    note: 'Dispatched via express courier', ts: new Date().toISOString() },
    ],
    createdAt: new Date().toISOString()
  });

  orderBatch.set(db.collection('orders').doc(), {
    orderNumber: 1003,
    customerId: janeId, shippingAddress: shippingJane, billingAddress: shippingJane,
    items: [{ productId: 'leather-ballet-flats', sku: 'E256-FW005', name: 'Leather Ballet Flats', price: 85000, quantity: 2, size: 38 }],
    subtotal: 170000, shippingFee: 0, discount: 17000, total: 153000,
    couponCode: 'WELCOME10', paymentStatus: 'pending', orderStatus: 'pending',
    deliveryMethod: 'standard',
    statusHistory: [{ status: 'pending', note: 'Awaiting payment', ts: new Date().toISOString() }],
    createdAt: new Date().toISOString()
  });

  await orderBatch.commit();

  // 7. Create Reviews
  console.log('⭐ Uploading verified product reviews...');
  const reviewBatch = db.batch();

  reviewBatch.set(db.collection('reviews').doc(), {
    productId: 'classic-pump-heels', customerId: janeId, rating: 5,
    title: 'Absolutely stunning!',
    comment: 'These pumps are everything I hoped for. True to size, incredibly comfortable for a 9cm heel.',
    verifiedPurchase: true, fitFeedback: 'true_to_size', comfortRating: 5,
    createdAt: new Date().toISOString()
  });

  reviewBatch.set(db.collection('reviews').doc(), {
    productId: 'classic-pump-heels', customerId: maryId, rating: 4,
    title: 'Beautiful quality',
    comment: 'Gorgeous shoes. I sized up half a size as I have wider feet and they fit perfectly.',
    verifiedPurchase: false, fitFeedback: 'runs_small', comfortRating: 4,
    createdAt: new Date().toISOString()
  });

  reviewBatch.set(db.collection('reviews').doc(), {
    productId: 'abstract-canvas-wall-art', customerId: maryId, rating: 5,
    title: 'Transforms the room!',
    comment: 'This piece completely elevated my living room. Colors are exactly as shown — warm and rich.',
    verifiedPurchase: true, colorAccuracy: true, qualityRating: 5,
    createdAt: new Date().toISOString()
  });

  await reviewBatch.commit();

  console.log('\n✅ Firestore Seed Completed Cleanly!');
  console.log('   Admin:     admin@essentials256.com  /  Admin@123');
  console.log('   Customer:  jane@example.com         /  Customer@123');
  console.log('   Customer:  mary@example.com         /  Customer@123');
  console.log('   Products:  10 active profiles loaded');
  console.log('   Orders:    3 logs mapped successfully\n');
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});