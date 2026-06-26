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

    // tokenVersion check — if the user's stored version is ahead of the
    // token's version, the token was issued before a logout/revocation and
    // is no longer valid. Existing accounts without tokenVersion pass through
    // (treated as version 0) until they next log in and get a versioned token.
    const tokenVer = decoded.tokenVersion ?? 0;
    const userVer  = user.tokenVersion    ?? 0;
    if (tokenVer < userVer) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

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

const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token   = header.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await UserService.findById(decoded.id);
      if (user) {
        // Apply the same tokenVersion check as protect
        const tokenVer = decoded.tokenVersion ?? 0;
        const userVer  = user.tokenVersion    ?? 0;
        if (tokenVer >= userVer) req.user = user;
      }
    }
  } catch (err) {
    // Invalid/expired token on an optional-auth route — proceed as guest
  }
  next();
};

module.exports = { protect, adminOnly, optionalAuth };
