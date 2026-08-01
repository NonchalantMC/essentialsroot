const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const FirestoreService = require('../services/FirestoreService');
const { protect } = require('../middleware/auth');
const { sendWelcomeEmail, sendAdminNewUserAlert, sendPasswordReset } = require('../utils/email');

const UserService = new FirestoreService('users');

// Server-side password policy — mirrors the client Zod schema, but this is
// the copy that actually matters since the client check is trivially
// bypassable by calling the API directly.
const PASSWORD_MIN_LENGTH = 8;
function passwordPolicyError(password) {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must include a number';
  return null;
}

// Reset tokens: we generate a random token, email the raw value to the user,
// and store only its SHA-256 hash on the user doc (same principle as never
// storing plaintext passwords — a Firestore read/export can't be used to
// take over accounts). Expires in 1 hour.
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

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

    const pwError = passwordPolicyError(password);
    if (pwError) return res.status(400).json({ message: pwError });

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

// POST /api/auth/forgot-password
// Always returns the same generic message whether or not the email exists —
// this prevents attackers from using this endpoint to enumerate registered
// accounts.
router.post('/forgot-password', async (req, res) => {
  const genericResponse = { message: 'If an account exists for that email, a reset link has been sent.' };
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await UserService.findOne({ email: normalizedEmail });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      await UserService.updateById(user._id || user.id, {
        resetPasswordToken:   hashToken(rawToken),
        resetPasswordExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
      });

      const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;
      sendPasswordReset(user.email, user.name, resetUrl)
        .catch(err => console.error('Password reset email failed:', err));
    }

    res.status(200).json(genericResponse);
  } catch (err) {
    console.error('forgot-password error:', err);
    // Still return the generic response — don't leak whether something broke
    // vs. the account not existing.
    res.status(200).json(genericResponse);
  }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!token) return res.status(400).json({ message: 'Reset token is required' });

    const pwError = passwordPolicyError(password);
    if (pwError) return res.status(400).json({ message: pwError });

    const hashedToken = hashToken(token);
    const user = await UserService.findOne({ resetPasswordToken: hashedToken });

    if (!user || !user.resetPasswordExpires || new Date() > new Date(user.resetPasswordExpires)) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const currentVersion = user.tokenVersion ?? 0;

    await UserService.updateById(user._id || user.id, {
      passwordHash,
      resetPasswordToken:   null,
      resetPasswordExpires: null,
      // Bump tokenVersion so any session tokens issued before the reset
      // (e.g. a stolen token an attacker was using) are immediately invalidated.
      tokenVersion: currentVersion + 1,
    });

    res.status(200).json({ message: 'Password has been reset successfully. Please log in.' });
  } catch (err) {
    serverErr(res, err);
  }
});

// POST /api/auth/confirm-email-change/:token
// Public/unauthenticated on purpose — same reasoning as reset-password: the
// admin may be checking their new inbox on a device with no active session
// here at all. The token itself (only ever sent to the new address) is what
// proves authorization, not a login. Admin's current password was already
// verified back in PUT /api/admin/change-email before this token was issued;
// this step only proves the new inbox is real and under their control.
router.post('/confirm-email-change/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ message: 'Confirmation token is required' });

    const hashedToken = hashToken(token);
    const user = await UserService.findOne({ emailChangeToken: hashedToken });

    if (!user || !user.emailChangeExpires || new Date() > new Date(user.emailChangeExpires) || !user.pendingEmail) {
      return res.status(400).json({ message: 'This confirmation link is invalid or has expired. Please request the change again.' });
    }

    const currentVersion = user.tokenVersion ?? 0;

    await UserService.updateById(user._id || user.id, {
      email:              user.pendingEmail,
      pendingEmail:       null,
      emailChangeToken:   null,
      emailChangeExpires: null,
      // The account's login identifier just changed — invalidate any
      // existing session tokens (including whichever one initiated this)
      // so a fresh login is required, matching the change-password pattern.
      tokenVersion: currentVersion + 1,
    });

    res.status(200).json({ message: 'Email confirmed and updated. Please log in with your new email.' });
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
