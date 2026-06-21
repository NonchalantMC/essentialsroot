const express = require('express');
const router = express.Router();
const FirestoreService = require('../services/FirestoreService');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

const CouponService = new FirestoreService('coupons');
const OrderService  = new FirestoreService('orders');
const UserService   = new FirestoreService('users');

// Centralized helper function to verify coupon values with strict user limits
async function verifyCouponLogic(code, subtotal, customerId = null, customerPhone = null) {
  if (!code) return { valid: false, message: 'No coupon code provided.' };
  
  // Find code case-insensitively and trimmed
  const cleanedCode = String(code).toUpperCase().trim();
  const coupon = await CouponService.findOne({ code: cleanedCode });
  
  if (!coupon) {
    return { valid: false, message: 'Invalid promo code.' };
  }
  if (coupon.isActive === false || coupon.status === 'inactive') {
    return { valid: false, message: 'This promo code is no longer active.' };
  }
  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
    return { valid: false, message: 'This promo code has expired.' };
  }
  if (coupon.usageLimit && (coupon.usageCount || coupon.currentClaims || 0) >= coupon.usageLimit) {
    return { valid: false, message: 'This promo code usage limit has been reached.' };
  }
  if (subtotal < (coupon.minSubtotalRequired || coupon.minTotal || 0)) {
    return { 
      valid: false, 
      message: `Minimum order subtotal of UGX ${(coupon.minSubtotalRequired || coupon.minTotal || 0).toLocaleString()} required.` 
    };
  }

  // ─── STRICTOR ONE-USE-PER-CUSTOMER VALIDATION CHECK ────────────────────────
  let targetCustomerId = customerId;

  if (!targetCustomerId && customerPhone) {
    const userProfile = await UserService.findOne({ phone: customerPhone });
    if (userProfile) {
      targetCustomerId = userProfile._id || userProfile.id;
    }
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

  // Deduce accurate discount values
  let discount = 0;
  const rawValue = coupon.discountValue || coupon.value || 0;
  const discountType = coupon.discountType || coupon.type;

  if (discountType === 'fixed') {
    discount = rawValue;
  } else if (discountType === 'percentage') {
    discount = Math.round((subtotal * rawValue) / 100);
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }
  }

  // Safeguard: Ensure discount never exceeds product subtotal
  if (discount > subtotal) discount = subtotal;

  return {
    valid: true,
    discount,
    discountType,
    discountValue: rawValue,
    couponDocId: coupon._id || coupon.id
  };
}

// POST /api/coupons/validate (For frontend coupon apply button)
router.post('/validate', optionalAuth, async (req, res) => {
  try {
    const { code, subtotal, customerId, phone } = req.body;
    
    const activeUserId = req.user?._id || req.user?.id || customerId || null;
    const activePhone = phone || req.user?.phone || null;

    const evaluation = await verifyCouponLogic(code, subtotal, activeUserId, activePhone);
    
    if (!evaluation.valid) {
      return res.status(400).json({ message: evaluation.message });
    }
    
    res.json({
      coupon: {
        code: code.toUpperCase().trim(),
        discountType: evaluation.discountType,
        discountValue: evaluation.discountValue,
        discount: evaluation.discount
      },
      message: 'Promo code applied successfully!'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/coupons
// Alternative gateway for direct coupon postings protected by admin credentials
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { 
      code, type, discountType, value, discountValue, 
      minTotal, minSubtotalRequired, maxClaims, usageLimit, expiresAt 
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
      createdAt: new Date().toISOString()
    };

    const newCoupon = await CouponService.create(couponPayload);
    res.status(201).json({ success: true, data: newCoupon, message: 'Coupon rule created successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
module.exports.verifyCouponLogic = verifyCouponLogic;