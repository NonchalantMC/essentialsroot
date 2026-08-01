const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const FirestoreService = require('../services/FirestoreService');
const { protect, adminOnly } = require('../middleware/auth');
const { sendEmailChangeConfirmation } = require('../utils/email');

const UserService    = new FirestoreService('users');
const ProductService = new FirestoreService('products');
const OrderService   = new FirestoreService('orders');
const CouponService      = new FirestoreService('coupons');
const RedemptionService  = new FirestoreService('couponRedemptions');

router.use(protect, adminOnly);

// PUT /api/admin/change-password
// AdminSettings.jsx already called this route correctly — it just didn't
// exist server-side, so every attempt 404'd silently underneath a form that
// otherwise looked and behaved like it worked.
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    // Same policy enforced at register/reset — kept consistent rather than
    // the separate, weaker 6-char minimum the frontend form was checking.
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must include an uppercase letter' });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must include a number' });
    }

    const userId = req.user.id || req.user._id;
    const user   = await UserService.findById(userId);
    if (!user || !user.passwordHash) {
      return res.status(404).json({ message: 'Admin account not found' });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const passwordHash    = await bcrypt.hash(newPassword, 12);
    const currentVersion  = user.tokenVersion ?? 0;

    await UserService.updateById(userId, {
      passwordHash,
      // Invalidates every existing token for this account, including the
      // one making this very request — the admin will need to log in again
      // right after this succeeds. That's intentional: it's what actually
      // revokes access for anyone who had the old password/an old token.
      tokenVersion: currentVersion + 1,
    });

    res.json({ message: 'Password updated successfully. Please log in again.' });
  } catch (err) {
    console.error('change-password error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// PUT /api/admin/change-email
// Requires the current password, same principle as change-password — email
// is both the login identifier and where a password-reset link would be
// sent, so this shouldn't be changeable from a hijacked session token alone.
// This route only *starts* the change: current password confirms it's really
// the admin requesting it, but the email doesn't actually update until the
// confirmation link sent to the NEW address is clicked (POST /api/auth/
// confirm-email-change/:token in auth.js) — proving that inbox is really
// under the admin's control, not just typed into a form.
router.put('/change-email', async (req, res) => {
  try {
    const { currentPassword, newEmail } = req.body;
    if (!currentPassword || !newEmail) {
      return res.status(400).json({ message: 'Current password and new email are required' });
    }

    const normalizedEmail = String(newEmail).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const userId = req.user.id || req.user._id;
    const user   = await UserService.findById(userId);
    if (!user || !user.passwordHash) {
      return res.status(404).json({ message: 'Admin account not found' });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    if (normalizedEmail === user.email) {
      return res.status(400).json({ message: 'That is already your current email address' });
    }

    const existing = await UserService.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'That email address is already in use' });
    }

    const rawToken    = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await UserService.updateById(userId, {
      pendingEmail:       normalizedEmail,
      emailChangeToken:   hashedToken,
      emailChangeExpires: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour, same TTL as password reset
    });

    const confirmUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/confirm-email/${rawToken}`;
    sendEmailChangeConfirmation(normalizedEmail, user.name, confirmUrl)
      .catch(err => console.error('Email change confirmation send failed:', err));

    res.json({ message: `Confirmation link sent to ${normalizedEmail}. Click it to complete the change.` });
  } catch (err) {
    console.error('change-email error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      allPaidOrders,
      allCoupons
    ] = await Promise.all([
      OrderService.count({}),
      UserService.count({ role: 'customer' }),
      ProductService.count({ status: 'active' }),
      ProductService.find({ status: 'active' }, { limit: 200 }),
      OrderService.find({ paymentStatus: 'paid' }, { limit: 500 }),
      CouponService.find({}, { limit: 500 })
    ]);

    const totalRevenue = allPaidOrders.reduce((s, o) => s + (o.total || 0), 0);
    const lowStock     = lowStockProducts.filter(p => p.stock < 10 && p.stock > 0).length;

    const activeCouponsCount = allCoupons.length;
    const totalCouponRedemptions = allCoupons.reduce((sum, c) => sum + (c.usesCount || 0), 0);

    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const totalDiscountGiven = allPaidOrders.reduce((s, o) => s + (o.discountAmount || 0), 0);

    // Revenue this month vs. last month, computed from the same 500 paid
    // orders already fetched above — no extra query needed. Capped by that
    // same 500-order fetch limit, so once order volume grows past that,
    // this endpoint (and its `limit`) should be revisited.
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let revenueThisMonth = 0;
    let revenueLastMonth = 0;
    for (const order of allPaidOrders) {
      const created = new Date(order.createdAt);
      if (created >= startOfThisMonth) {
        revenueThisMonth += order.total || 0;
      } else if (created >= startOfLastMonth && created < startOfThisMonth) {
        revenueLastMonth += order.total || 0;
      }
    }
    const revenueChangePct = revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : null; // no baseline to compare against yet

    res.json({
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      lowStock,
      activeCouponsCount,
      totalCouponRedemptions,
      avgOrderValue,
      totalDiscountGiven,
      revenueThisMonth,
      revenueLastMonth,
      revenueChangePct,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Server error. Please try again.' });
  }
});

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const query = {};
    if (status) query.orderStatus = status;

    const orders = await OrderService.find(query, {
      limit:   Number(limit),
      skip:    (Number(page) - 1) * Number(limit),
      orderBy: 'createdAt',
      orderDir:'desc',
    });

    const populated = await Promise.all(
      orders.map(async o => {
        if (o.customerId) {
          const user = await UserService.findById(o.customerId);
          if (user) {
            const { passwordHash, ...safeUser } = user;
            return { ...o, customerId: safeUser };
          }
        }
        return o;
      })
    );

    const total = await OrderService.count(query);
    res.json({ orders: populated, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Server error. Please try again.' });
  }
});

// GET /api/admin/customers
router.get('/customers', async (req, res) => {
  try {
    const customers = await UserService.find(
      { role: 'customer' },
      { limit: 100, orderBy: 'createdAt', orderDir: 'desc' }
    );
    const safe = customers.map(({ passwordHash, ...u }) => u);
    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Server error. Please try again.' });
  }
});

// GET /api/admin/coupons
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await CouponService.find({}, { limit: 500, orderBy: 'createdAt', orderDir: 'desc' });
    res.json(coupons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Server error. Please try again.' });
  }
});

// POST /api/admin/coupons
router.post('/coupons', async (req, res) => {
  try {
    const { 
      code, type, discountType, value, discountValue, 
      minTotal, minSubtotalRequired, maxClaims, usageLimit, expiresAt,
      couponType,
    } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required.' });
    }

    const cleanedCode = String(code).toUpperCase().trim();

    const existingCoupon = await CouponService.findOne({ code: cleanedCode });
    if (existingCoupon) {
      return res.status(400).json({ message: 'A coupon with this code already exists.' });
    }

    const couponPayload = {
      code: cleanedCode,
      type: type || discountType || 'percentage',
      discountType: discountType || type || 'percentage',
      value: Number(value || discountValue || 0),
      discountValue: Number(discountValue || value || 0),
      minTotal: Number(minTotal || minSubtotalRequired || 0),
      minSubtotalRequired: Number(minSubtotalRequired || minTotal || 0),
      maxClaims: maxClaims || usageLimit ? Number(maxClaims || usageLimit) : null,
      usageLimit: usageLimit || maxClaims ? Number(usageLimit || maxClaims) : null,
      currentClaims: 0,
      usageCount: 0,
      usesCount: 0,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      status: 'active',
      isActive: true,
      // 'welcome' → shown as a one-click chip to first-time users only.
      // 'promo'   → never shown as a chip; must be entered manually. Default.
      couponType: couponType === 'welcome' ? 'welcome' : 'promo',
      createdAt: new Date().toISOString()
    };

    const newCoupon = await CouponService.create(couponPayload);
    res.status(201).json({ success: true, data: newCoupon, message: 'Coupon rule created successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Server error. Please try again.' });
  }
});

// PATCH /api/admin/coupons/:idOrCode/status
// FIXED: Finds coupon by standard internal ID string, with automatic fallback lookup by coupon code alphanumeric matching
router.patch('/coupons/:idOrCode/status', async (req, res) => {
  try {
    const { idOrCode } = req.params;
    const { isActive } = req.body;

    let targetDoc = null;
    try {
      targetDoc = await CouponService.findById(idOrCode);
    } catch (e) {}

    if (!targetDoc) {
      const match = await CouponService.findOne({ code: String(idOrCode).toUpperCase().trim() });
      if (match) targetDoc = match;
    }

    if (!targetDoc) {
      return res.status(404).json({ message: 'Coupon record not found.' });
    }

    const docId = targetDoc.id || targetDoc._id || idOrCode;
    await CouponService.updateById(docId, {
      isActive: Boolean(isActive),
      status: isActive ? 'active' : 'inactive'
    });

    res.json({ success: true, message: 'Coupon status modified successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Server error. Please try again.' });
  }
});

// GET /api/admin/coupons/:idOrCode/redemptions
// Returns the full usage audit trail for a specific coupon — who used it,
// when, on which order, and whether they were a guest or registered user.
router.get('/coupons/:idOrCode/redemptions', async (req, res) => {
  try {
    const { idOrCode } = req.params;
    const cleanedCode  = String(idOrCode).toUpperCase().trim();

    const redemptions  = await RedemptionService.find(
      { couponCode: cleanedCode },
      { limit: 200, orderBy: 'redeemedAt', orderDir: 'desc' }
    );

    res.json(redemptions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Server error.' });
  }
});

// DELETE /api/admin/coupons/:idOrCode
// FIXED: Finds coupon by standard internal ID string, with automatic fallback lookup by coupon code alphanumeric matching
router.delete('/coupons/:idOrCode', async (req, res) => {
  try {
    const { idOrCode } = req.params;

    let targetDoc = null;
    try {
      targetDoc = await CouponService.findById(idOrCode);
    } catch (e) {}

    if (!targetDoc) {
      const match = await CouponService.findOne({ code: String(idOrCode).toUpperCase().trim() });
      if (match) targetDoc = match;
    }

    if (!targetDoc) {
      return res.status(404).json({ message: 'Coupon record not found.' });
    }

    const docId = targetDoc.id || targetDoc._id || idOrCode;
    await CouponService.deleteById(docId);
    res.json({ success: true, message: 'Coupon rule deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Server error. Please try again.' });
  }
});

module.exports = router;