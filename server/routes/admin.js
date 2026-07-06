const express  = require('express');
const router   = express.Router();
const FirestoreService = require('../services/FirestoreService');
const { protect, adminOnly } = require('../middleware/auth');

const UserService    = new FirestoreService('users');
const ProductService = new FirestoreService('products');
const OrderService   = new FirestoreService('orders');
const CouponService      = new FirestoreService('coupons');
const RedemptionService  = new FirestoreService('couponRedemptions');

router.use(protect, adminOnly);

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

    res.json({ 
      totalOrders, 
      totalRevenue, 
      totalCustomers, 
      totalProducts, 
      lowStock,
      activeCouponsCount,
      totalCouponRedemptions
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