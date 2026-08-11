const express  = require('express');
const router   = express.Router();
const FirestoreService = require('../services/FirestoreService');
const { admin } = require('../config/firebase');
const { protect, adminOnly } = require('../middleware/auth');
const { calculateServerDeliveryFee } = require('../utils/deliveryZones');
const { sendOtpSMS, sendOrderShippedSMS } = require('../utils/sms');
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

// ==========================================
// GUEST SMS OTP VERIFICATION ENDPOINTS
// ==========================================

const OTP_MAX_ATTEMPTS = 5;

router.post('/guest/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

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

    await OtpService.updateById(otpRecord._id || otpRecord.id, {
      code: null,
      verified: true,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });

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

    const pricing = await revalidateOrderItems(items);
    if (!pricing.valid) {
      return res.status(pricing.status).json({ message: pricing.message, priceChanges: pricing.priceChanges });
    }
    const { items: trustedItems, subtotal } = pricing;

    const verifiedDelivery = calculateServerDeliveryFee(shippingAddress?.city, subtotal);

    if (!verifiedDelivery.isValid) {
      return res.status(400).json({ message: 'Please select a valid delivery town from the list.' });
    }

    let discountAmount = 0;
    let appliedCoupon  = null;

    const orderNumber = await generateOrderNumber();

    if (couponCode) {
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

    // NOTE: Admin alerts and customer notifications are handled strictly in payments.js handlePaid()
    // after PesaPal confirms payment.
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    const isKnown = Boolean(err.status);
    const msg = (isKnown || process.env.NODE_ENV === 'development') ? err.message : 'Bad request.';
    res.status(err.status || 400).json({ message: msg });
  }
});

// POST /api/orders/guest (GUEST USERS)
router.post('/guest', async (req, res) => {
  try {
    const { guestInfo, shippingAddress, couponCode, items, ...rest } = req.body;

    if (!guestInfo?.phone) {
      return res.status(400).json({ message: 'A verified phone number is required to place a guest order.' });
    }
    const verifiedRecord = await OtpService.findOne({ phone: guestInfo.phone, verified: true });
    if (!verifiedRecord || new Date() > new Date(verifiedRecord.expiresAt)) {
      return res.status(403).json({ message: 'Please verify your phone number before placing this order.' });
    }

    const pricing = await revalidateOrderItems(items);
    if (!pricing.valid) {
      return res.status(pricing.status).json({ message: pricing.message, priceChanges: pricing.priceChanges });
    }
    const { items: trustedItems, subtotal } = pricing;

    const verifiedDelivery = calculateServerDeliveryFee(shippingAddress?.city, subtotal);

    if (!verifiedDelivery.isValid) {
      return res.status(400).json({ message: 'Please select a valid delivery town from the list.' });
    }

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

    await OtpService.deleteById(verifiedRecord._id || verifiedRecord.id);

    // NOTE: Admin alerts and customer notifications are handled strictly in payments.js handlePaid()
    // after PesaPal confirms payment.
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

    if (orderStatus === 'cancelled' && order.orderStatus !== 'cancelled' && order.paymentStatus === 'paid') {
      const batch = admin.firestore().batch();
      for (const item of order.items || []) {
        if (!item.productId || !item.quantity) continue;
        const ref = admin.firestore().collection('products').doc(String(item.productId));
        batch.update(ref, { stock: admin.firestore.FieldValue.increment(item.quantity) });
      }
      try {
        await batch.commit();
      } catch (err) {
        console.error('Stock restoration failed for cancelled order', order.orderNumber, err.message);
      }
    }

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