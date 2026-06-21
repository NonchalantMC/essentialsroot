const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const FirestoreService = require('../services/FirestoreService');
const { protect } = require('../middleware/auth');

// Import Brevo notification utilities
const { sendWelcomeEmail, sendAdminNewUserAlert } = require('../utils/email');

const UserService = new FirestoreService('users');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
});

const sendAuth = (res, user, statusCode = 200) => {
  const token = signToken(user._id || user.id);
  const { passwordHash, ...safeUser } = user;
  res.status(statusCode).json({ token, user: safeUser });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await UserService.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await UserService.create({
      name, email, phone: phone || '', passwordHash,
      role: 'customer', addresses: [], preferences: {},
    });

    // Fire Brevo Welcome Sequence & Admin Alert asynchronously
    sendWelcomeEmail(user.email, user.name);
    sendAdminNewUserAlert(user);

    sendAuth(res, user, 201);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await UserService.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

    sendAuth(res, user);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
  }
});

// Export UserService so other routes can use it
module.exports = router;
module.exports.UserService = UserService;