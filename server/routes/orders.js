const express  = require('express');
const router   = express.Router();
const FirestoreService = require('../services/FirestoreService');
const { protect, adminOnly } = require('../middleware/auth');
const { calculateServerDeliveryFee } = require('../utils/deliveryZones');
const { sendSMS, sendOtpSMS, sendOrderPlacedSMS, sendOrderShippedSMS } = require('../utils/sms');
const { notifyAdminOfNewOrder } = require('../utils/email');
const { revalidateOrderItems } = require('../utils/orderPricing');
const { applyCouponToOrder } = require('./coupons');

const OrderService = new FirestoreService('orders');
const UserService  = new FirestoreService('users');
const OtpService   = new FirestoreService('otps'); // Tracks verification state

// Generate sequential order number using Firestore transaction
async function generateOrderNumber() {
  const next = await OrderService.getNextCounter('orders');
  return `E256-${String(next).padStart(6, '0')}`;
}

// Fires both admin notification channels for a new order — SMS (instant,
// via Africa's Talking) and email (detailed, via Brevo). Each implementation
// lives in its own utility (sms.js / email.js); this just calls both so
// order-creation keeps the same two-channel alert it always has, without
// either channel being reimplemented here.
async function alertAdminOfNewOrder(order, customerName, customerPhone) {
  if (process.env.ADMIN_PHONE) {
    sendSMS({
      to: process.env.ADMIN_PHONE,
      message: `🎉 New Order! ${order.orderNumber} placed by ${customerName} (${customerPhone}) for UGX ${order.total?.toLocaleString()}. Check your admin panel.`
    }).catch(err => console.error('Admin SMS alert failed:', err));
  }
  notifyAdminOfNewOrder(order, customerName, customerPhone)
    .catch(err => console.error('Admin email alert failed:', err));
}

// ==========================================
// GUEST SMS OTP VERIFICATION ENDPOINTS
// ==========================================

// Failed-guess ceiling per OTP record, on top of the IP/phone-keyed rate
// limiter in server.js. Defense in depth: even if someone found a way around
// the request-level limiter, a single OTP record can't be brute-forced.
const OTP_MAX_ATTEMPTS = 5;

router.post('/guest/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Clear any outstanding OTPs for this number first, so only the most
    // recently sent code is ever valid — avoids stacking up guessable codes.
    const existing = await OtpService.find({ phone }, { limit: 20 });
    await Promise.all(existing.map(r => OtpService.deleteById(r._id || r.id)));

    const otpCode   = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await OtpService.create({
      phone,
      code: otpCode,
      expiresAt,
      attempts: 0,
      createdAt: new Date().toISOString()
    });

    await sendOtpSMS(phone, otpCode);

    res.status(200).json({ message: 'Verification SMS sent successfully' });
  } catch (err) {
    console.error('OTP send error:', err);
    res.status(500).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Server error. Please try again.' });
  }
});

router.post('/guest/verify-otp', async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ message: 'Phone number and code are required' });
    }

    const otpRecord = await OtpService.findOne({ phone });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await OtpService.deleteById(otpRecord._id || otpRecord.id);
      return res.status(400).json({ message: 'Verification code has expired. Please try again.' });
    }

    if ((otpRecord.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      await OtpService.deleteById(otpRecord._id || otpRecord.id);
      return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new code.' });
    }

    if (String(code).trim() !== otpRecord.code) {
      await OtpService.updateById(otpRecord._id || otpRecord.id, { attempts: (otpRecord.attempts ?? 0) + 1 });
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Invalidate the OTP immediately — prevents replay of the same code
    // within the 5-minute window if intercepted or observed.
    await OtpService.deleteById(otpRecord._id || otpRecord.id);

    res.status(200).json({ success: true, message: 'Phone number verified successfully' });
  } catch (err) {
    console.error('OTP Verification Internal Error:', err);
    res.status(500).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Server error. Please try again.' });
  }
});

// ==========================================
// REGULAR ORDER MANAGEMENT ROUTES
// ==========================================

// POST /api/orders (AUTHENTICATED USER)
router.post('/', protect, async (req, res) => {
  try {
    const { shippingAddress, couponCode, items } = req.body;
    const userId = req.user._id || req.user.id;

    // Re-price every item against the live product catalog — the client's
    // submitted price/subtotal is never trusted from here on. Closes the
    // price-tampering gap where a modified request could set any price.
    const pricing = await revalidateOrderItems(items);
    if (!pricing.valid) {
      return res.status(pricing.status).json({ message: pricing.message, priceChanges: pricing.priceChanges });
    }
    const { items: trustedItems, subtotal } = pricing;

    const verifiedDelivery = calculateServerDeliveryFee(shippingAddress?.city, subtotal);

    let discountAmount = 0;
    let appliedCoupon  = null;

    const orderNumber = await generateOrderNumber();

    if (couponCode) {
      // All validation, deduplication, discount math, couponType gating,
      // atomic usage increment, and redemption logging is handled in one
      // place — coupons.js applyCouponToOrder. Nothing is reimplemented here.
      const couponResult = await applyCouponToOrder(
        couponCode, subtotal, userId, req.user.phone || null, { orderNumber }
      );
      discountAmount = couponResult.discountAmount;
      appliedCoupon  = couponResult.appliedCoupon;
    }

    const computedTotal = subtotal - discountAmount + verifiedDelivery.fee;

    const order = await OrderService.create({
      ...req.body,
      items:          trustedItems,
      subtotal,
      shippingFee:    verifiedDelivery.fee,
      discountAmount,
      couponCode:     appliedCoupon || null,
      total:          computedTotal,
      deliveryZone:   verifiedDelivery.label,
      orderNumber,
      customerId:     userId,
      paymentStatus:  'pending',
      orderStatus:    'pending',
      statusHistory:  [{ status: 'pending', note: 'Order placed', updatedAt: new Date().toISOString() }],
    });

    alertAdminOfNewOrder(order, req.user.name || 'Registered Customer', req.user.phone || 'N/A');
    if (req.user.phone) sendOrderPlacedSMS(req.user.phone, order.orderNumber, order.total);
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    // err.status is set by applyCouponToOrder/revalidateOrderItems for
    // expected validation failures — their messages are already safe to
    // show. Anything without a status is an unexpected error, sanitised
    // in production the same way as every other route.
    const isKnown = Boolean(err.status);
    const msg = (isKnown || process.env.NODE_ENV === 'development') ? err.message : 'Bad request.';
    res.status(err.status || 400).json({ message: msg });
  }
});

// POST /api/orders/guest (GUEST USERS)
router.post('/guest', async (req, res) => {
  try {
    const { guestInfo, shippingAddress, couponCode, items, ...rest } = req.body;

    // Re-price every item against the live product catalog — same trust
    // boundary applied to guest checkout as authenticated checkout.
    const pricing = await revalidateOrderItems(items);
    if (!pricing.valid) {
      return res.status(pricing.status).json({ message: pricing.message, priceChanges: pricing.priceChanges });
    }
    const { items: trustedItems, subtotal } = pricing;

    const verifiedDelivery = calculateServerDeliveryFee(shippingAddress?.city, subtotal);

    let guestUser = null;
    if (guestInfo?.phone) {
      guestUser = await UserService.findOne({ phone: guestInfo.phone, role: 'guest' });
      if (!guestUser) {
        const crypto = require('crypto');
        guestUser = await UserService.create({
          name:         guestInfo.name  || 'Guest',
          phone:        guestInfo.phone,
          role:         'guest',
          passwordHash: crypto.randomBytes(32).toString('hex'),
        });
      }
    }

    const resolvedGuestId = guestUser?._id || guestUser?.id || null;
    let discountAmount = 0;
    let appliedCoupon  = null;

    const orderNumber = await generateOrderNumber();

    if (couponCode) {
      // Same single-source coupon logic as the authenticated route —
      // applyCouponToOrder requires either resolvedGuestId or a phone
      // number, so an anonymous guest with no identity anchor can't
      // apply a coupon at all (closes the unlimited-reuse gap).
      const couponResult = await applyCouponToOrder(
        couponCode, subtotal, resolvedGuestId, guestInfo?.phone || null, { orderNumber }
      );
      discountAmount = couponResult.discountAmount;
      appliedCoupon  = couponResult.appliedCoupon;
    }

    const computedTotal = subtotal - discountAmount + verifiedDelivery.fee;

    const order = await OrderService.create({
      ...rest,
      items:         trustedItems,
      subtotal,
      shippingAddress,
      discountAmount,
      couponCode:    appliedCoupon || null,
      shippingFee:   verifiedDelivery.fee,
      total:         computedTotal,
      deliveryZone:  verifiedDelivery.label,
      orderNumber,
      customerId:    resolvedGuestId,
      guestInfo:     guestInfo || null,
      paymentStatus: 'pending',
      orderStatus:   'pending',
      statusHistory: [{ status: 'pending', note: 'Guest order placed', updatedAt: new Date().toISOString() }],
    });

    alertAdminOfNewOrder(order, guestInfo?.name || 'Guest Customer', guestInfo?.phone || 'N/A');
    if (guestInfo?.phone) sendOrderPlacedSMS(guestInfo.phone, order.orderNumber, order.total);
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    const isKnown = Boolean(err.status);
    const msg = (isKnown || process.env.NODE_ENV === 'development') ? err.message : 'Bad request.';
    res.status(err.status || 400).json({ message: msg });
  }
});

// GET /api/orders/my (authenticated)
router.get('/my', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const orders = await OrderService.find(
      { customerId: userId },
      { limit: 20, orderBy: 'createdAt', orderDir: 'desc' }
    );
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Server error. Please try again.' });
  }
});

// GET /api/orders/:orderNumber (authenticated)
router.get('/:orderNumber', protect, async (req, res) => {
  try {
    const order = await OrderService.findOne({ orderNumber: req.params.orderNumber });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const userId  = req.user._id || req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && order.customerId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Server error. Please try again.' });
  }
});

// PATCH /api/orders/:id/status (admin)
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { orderStatus, note, trackingNumber } = req.body;
    const order = await OrderService.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const statusHistory = [
      ...(order.statusHistory || []),
      { status: orderStatus, note: note || '', updatedAt: new Date().toISOString() },
    ];
    const updates = { orderStatus, statusHistory };
    if (trackingNumber) updates.trackingNumber = trackingNumber;

    const updated = await OrderService.updateById(req.params.id, updates);

    // Notify the customer by SMS when admin marks the order as shipped
    if (orderStatus === 'shipped') {
      const customerPhone = order.guestInfo?.phone || order.shippingAddress?.phone || null;
      if (customerPhone) sendOrderShippedSMS(customerPhone, order.orderNumber);
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Bad request.' });
  }
});

module.exports = router;
module.exports.OrderService = OrderService;