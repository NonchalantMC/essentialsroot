require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const functions  = require('firebase-functions'); 
const { onRequest } = require('firebase-functions/v2/https');
const { expireStaleOrders } = require('./jobs/expireStaleOrders');

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
app.use('/api/auth/login',            authLimiter);
app.use('/api/auth/register',         authLimiter);
app.use('/api/auth/reset-password',   authLimiter);

// ── Dedicated limiter for forgot-password ─────────────────────────────────────
// Separate from authLimiter and much tighter: this endpoint doesn't just risk
// brute force, each hit sends a real email, so it doubles as an anti-spam
// control. Keyed on email (so an attacker can't dodge it by rotating IPs) with
// a longer window, since 10 reset emails in 15 minutes to someone's inbox is
// already harassment even if no account is ever compromised.
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator: (req) => (req.body?.email || req.ip || 'unknown').toLowerCase(),
  message: { message: 'Too many reset requests for this email. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/forgot-password', forgotPasswordLimiter);

// ── OTP-specific rate limits ──────────────────────────────────────────────────
// Keyed on phone number (not IP) so an attacker can't dodge the limit by
// rotating IPs, and a shared office/NAT IP doesn't get everyone locked out.
// send-otp is capped tighter since each call costs real SMS credit and can be
// used to spam a victim's phone.
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => (req.body?.phone || req.ip || 'unknown').toString(),
  message: { message: 'Too many verification code requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => (req.body?.phone || req.ip || 'unknown').toString(),
  message: { message: 'Too many verification attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/orders/guest/send-otp',   otpSendLimiter);
app.use('/api/orders/guest/verify-otp', otpVerifyLimiter);

// ── Coupon validation limiter ─────────────────────────────────────────────────
// POST /api/coupons/validate had only the general 200/15min API limiter,
// which is meant for normal usage, not a discovery-sensitive endpoint. A
// valid guess here immediately confirms a code exists AND discloses its
// exact discount value — realistically automatable against short,
// marketing-style codes. Keyed by IP (unlike the limiters above, there's no
// victim identity to key on here — the guesser IS the thing being limited).
// 20/15min is generous for a real customer mistyping a code a few times,
// tight enough to meaningfully slow down enumeration.
const couponValidateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many promo code attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/coupons/validate', couponValidateLimiter);

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

exports.api = onRequest({
  memory:         '512MiB',
  timeoutSeconds: 60,
  maxInstances:   10,
  secrets: [
    'JWT_SECRET',
    'PESAPAL_CONSUMER_KEY',
    'PESAPAL_CONSUMER_SECRET',
    'BREVO_API_KEY',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'AT_API_KEY',
  ],
}, app);

exports.expireStaleOrders = expireStaleOrders;
