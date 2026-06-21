/**
 * Essentials256 — MongoDB → Firestore Migration Script
 *
 * Run ONCE from inside the server/ folder:
 *   node utils/migrate-to-firebase.js
 *
 * Requirements:
 *   - MONGODB_URI in server/.env pointing to your Atlas cluster
 *   - firebase-service-account.json in server/
 *   - npm install firebase-admin mongoose (already installed)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const admin    = require('firebase-admin');

// ── Init Firebase ─────────────────────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      require('../firebase-service-account.json')
    ),
  });
}
const db = admin.firestore();
db.settings({ databaseId: 'default' });

// ── Mongoose models (minimal — just enough to read data) ──────────────────────
const userSchema = new mongoose.Schema({}, { strict: false });
const productSchema = new mongoose.Schema({}, { strict: false });
const orderSchema = new mongoose.Schema({}, { strict: false });

const User    = mongoose.model('User',    userSchema);
const Product = mongoose.model('Product', productSchema);
const Order   = mongoose.model('Order',   orderSchema);

// ── Helpers ───────────────────────────────────────────────────────────────────
function cleanDoc(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  const id  = obj._id?.toString();

  // Recursively convert all ObjectIds and Dates to strings
  function convert(val) {
    if (val === null || val === undefined) return val;
    if (val instanceof mongoose.Types.ObjectId) return val.toString();
    if (val instanceof Date) return val.toISOString();
    if (Array.isArray(val)) return val.map(convert);
    if (typeof val === 'object') {
      const out = {};
      Object.entries(val).forEach(([k, v]) => {
        if (k !== '__v') out[k] = convert(v);
      });
      return out;
    }
    return val;
  }

  const cleaned = convert(obj);
  cleaned._id = id;
  cleaned.id  = id;
  delete cleaned.__v;
  return { id, data: cleaned };
}

// Write in batches of 500 (Firestore limit)
async function writeBatch(collection, docs) {
  const BATCH_SIZE = 400;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_SIZE);
    chunk.forEach(({ id, data }) => {
      batch.set(db.collection(collection).doc(id), data);
    });
    await batch.commit();
    console.log(`   ✓ Wrote ${Math.min(i + BATCH_SIZE, docs.length)}/${docs.length}`);
  }
}

// ── Main migration ────────────────────────────────────────────────────────────
async function migrate() {
  console.log('\n🔥 Essentials256 — MongoDB → Firebase Migration');
  console.log('='.repeat(50));

  // Connect to MongoDB
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in server/.env');
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`\n✅ MongoDB connected: ${mongoose.connection.name}`);

  // ── 1. Users ───────────────────────────────────────────────────────────────
  console.log('\n📋 Migrating users...');
  const users = await User.find({}).lean();
  console.log(`   Found ${users.length} users`);
  if (users.length > 0) {
    const cleaned = users.map(u => cleanDoc(u));
    await writeBatch('users', cleaned);
    console.log(`   ✅ Users migrated`);
  }

  // ── 2. Products ────────────────────────────────────────────────────────────
  console.log('\n📋 Migrating products...');
  const products = await Product.find({}).lean();
  console.log(`   Found ${products.length} products`);
  if (products.length > 0) {
    const cleaned = products.map(p => cleanDoc(p));
    await writeBatch('products', cleaned);
    console.log(`   ✅ Products migrated`);
  }

  // ── 3. Orders ─────────────────────────────────────────────────────────────
  console.log('\n📋 Migrating orders...');
  const orders = await Order.find({}).lean();
  console.log(`   Found ${orders.length} orders`);
  if (orders.length > 0) {
    const cleaned = orders.map(o => cleanDoc(o));
    await writeBatch('orders', cleaned);
    console.log(`   ✅ Orders migrated`);
  }

  // ── 4. Set order counter so new orders continue from correct number ─────────
  console.log('\n📋 Setting order counter...');
  await db.collection('_counters').doc('orders').set({ count: orders.length });
  console.log(`   ✅ Counter set to ${orders.length}`);

  // ── 5. Verify counts in Firestore ─────────────────────────────────────────
  console.log('\n🔍 Verifying migration...');
  const [fsUsers, fsProducts, fsOrders] = await Promise.all([
    db.collection('users').count().get(),
    db.collection('products').count().get(),
    db.collection('orders').count().get(),
  ]);
  console.log(`   Users:    MongoDB ${users.length}   →   Firestore ${fsUsers.data().count}`);
  console.log(`   Products: MongoDB ${products.length}   →   Firestore ${fsProducts.data().count}`);
  console.log(`   Orders:   MongoDB ${orders.length}   →   Firestore ${fsOrders.data().count}`);

  const allMatch =
    fsUsers.data().count    === users.length &&
    fsProducts.data().count === products.length &&
    fsOrders.data().count   === orders.length;

  if (allMatch) {
    console.log('\n✅ All counts match — migration successful!');
  } else {
    console.warn('\n⚠️  Count mismatch — some documents may not have migrated. Check Firebase Console.');
  }

  console.log('\n📌 Next steps:');
  console.log('   1. Open Firebase Console → Firestore → verify your data');
  console.log('   2. Update server/.env to use Firebase (remove MONGODB_URI if ready)');
  console.log('   3. Start server: npm run dev');
  console.log('   4. Test login, products, checkout\n');

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
