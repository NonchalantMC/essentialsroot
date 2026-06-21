/**
 * PesaPal API v3 Integration
 * Sandbox: https://cybqa.pesapal.com/pesapalv3
 * Production: https://pay.pesapal.com/v3
 */
const axios = require('axios');

const BASE_URL = process.env.PESAPAL_ENVIRONMENT === 'production'
  ? 'https://pay.pesapal.com/v3'
  : 'https://cybqa.pesapal.com/pesapalv3';

let tokenCache  = { token: null, expiresAt: 0 };
let cachedIpnId = null;

// ─── Step 1: Get auth token ───────────────────────────────────────────────────
async function getAuthToken() {
  if (tokenCache.token && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }
  const { data } = await axios.post(
    `${BASE_URL}/api/Auth/RequestToken`,
    {
      consumer_key:    process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    },
    { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
  );
  tokenCache = {
    token:     data.token,
    expiresAt: new Date(data.expiryDate).getTime() - 60000,
  };
  return data.token;
}

// ─── Step 2: Register IPN and get ipn_id ─────────────────────────────────────
async function getIpnId() {
  if (cachedIpnId) return cachedIpnId;
  if (process.env.PESAPAL_IPN_ID) {
    cachedIpnId = process.env.PESAPAL_IPN_ID;
    return cachedIpnId;
  }

  const token = await getAuthToken();

  // Check existing IPNs first
  try {
    const { data: ipns } = await axios.get(
      `${BASE_URL}/api/URLSetup/GetIpnList`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
    );
    if (Array.isArray(ipns) && ipns.length > 0) {
      const existing = ipns[0];
      cachedIpnId = existing.ipn_id || existing.notification_id || existing.ipnId;
      if (cachedIpnId) {
        console.log('✅ PesaPal IPN ID (existing):', cachedIpnId);
        return cachedIpnId;
      }
    }
  } catch {}

  // Register new IPN
  const ipnUrl = process.env.PESAPAL_IPN_URL || 'http://localhost:5000/api/payments/pesapal/ipn';
  const { data } = await axios.post(
    `${BASE_URL}/api/URLSetup/RegisterIPN`,
    { url: ipnUrl, ipn_notification_type: 'GET' },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' } }
  );

  cachedIpnId = data.ipn_id || data.notification_id || data.ipnId || data.url_hash || '';
  console.log('✅ PesaPal IPN ID (registered):', cachedIpnId);
  return cachedIpnId;
}

// ─── Step 3: Submit order ─────────────────────────────────────────────────────
async function submitOrderRequest(orderData) {
  const token = await getAuthToken();
  const ipnId = await getIpnId();

  const { data } = await axios.post(
    `${BASE_URL}/api/Transactions/SubmitOrderRequest`,
    {
      id:              orderData.orderNumber,
      currency:        orderData.currency || 'UGX',
      amount:          orderData.amount,
      description:     orderData.description || `Order ${orderData.orderNumber}`,
      callback_url:    `${process.env.PESAPAL_CALLBACK_URL}?orderNumber=${orderData.orderNumber}`,
      redirect_mode:   '',
      notification_id: ipnId || '',
      branch:          'Essentials256',
      billing_address: {
        email_address: orderData.email        || 'customer@essentials256.com',
        phone_number:  orderData.phone        || '',
        country_code:  orderData.countryCode  || 'UG',
        first_name:    orderData.firstName    || 'Customer',
        last_name:     orderData.lastName     || 'Guest',
        line_1:        orderData.address      || '',
        city:          orderData.city         || '',
      },
    },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' } }
  );
  return data;
}

// ─── Step 4: Get transaction status ──────────────────────────────────────────
async function getTransactionStatus(orderTrackingId) {
  const token = await getAuthToken();
  const { data } = await axios.get(
    `${BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
  );
  return data;
}

function mapPaymentStatus(pesapalStatus) {
  const map = { COMPLETED:'paid', FAILED:'failed', REVERSED:'refunded', PENDING:'pending', INVALID:'failed' };
  return map[pesapalStatus?.toUpperCase()] || 'pending';
}

module.exports = { getAuthToken, getIpnId, submitOrderRequest, getTransactionStatus, mapPaymentStatus };
