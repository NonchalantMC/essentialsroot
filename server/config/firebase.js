const admin = require('firebase-admin');

if (!admin.apps.length) {
  // 1. If running inside Firebase (Cloud Functions or local Firebase Emulator),
  // initialize automatically without passing any credentials!
  if (process.env.FUNCTION_TARGET || process.env.FUNCTIONS_EMULATOR || process.env.FIREBASE_CONFIG) {
    admin.initializeApp();
  } 
  // 2. If running on Render/Railway with explicit environment variables
  else if (process.env.APP_FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.APP_FIREBASE_PROJECT_ID,
        clientEmail: process.env.APP_FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.APP_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } 
  // 3. Fallback for standalone local node development (e.g., node server.js)
  else {
    try {
      const serviceAccount = require('../firebase-service-account.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (err) {
      console.warn('⚠️ Could not find service account file, initializing default app:', err.message);
      admin.initializeApp();
    }
  }
}

const db = admin.firestore();
db.settings({ databaseId: 'default' });

// Convert Firestore doc snapshot → plain JS object with _id and id fields
const docToObj = (doc) => {
  if (!doc.exists) return null;
  const data = doc.data();
  const converted = {};
  Object.entries(data).forEach(([k, v]) => {
    // Convert Firestore Timestamps to ISO strings
    if (v && typeof v === 'object' && v._seconds !== undefined) {
      converted[k] = new Date(v._seconds * 1000).toISOString();
    } else if (Array.isArray(v)) {
      converted[k] = v.map(item => {
        if (item && typeof item === 'object' && item._seconds !== undefined) {
          return new Date(item._seconds * 1000).toISOString();
        }
        return item;
      });
    } else {
      converted[k] = v;
    }
  });
  return { ...converted, _id: doc.id, id: doc.id };
};

// Convert query snapshot → array of plain objects
const snapToArr = (snap) => snap.docs.map(docToObj);

module.exports = { admin, db, docToObj, snapToArr };