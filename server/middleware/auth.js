const jwt = require('jsonwebtoken');
const FirestoreService = require('../services/FirestoreService');

const UserService = new FirestoreService('users');

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await UserService.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Identifies a logged-in user via JWT when present, but never blocks the
// request if the token is missing/invalid — for routes guests must also
// reach (e.g. coupon validation), where we still want req.user populated
// for logged-in customers without forcing auth on everyone.
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token   = header.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await UserService.findById(decoded.id);
      if (user) req.user = user;
    }
  } catch (err) {
    // Invalid/expired token on an optional-auth route — proceed as a guest
  }
  next();
};

module.exports = { protect, adminOnly, optionalAuth };
