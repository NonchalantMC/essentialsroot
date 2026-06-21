require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const functions  = require('firebase-functions'); 
const bcrypt     = require('bcryptjs'); 

const app = express();

// ── Security & middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// ── Firebase connection ───────────────────────────────────────────────────────
const { db } = require('./config/firebase');
db.collection('_health').doc('ping')
  .set({ ts: new Date().toISOString() })
  .then(() => console.log('✅ Firebase Firestore connected'))
  .catch(err => {
    console.error('❌ Firebase connection warning:', err.message);
  });

// ── Health check endpoint ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: 'firestore', ts: new Date().toISOString() });
});


// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/upload',   require('./routes/upload'));
app.use('/api/hero',     require('./routes/hero'));
app.use('/api/coupons',  require('./routes/coupons'));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Local Port Listener ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
if (
  process.env.NODE_ENV !== 'production' && 
  !process.env.FUNCTION_TARGET && 
  !process.env.FUNCTIONS_EMULATOR &&
  require.main === module
) {
    app.listen(PORT, () => {
        console.log(`Essentials256 API running locally on port ${PORT}`);
    });
}

// ── Firebase Engine Hook ──────────────────────────────────────────────────────
exports.api = functions.https.onRequest(app);