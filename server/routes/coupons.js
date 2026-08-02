const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase');
const FirestoreService = require('../services/FirestoreService');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

const CouponService      = new FirestoreService('coupons');
const OrderService       = new FirestoreService('orders');
const UserService        = new FirestoreService('users');
const RedemptionService  = new FirestoreService('couponRedemptions');

// ─── SINGLE SOURCE OF TRUTH: coupon validation ────────────────────────────────
// All coupon logic — rules checks, per-customer deduplication, discount math —
// lives here. orders.js imports and calls this; nothing is reimplemented inline.
async function verifyCouponLogic(code, subtotal, customerId = null, customerPhone = null) {
  if (!code) return { valid: false, message: 'No coupon code provided.' };

  const cleanedCode = String(code).toUpperCase().trim();
  const coupon = await CouponService.findOne({ code: cleanedCode });

  // Single generic message for all invalid/inactive/expired/limit states.
  // Distinct messages would let an attacker distinguish which codes exist
  // in the system by observing different error responses (timing oracle).
  const INVALID_MSG = 'Invalid or expired promo code.';

  if (!coupon)                                                                  return { valid: false, message: INVALID_MSG };
  if (coupon.isActive === false || coupon.status === 'inactive')                return { valid: false, message: INVALID_MSG };
  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt))              return { valid: false, message: INVALID_MSG };
  if (coupon.usageLimit && (coupon.usageCount || coupon.currentClaims || 0) >= coupon.usageLimit) return { valid: false, message: INVALID_MSG };
  if (subtotal < (coupon.minSubtotalRequired || coupon.minTotal || 0)) {
    return {
      valid: false,
      message: `Minimum order subtotal of UGX ${(coupon.minSubtotalRequired || coupon.minTotal || 0).toLocaleString()} required.`
    };
  }

  // ── Per-customer single-use check ──────────────────────────────────────────
  let targetCustomerId = customerId;

  if (!targetCustomerId && customerPhone) {
    const userProfile = await UserService.findOne({ phone: customerPhone });
    if (userProfile) targetCustomerId = userProfile._id || userProfile.id;
  }

  if (targetCustomerId) {
    const historicalOrders = await OrderService.find({ customerId: targetCustomerId });
    const hasAlreadyUsed = historicalOrders.some(
      order => order.couponCode === cleanedCode && order.orderStatus !== 'cancelled'
    );
    if (hasAlreadyUsed) {
      return { valid: false, message: 'You have already used this promo code once.' };
    }
  }

  // ── Discount calculation ───────────────────────────────────────────────────
  const rawValue     = coupon.discountValue || coupon.value || 0;
  const discountType = coupon.discountType  || coupon.type;
  let discount = 0;

  if (discountType === 'fixed') {
    discount = rawValue;
  } else if (discountType === 'percentage') {
    discount = Math.round((subtotal * rawValue) / 100);
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }
  }

  if (discount > subtotal) discount = subtotal;

  return {
    valid:         true,
    discount,
    discountType,
    discountValue: rawValue,
    couponDocId:   coupon._id || coupon.id,
    couponCode:    cleanedCode,
  };
}

// ─── SINGLE SOURCE OF TRUTH: coupon apply + usage increment ──────────────────
// Called by both order-creation routes (authenticated + guest) after the order
// has been validated but before it's written, so usage is only incremented for
// orders that actually complete. Uses FieldValue.increment() so concurrent
// checkouts with the same limited-use coupon can't both read the same count and
// each write count+1 (the race condition the old read-add-write pattern had).
async function applyCouponToOrder(couponCode, subtotal, customerId = null, customerPhone = null, orderContext = {}) {
  // Require at least one identity anchor — without either a customerId or a
  // phone number we can't run the per-customer deduplication check, which
  // means the same coupon could be used unlimited times by anonymous guests.
  if (!customerId && !customerPhone) {
    const err = new Error('A phone number is required to apply a promo code.');
    err.status = 400;
    throw err;
  }

  const result = await verifyCouponLogic(couponCode, subtotal, customerId, customerPhone);

  if (!result.valid) {
    const err = new Error(result.message);
    err.status = 400;
    throw err;
  }

  // Resolve the same identity anchor verifyCouponLogic used internally, so
  // the lock document below is keyed consistently for registered and guest
  // customers alike.
  let targetCustomerId = customerId;
  if (!targetCustomerId && customerPhone) {
    const userProfile = await UserService.findOne({ phone: customerPhone });
    if (userProfile) targetCustomerId = userProfile._id || userProfile.id;
  }

  const lockId    = `${result.couponDocId}__${targetCustomerId || customerPhone}`;
  const lockRef   = db.collection('couponUsageLocks').doc(lockId);
  const couponRef = db.collection('coupons').doc(String(result.couponDocId));

  // verifyCouponLogic's dedup check (above) reads historical orders — but
  // that read and the order's eventual creation aren't the same operation,
  // so two near-simultaneous requests (a double-click, two open tabs, a
  // scripted burst) could both pass that check before either order exists,
  // and both apply a "once per customer" coupon. Wrapping the check-and-mark
  // step in a single Firestore transaction against a deterministic
  // (coupon, customer) lock document closes that gap: Firestore guarantees
  // only one transaction touching the same document can commit — the other
  // is retried, sees the lock now exists, and throws.
  await db.runTransaction(async (t) => {
    const [lockSnap, couponSnap] = await Promise.all([t.get(lockRef), t.get(couponRef)]);

    if (lockSnap.exists) {
      const err = new Error('You have already used this promo code once.');
      err.status = 400;
      throw err;
    }

    // Same race, one door over: verifyCouponLogic's usageLimit check above
    // is a plain read outside any transaction, so a coupon capped at, say,
    // 100 total uses could be over-redeemed by concurrent requests all
    // reading count=99 before any of them commits. Re-checking the limit
    // here, against the count as read inside this same transaction, closes
    // that the same way the per-customer lock above does.
    const liveCoupon = couponSnap.data();
    const liveLimit   = liveCoupon?.usageLimit;
    const liveCount    = liveCoupon?.usageCount || liveCoupon?.currentClaims || 0;
    if (liveLimit && liveCount >= liveLimit) {
      const err = new Error('Invalid or expired promo code.');
      err.status = 400;
      throw err;
    }

    t.set(lockRef, {
      couponCode:    result.couponCode,
      couponDocId:   result.couponDocId,
      customerId:    targetCustomerId || null,
      customerPhone: customerPhone    || null,
      createdAt:     new Date().toISOString(),
    });
    t.update(couponRef, {
      usageCount:    admin.firestore.FieldValue.increment(1),
      currentClaims: admin.firestore.FieldValue.increment(1),
      usesCount:     admin.firestore.FieldValue.increment(1),
    });
  });

  // Write a redemption record — this is the audit trail that lets you see
  // exactly who used each coupon, when, and on which order.
  await RedemptionService.create({
    couponCode:    result.couponCode,
    couponDocId:   result.couponDocId,
    customerId:    customerId   || null,
    customerPhone: customerPhone || null,
    customerType:  customerId ? 'registered' : 'guest',
    discountAmount:result.discount,
    subtotal,
    orderNumber:   orderContext.orderNumber || null,
    redeemedAt:    new Date().toISOString(),
  });

  return {
    discountAmount: result.discount,
    appliedCoupon:  result.couponCode,
  };
}

// GET /api/coupons/available (logged-in users — returns eligible clickable coupons)
// Returns active, non-expired coupons the requesting user hasn't already used.
// Guests are not served this endpoint — they have no order history to check against.
router.get('/available', optionalAuth, async (req, res) => {
  try {
    const userId     = req.user?._id || req.user?.id || null;
    const guestPhone = req.query.phone || null;

    // Serve logged-in users by userId, verified guests by phone.
    if (!userId && !guestPhone) return res.json([]);

    const now = new Date();
    const allCoupons = await CouponService.find(
      { isActive: true },
      { limit: 50, orderBy: 'createdAt', orderDir: 'desc' }
    );

    // Only 'welcome' coupons are ever shown as clickable chips. 'promo'
    // coupons must be entered manually — they never surface here, so a
    // seasonal or campaign code isn't exposed to every visitor by default.
    const activeCoupons = allCoupons.filter(c =>
      c.couponType === 'welcome' &&
      c.status !== 'inactive' &&
      (!c.expiresAt || new Date(c.expiresAt) > now) &&
      (!c.usageLimit || (c.usageCount || c.currentClaims || 0) < c.usageLimit)
    );

    if (activeCoupons.length === 0) return res.json([]);

    // Resolve identity — logged-in userId, or a guest user record by phone
    let resolvedId = userId;
    if (!resolvedId && guestPhone) {
      const guestUser = await UserService.findOne({ phone: guestPhone });
      resolvedId = guestUser?._id || guestUser?.id || null;
    }

    // Welcome coupons are for first-time customers only — anyone with a
    // past non-cancelled order has already made their first purchase and
    // should not see welcome chips (they may still type a promo code manually).
    let isFirstTimeCustomer = true;
    let usedCodes = new Set();
    if (resolvedId) {
      const pastOrders = await OrderService.find({ customerId: resolvedId });
      const realOrders = pastOrders.filter(o => o.orderStatus !== 'cancelled');
      isFirstTimeCustomer = realOrders.length === 0;
      usedCodes = new Set(realOrders.filter(o => o.couponCode).map(o => o.couponCode));
    }

    if (!isFirstTimeCustomer) return res.json([]);

    const eligible = activeCoupons
      .filter(c => !usedCodes.has(c.code))
      .map(c => ({
        code:                c.code,
        discountType:        c.discountType || c.type,
        discountValue:       c.discountValue || c.value,
        minSubtotalRequired: c.minSubtotalRequired || c.minTotal || 0,
        expiresAt:           c.expiresAt || null,
      }));

    res.json(eligible);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Server error.' });
  }
});

// POST /api/coupons/validate (coupon apply button in checkout)
router.post('/validate', optionalAuth, async (req, res) => {
  try {
    const { code, subtotal, customerId, phone } = req.body;

    const activeUserId = req.user?._id || req.user?.id || customerId || null;
    const activePhone  = phone || req.user?.phone || null;

    const evaluation = await verifyCouponLogic(code, subtotal, activeUserId, activePhone);

    if (!evaluation.valid) {
      return res.status(400).json({ message: evaluation.message });
    }

    res.json({
      coupon: {
        code:          evaluation.couponCode,
        discountType:  evaluation.discountType,
        discountValue: evaluation.discountValue,
        discount:      evaluation.discount,
      },
      message: 'Promo code applied successfully!'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Server error. Please try again.' });
  }
});

// POST /api/coupons (admin: create coupon)
router.post('/', protect, adminOnly, async (req, res) => {
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
      code:               cleanedCode,
      type:               type        || discountType || 'percentage',
      discountType:       discountType || type        || 'percentage',
      value:              Number(value        || discountValue || 0),
      discountValue:      Number(discountValue || value        || 0),
      minTotal:           Number(minTotal           || minSubtotalRequired || 0),
      minSubtotalRequired:Number(minSubtotalRequired || minTotal           || 0),
      maxClaims:          maxClaims  || usageLimit  ? Number(maxClaims  || usageLimit)  : null,
      usageLimit:         usageLimit || maxClaims   ? Number(usageLimit || maxClaims)   : null,
      currentClaims:      0,
      usageCount:         0,
      usesCount:          0,
      expiresAt:          expiresAt ? new Date(expiresAt).toISOString() : null,
      status:             'active',
      isActive:           true,
      couponType:         couponType === 'welcome' ? 'welcome' : 'promo',
      createdAt:          new Date().toISOString()
    };

    const newCoupon = await CouponService.create(couponPayload);
    res.status(201).json({ success: true, data: newCoupon, message: 'Coupon rule created successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Server error. Please try again.' });
  }
});

module.exports = router;
module.exports.verifyCouponLogic  = verifyCouponLogic;
module.exports.applyCouponToOrder = applyCouponToOrder;
