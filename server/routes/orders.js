const express  = require('express');
const router   = express.Router();
const FirestoreService = require('../services/FirestoreService');
const { protect, adminOnly } = require('../middleware/auth');
const { calculateServerDeliveryFee } = require('../utils/deliveryZones');
const { sendSMS, sendOtpSMS, sendOrderPlacedSMS, sendOrderShippedSMS } = require('../utils/sms');

const OrderService  = new FirestoreService('orders');
const UserService   = new FirestoreService('users');
const OtpService    = new FirestoreService('otps'); // Tracks verification state
const CouponService = new FirestoreService('coupons'); // Tracks active discount strategies

// Generate sequential order number using Firestore transaction
async function generateOrderNumber() {
  const next = await OrderService.getNextCounter('orders');
  return `E256-${String(next).padStart(6, '0')}`;
}

// ─── CENTRALIZED ADMIN NOTIFICATION HELPER ────────────────────────────────────
async function notifyAdminOfNewOrder(order, customerName, customerPhone) {
  const adminPhone = process.env.ADMIN_PHONE;
  const adminEmail = process.env.ADMIN_EMAIL;
  const brevoApiKey = process.env.BREVO_API_KEY;

  // 1. Instant SMS Alert via Africa's Talking (via utils/sms.js)
  if (adminPhone) {
    sendSMS({
      to: adminPhone,
      message: `🎉 New Order! ${order.orderNumber} placed by ${customerName} (${customerPhone}) for UGX ${order.total?.toLocaleString()}. Check your admin panel.`
    }).catch(err => console.error('Admin SMS alert failed:', err));
  }

  // 2. Rich Detailed Email Alert via Brevo API
  try {
    if (brevoApiKey && adminEmail) {
      let itemsHtml = '';
      if (Array.isArray(order.items)) {
        itemsHtml = `
          <h3 style="color: #141414; border-bottom: 1px solid #ede9e2; padding-bottom: 8px;">Ordered Items</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            ${order.items.map(item => `
              <tr>
                <td style="padding: 8px 0; text-align: left;"><strong>${item.name}</strong> (x${item.qty || 1})</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">UGX ${(item.price * (item.qty || 1)).toLocaleString()}</td>
              </tr>
            `).join('')}
          </table>
        `;
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: "Essentials256 Store", email: "no-reply@essentials256.com" },
          to: [{ email: adminEmail, name: "Store Admin" }],
          subject: `🎉 New Order Notification: ${order.orderNumber}`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #ede9e2; border-radius: 16px; background-color: #fff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #2C5F2D; margin: 0; font-size: 24px;">New Order Received!</h2>
                <p style="color: #999; margin: 4px 0 0 0;">Order Reference: ${order.orderNumber}</p>
              </div>
              
              <div style="background-color: #faf7f2; padding: 15px; border-radius: 12px; margin-bottom: 20px;">
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                  <tr><td style="color: #999; padding: 4px 0;">Customer Name:</td><td style="text-align: right; font-weight: bold; color: #141414;">${customerName}</td></tr>
                  <tr><td style="color: #999; padding: 4px 0;">Phone Contact:</td><td style="text-align: right; color: #5a5a5a;">${customerPhone}</td></tr>
                  <tr><td style="color: #999; padding: 4px 0;">Delivery Zone:</td><td style="text-align: right; color: #5a5a5a;">${order.deliveryZone || 'N/A'}</td></tr>
                  <tr><td style="color: #999; padding: 4px 0;">Total Value:</td><td style="text-align: right; font-weight: bold; color: #2C5F2D; font-size: 16px;">UGX ${order.total?.toLocaleString()}</td></tr>
                </table>
              </div>

              ${itemsHtml}

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.ADMIN_PANEL_URL || 'http://localhost:3000'}/admin/orders" 
                   style="background-color: #2C5F2D; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 25px; display: inline-block;">
                  View Full Order Details
                </a>
              </div>
            </div>
          `
        })
      });

      if (!response.ok) {
        const errPayload = await response.text();
        throw new Error(`Brevo status ${response.status}: ${errPayload}`);
      }
      console.log(`Admin email alert triggered successfully via Brevo for ${order.orderNumber}`);
    }
  } catch (emailErr) {
    console.error("Failed to send admin email notification via Brevo:", emailErr);
  }
}

// ==========================================
// GUEST SMS OTP VERIFICATION ENDPOINTS
// ==========================================

router.post('/guest/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await OtpService.create({
      phone,
      code: otpCode,
      expiresAt,
      createdAt: new Date().toISOString()
    });

    await sendOtpSMS(phone, otpCode);

    res.status(200).json({ message: 'Verification SMS sent successfully' });
  } catch (err) {
    console.error('OTP send error:', err);
    res.status(500).json({ message: err.message || 'Failed to send verification SMS' });
  }
});

router.post('/guest/verify-otp', async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ message: 'Phone number and code are required' });
    }

    const otpRecord = await OtpService.findOne({ phone, code: String(code).trim() });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      return res.status(400).json({ message: 'Verification code has expired. Please try again.' });
    }

    res.status(200).json({ success: true, message: 'Phone number verified successfully' });
  } catch (err) {
    console.error("OTP Verification Internal Error:", err);
    res.status(500).json({ message: err.message || 'Verification failed' });
  }
});

// ==========================================
// COUPON LIVE VALIDATION ENDPOINT
// ==========================================

router.get('/coupons/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const subtotal = parseFloat(req.query.subtotal) || 0;
    const customerId = req.query.customerId || null;
    const phone = req.query.phone || null;

    if (!code) {
      return res.status(400).json({ valid: false, message: 'Coupon code string is required' });
    }

    const cleanedCode = String(code).trim().toUpperCase();
    const coupon = await CouponService.findOne({ code: cleanedCode });

    if (!coupon) {
      return res.status(404).json({ valid: false, message: 'Coupon code does not exist' });
    }
    if (coupon.status !== 'active' && coupon.isActive !== true) {
      return res.status(400).json({ valid: false, message: 'This coupon campaign is currently inactive' });
    }
    if (coupon.minTotal && subtotal < parseFloat(coupon.minTotal)) {
      return res.status(400).json({ 
        valid: false, 
        message: `Minimum order total of UGX ${parseFloat(coupon.minTotal).toLocaleString()} required to use this code` 
      });
    }
    if (coupon.maxClaims && (parseInt(coupon.currentClaims) || 0) >= parseInt(coupon.maxClaims)) {
      return res.status(400).json({ valid: false, message: 'This coupon code has reached its usage limit' });
    }
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return res.status(400).json({ valid: false, message: 'This coupon promotion has expired' });
    }

    // Strict user limit check live during validation
    let resolvedId = customerId;
    if (!resolvedId && phone) {
      const existingUser = await UserService.findOne({ phone });
      if (existingUser) resolvedId = existingUser._id || existingUser.id;
    }

    if (resolvedId) {
      const accountOrders = await OrderService.find({ customerId: resolvedId });
      const alreadyRedeemed = accountOrders.some(
        o => o.couponCode === cleanedCode && o.orderStatus !== 'cancelled'
      );
      if (alreadyRedeemed) {
        return res.status(400).json({ valid: false, message: 'You have already used this coupon code.' });
      }
    }

    res.status(200).json({
      valid: true,
      code: coupon.code,
      type: coupon.type || coupon.discountType,
      value: parseFloat(coupon.value || coupon.discountValue || 0),
      message: 'Coupon code validated successfully!'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ valid: false, message: err.message });
  }
});

// ==========================================
// REGULAR ORDER MANAGEMENT ROUTES
// ==========================================

// POST /api/orders (AUTHENTICATED USER)
router.post('/', protect, async (req, res) => {
  try {
    const { shippingAddress, subtotal, couponCode } = req.body;
    const verifiedDelivery = calculateServerDeliveryFee(shippingAddress?.city, subtotal);
    const userId = req.user._id || req.user.id;

    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const cleanedCode = String(couponCode).trim().toUpperCase();
      
      // Strict Check: Ensure user has no historical records using this coupon
      const customerOrders = await OrderService.find({ customerId: userId });
      const checkDoubleUse = customerOrders.some(
        o => o.couponCode === cleanedCode && o.orderStatus !== 'cancelled'
      );

      if (checkDoubleUse) {
        return res.status(400).json({ message: 'You have already applied and used this coupon code.' });
      }

      const coupon = await CouponService.findOne({ code: cleanedCode });

      if (coupon && 
          (coupon.status === 'active' || coupon.isActive === true) && 
          (!coupon.minTotal || subtotal >= parseFloat(coupon.minTotal)) &&
          (!coupon.maxClaims || (parseInt(coupon.currentClaims) || 0) < parseInt(coupon.maxClaims)) &&
          (!coupon.expiresAt || new Date() <= new Date(coupon.expiresAt))
      ) {
        const couponType = coupon.type || coupon.discountType;
        const couponValue = parseFloat(coupon.value || coupon.discountValue || 0);

        if (couponType === 'percentage') {
          discountAmount = Math.round((subtotal * couponValue) / 100);
        } else if (couponType === 'fixed') {
          discountAmount = couponValue;
        }
        if (discountAmount > subtotal) discountAmount = subtotal;
        appliedCoupon = cleanedCode;
      } else {
        return res.status(400).json({ message: 'Applied coupon failed strict validation rules.' });
      }
    }

    const orderNumber = await generateOrderNumber();
    const computedTotal = subtotal - discountAmount + verifiedDelivery.fee;

    const order = await OrderService.create({
      ...req.body,
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

    if (appliedCoupon) {
      const couponDoc = await CouponService.findOne({ code: appliedCoupon });
      if (couponDoc && (couponDoc._id || couponDoc.id)) {
        await CouponService.updateById(couponDoc._id || couponDoc.id, {
          currentClaims: (parseInt(couponDoc.currentClaims || couponDoc.usageCount) || 0) + 1,
          usageCount: (parseInt(couponDoc.usageCount || couponDoc.currentClaims) || 0) + 1
        });
      }
    }

    notifyAdminOfNewOrder(order, req.user.name || 'Registered Customer', req.user.phone || 'N/A');
    if (req.user.phone) sendOrderPlacedSMS(req.user.phone, order.orderNumber, order.total);
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

// POST /api/orders/guest (GUEST USERS)
router.post('/guest', async (req, res) => {
  try {
    const { guestInfo, shippingAddress, subtotal, couponCode, ...rest } = req.body;
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
    let appliedCoupon = null;

    if (couponCode) {
      const cleanedCode = String(couponCode).trim().toUpperCase();
      
      // Strict Check: Validate cross-referenced guest history records by compiled customer ID mapping
      if (resolvedGuestId) {
        const guestOrders = await OrderService.find({ customerId: resolvedGuestId });
        const checkGuestDoubleUse = guestOrders.some(
          o => o.couponCode === cleanedCode && o.orderStatus !== 'cancelled'
        );

        if (checkGuestDoubleUse) {
          return res.status(400).json({ message: 'This coupon code has already been used by this phone number.' });
        }
      }

      const coupon = await CouponService.findOne({ code: cleanedCode });

      if (coupon && 
          (coupon.status === 'active' || coupon.isActive === true) && 
          (!coupon.minTotal || subtotal >= parseFloat(coupon.minTotal)) &&
          (!coupon.maxClaims || (parseInt(coupon.currentClaims) || 0) < parseInt(coupon.maxClaims)) &&
          (!coupon.expiresAt || new Date() <= new Date(coupon.expiresAt))
      ) {
        const couponType = coupon.type || coupon.discountType;
        const couponValue = parseFloat(coupon.value || coupon.discountValue || 0);

        if (couponType === 'percentage') {
          discountAmount = Math.round((subtotal * couponValue) / 100);
        } else if (couponType === 'fixed') {
          discountAmount = couponValue;
        }
        if (discountAmount > subtotal) discountAmount = subtotal;
        appliedCoupon = cleanedCode;
      } else {
        return res.status(400).json({ message: 'Applied coupon failed strict validation rules.' });
      }
    }

    const orderNumber = await generateOrderNumber();
    const computedTotal = subtotal - discountAmount + verifiedDelivery.fee;

    const order = await OrderService.create({
      ...rest,
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

    if (appliedCoupon) {
      const couponDoc = await CouponService.findOne({ code: appliedCoupon });
      if (couponDoc && (couponDoc._id || couponDoc.id)) {
        await CouponService.updateById(couponDoc._id || couponDoc.id, {
          currentClaims: (parseInt(couponDoc.currentClaims || couponDoc.usageCount) || 0) + 1,
          usageCount: (parseInt(couponDoc.usageCount || couponDoc.currentClaims) || 0) + 1
        });
      }
    }

    notifyAdminOfNewOrder(order, guestInfo?.name || 'Guest Customer', guestInfo?.phone || 'N/A');
    if (guestInfo?.phone) sendOrderPlacedSMS(guestInfo.phone, order.orderNumber, order.total);
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
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
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
module.exports.OrderService = OrderService;