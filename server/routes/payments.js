const express  = require('express');
const router   = express.Router();
const FirestoreService = require('../services/FirestoreService');
const { optionalAuth } = require('../middleware/auth');
const { submitOrderRequest, getTransactionStatus, mapPaymentStatus } = require('../utils/pesapal');
const { sendOrderConfirmation } = require('../utils/email');

const OrderService = new FirestoreService('orders');
const UserService  = new FirestoreService('users');

async function getContact(order, reqUser, guestInfo) {
  if (reqUser)                return { name: reqUser.name, email: reqUser.email };
  if (guestInfo?.email)       return { name: guestInfo.name || 'Customer', email: guestInfo.email };
  if (order.guestInfo?.email) return { name: order.guestInfo.name || 'Customer', email: order.guestInfo.email };
  if (order.customerId) {
    const u = await UserService.findById(order.customerId);
    if (u) return { name: u.name, email: u.email };
  }
  return { name: order.shippingAddress?.name || 'Customer', email: null };
}

async function handlePaid(order, contact) {
  if (order.orderStatus !== 'pending') return;
  const statusHistory = [
    ...(order.statusHistory || []),
    { status: 'processing', note: 'Payment confirmed via PesaPal', updatedAt: new Date().toISOString() },
  ];
  await OrderService.updateById(order._id || order.id, {
    orderStatus:   'processing',
    paymentStatus: 'paid',
    statusHistory,
  });
  if (contact?.email) {
    const updated = await OrderService.findById(order._id || order.id);
    await sendOrderConfirmation(updated, contact.email, contact.name);
    console.log(`📧 Confirmation sent → ${contact.email} (${order.orderNumber})`);
  }
}

// POST /api/payments/pesapal/initiate
router.post('/pesapal/initiate', optionalAuth, async (req, res) => {
  try {
    const { orderId, guestInfo } = req.body;
    const order = await OrderService.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const contact = await getContact(order, req.user, guestInfo);
    const [first, ...rest] = (contact.name || 'Customer').split(' ');

    const pesapalData = await submitOrderRequest({
      orderNumber: order.orderNumber,
      amount:      order.total,
      currency:    'UGX',
      description: `Essentials256 Order ${order.orderNumber}`,
      email:       contact.email || 'customer@essentials256.com',
      phone:       req.user?.phone || guestInfo?.phone || order.shippingAddress?.phone || '',
      firstName:   first || 'Customer',
      lastName:    rest.join(' ') || 'Guest',
      countryCode: order.shippingAddress?.country === 'Rwanda' ? 'RW' : 'UG',
      address:     order.shippingAddress?.street || '',
      city:        order.shippingAddress?.city   || '',
    });

    if (pesapalData.error) {
      return res.status(400).json({ message: pesapalData.error.message || 'Payment initiation failed' });
    }

    await OrderService.updateById(order._id || order.id, {
      pesapalOrderId:     pesapalData.order_tracking_id,
      pesapalMerchantRef: pesapalData.merchant_reference,
    });

    res.json({
      redirectUrl:     pesapalData.redirect_url,
      orderTrackingId: pesapalData.order_tracking_id,
    });
  } catch (err) {
    console.error('PesaPal initiate error:', err.message);
    res.status(500).json({
      message: 'Payment service error',
      ...(process.env.NODE_ENV === 'development' && { error: err.message }),
    });
  }
});

// GET /api/payments/pesapal/callback
router.get('/pesapal/callback', async (req, res) => {
  try {
    const { OrderTrackingId } = req.query;
    const [status, orders] = await Promise.all([
      getTransactionStatus(OrderTrackingId),
      OrderService.find({ pesapalOrderId: OrderTrackingId }, { limit: 1 }),
    ]);
    const order = orders[0];

    if (order) {
      const newStatus = mapPaymentStatus(status.payment_status_description);
      await OrderService.updateById(order._id || order.id, {
        paymentStatus:     newStatus,
        pesapalTrackingId: OrderTrackingId,
      });
      if (newStatus === 'paid') {
        const fresh   = await OrderService.findById(order._id || order.id);
        const contact = await getContact(fresh, null, null);
        await handlePaid(fresh, contact);
      }
    }

    const base   = process.env.CLIENT_URL || 'http://localhost:5173';
    const isPaid = order && mapPaymentStatus(status.payment_status_description) === 'paid';
    res.redirect(`${base}/order/${isPaid ? order.orderNumber : 'failed'}`);
  } catch (err) {
    console.error('Callback error:', err.message);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/order/failed`);
  }
});

// POST /api/payments/pesapal/ipn
router.post('/pesapal/ipn', async (req, res) => {
  try {
    const { OrderTrackingId, OrderNotificationType, OrderMerchantReference } = req.body;

    // Always respond 200 immediately — PesaPal requires this to stop retries.
    // Verification happens before any state change below.
    res.json({
      orderNotificationType:  OrderNotificationType,
      orderTrackingId:        OrderTrackingId,
      orderMerchantReference: OrderMerchantReference,
      status: '200'
    });

    if (OrderNotificationType !== 'IPNCHANGE') return;
    if (!OrderTrackingId || !OrderMerchantReference) return;

    // Fetch the order first and verify the merchant reference matches
    // what we stored at order creation — prevents an attacker from
    // replaying a real OrderTrackingId against a different order.
    const orders = await OrderService.find({ pesapalOrderId: OrderTrackingId }, { limit: 1 });
    const order  = orders[0];

    if (!order) {
      console.warn(`IPN: No order found for tracking ID ${OrderTrackingId}`);
      return;
    }

    // Verify the merchant reference matches what was stored on this order
    if (order.pesapalMerchantRef && order.pesapalMerchantRef !== OrderMerchantReference) {
      console.warn(`IPN: Merchant reference mismatch for order ${order.orderNumber}. Expected ${order.pesapalMerchantRef}, got ${OrderMerchantReference}`);
      return;
    }

    // Re-verify the transaction status directly with PesaPal — never
    // trust the IPN body alone to determine whether a payment succeeded.
    const status    = await getTransactionStatus(OrderTrackingId);
    const newStatus = mapPaymentStatus(status.payment_status_description);

    if (order.paymentStatus !== newStatus) {
      await OrderService.updateById(order._id || order.id, { paymentStatus: newStatus });
      if (newStatus === 'paid') {
        const fresh   = await OrderService.findById(order._id || order.id);
        const contact = await getContact(fresh, null, null);
        await handlePaid(fresh, contact);
      }
    }
  } catch (err) {
    console.error('IPN error:', err.message);
    // Response already sent above — nothing more to do
  }
});

// GET /api/payments/pesapal/status/:orderNumber
router.get('/pesapal/status/:orderNumber', optionalAuth, async (req, res) => {
  try {
    const orders = await OrderService.find({ orderNumber: req.params.orderNumber }, { limit: 1 });
    const order  = orders[0];
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Ownership check — must be the order's customer or an admin.
    // Guests without a token are allowed only if the order has no customerId
    // (i.e. a guest order that was never linked to an account).
    const requesterId = req.user?._id || req.user?.id || null;
    const isAdmin     = req.user?.role === 'admin';
    const isOwner     = requesterId && order.customerId === requesterId;
    const isGuest     = !order.customerId;

    if (!isAdmin && !isOwner && !isGuest) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!order.pesapalOrderId) return res.json({ paymentStatus: order.paymentStatus, orderStatus: order.orderStatus });

    const status    = await getTransactionStatus(order.pesapalOrderId);
    const newStatus = mapPaymentStatus(status.payment_status_description);
    if (order.paymentStatus !== newStatus) {
      await OrderService.updateById(order._id || order.id, { paymentStatus: newStatus });
      if (newStatus === 'paid') {
        const fresh   = await OrderService.findById(order._id || order.id);
        const contact = await getContact(fresh, null, null);
        await handlePaid(fresh, contact);
      }
    }
    res.json({ paymentStatus: newStatus, orderStatus: order.orderStatus, pesapalStatus: status.payment_status_description });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch payment status' });
  }
});

module.exports = router;
