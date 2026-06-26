const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const FirestoreService = require('../services/FirestoreService');
const { protect } = require('../middleware/auth');
const { sendWelcomeEmail, sendAdminNewUserAlert } = require('../utils/email');

const UserService = new FirestoreService('users');

// tokenVersion is stored on the user document and included in every JWT.
// Incrementing it in Firestore instantly invalidates all previously issued
// tokens for that user — the only way to revoke a compromised token.
const signToken = (id, tokenVersion) =>
  jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sendAuth = (res, user, statusCode = 200) => {
  const token = signToken(user._id || user.id, user.tokenVersion ?? 0);
  const { passwordHash, ...safeUser } = user;
  res.status(statusCode).json({ token, user: safeUser });
};

const serverErr = (res, err) => {
  console.error(err);
  const msg = process.env.NODE_ENV === 'development' ? err.message : 'Server error. Please try again.';
  return res.status(500).json({ message: msg });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await UserService.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await UserService.create({
      name, email: normalizedEmail, phone: phone || '', passwordHash,
      role: 'customer', addresses: [], preferences: {},
      tokenVersion: 0,  // initialised at 0; increment to revoke all sessions
    });

    sendWelcomeEmail(user.email, user.name);
    sendAdminNewUserAlert(user);
    sendAuth(res, user, 201);
  } catch (err) {
    serverErr(res, err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await UserService.findOne({ email: normalizedEmail });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

    sendAuth(res, user);
  } catch (err) {
    serverErr(res, err);
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await UserService.findById(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    serverErr(res, err);
  }
});

// PATCH /api/auth/profile
router.patch('/profile', protect, async (req, res) => {
  try {
    const { name, phone, preferences, addresses } = req.body;
    const updates = {};
    if (name)        updates.name        = name;
    if (phone)       updates.phone       = phone;
    if (preferences) updates.preferences = preferences;
    if (addresses)   updates.addresses   = addresses;

    const userId = req.user.id || req.user._id;
    const user   = await UserService.updateById(userId, updates);
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    serverErr(res, err);
  }
});

// POST /api/auth/logout
router.post('/logout', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const currentVersion = req.user.tokenVersion ?? 0;
    await UserService.updateById(userId, { tokenVersion: currentVersion + 1 });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    serverErr(res, err);
  }
});

module.exports = router;
module.exports.UserService = UserService;
