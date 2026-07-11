require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const functions  = require('firebase-functions'); 

const app = express();

//newcommCIest
// ── Security & middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ── Tight rate limit on auth routes — prevents brute force and credential stuffing
// Keyed on email so the limit is per-account, not per-IP (VPNs won't help attackers)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyGenerator: (req) => (req.body?.email || req.ip || 'unknown').toLowerCase(),
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// ── Request logging ───────────────────────────────────────────────────────────
// Structured JSON logs routed automatically to Google Cloud Logging in production.
// Logs method, path, status, and response time for every request — lets you
// identify slow endpoints and track traffic per route without extra tooling.
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify({
        method: req.method,
        path:   req.path,
        status: res.statusCode,
        ms:     Date.now() - start,
      }));
    }
  });
  next();
});

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
  res.json({ status: 'ok' });
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
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    message: isDev ? err.message : 'Something went wrong. Please try again.',
    ...(isDev && { stack: err.stack }),
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
// Production settings:
//   memory: 512MB — headroom for image processing and concurrent requests
//   timeoutSeconds: 60 — covers PesaPal's occasionally slow API responses
//   maxInstances: 10 — caps runaway scaling costs during unexpected traffic spikes
exports.api = functions
  .runWith({
    memory:         '512MB',
    timeoutSeconds: 60,
    maxInstances:   10,
  })
  .https.onRequest(app);