const credentials = {
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME || 'sandbox'
};

// Initialize Africa's Talking SDK
const AfricasTalking = require('africastalking')(credentials);
const smsService = AfricasTalking.SMS;

/**
 * Formats local East African phone numbers into standard E.164 international formatting
 * Handles standard numeric inputs for Uganda (+256) and Rwanda (+250)
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Strip out spacing and hyphenations
  let cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
  
  // Already explicitly formatted internationally
  if (cleaned.startsWith('+')) return cleaned;
  
  // Handle Uganda default formatting conversion (07...)
  if (cleaned.startsWith('07') && cleaned.length === 10) {
    return `+256${cleaned.slice(1)}`;
  }
  
  // Handle Rwanda formatting detection (078, 079, 072, 073)
  if ((cleaned.startsWith('078') || cleaned.startsWith('079') || cleaned.startsWith('072') || cleaned.startsWith('073')) && cleaned.length === 10) {
    return `+250${cleaned.slice(1)}`;
  }

  return cleaned;
}

/**
 * Core Messaging Engine
 */
async function sendSMS({ to, message }) {
  const formattedRecipient = formatPhoneNumber(to);
  
  if (!formattedRecipient) {
    console.log(`⚠️ SMS Blocked: Recipient phone string is empty or invalid.`);
    return;
  }

  if (!process.env.AT_API_KEY) {
    console.log(`📱 [SMS Sandbox Simulation] To: ${formattedRecipient} | Message: "${message}"`);
    return;
  }

  try {
    const options = {
      to: [formattedRecipient],
      message: message
    };

    // Alphanumeric sender signatures are explicitly banned on sandbox mode routes
    if (process.env.AT_USERNAME !== 'sandbox' && process.env.AT_SENDER_ID) {
      options.from = process.env.AT_SENDER_ID;
    }

    const response = await smsService.send(options);
    console.log(`✅ SMS successfully dispatched to ${formattedRecipient}`);
    return response;
  } catch (error) {
    console.error(`❌ Africa's Talking API Error to ${formattedRecipient}:`, error.message);
  }
}

// ─── TRANSACTIONAL MESSAGE SCHEMAS ──────────────────────────────────────────

/**
 * Sends a 6-digit checkout confirmation token to a guest visitor
 */
async function sendOtpSMS(phone, code) {
  const msg = `Essentials256: Your verification code is ${code}. It expires in 5 minutes. Do not share this code.`;
  await sendSMS({ to: phone, message: msg });
}

/**
 * Fires immediately upon order ingestion to confirm receipt
 */
async function sendOrderPlacedSMS(phone, orderNumber, total) {
  const formattedTotal = Number(total).toLocaleString();
  const msg = `Essentials256: Thank you! Your order ${orderNumber} has been received. Total: UGX ${formattedTotal}. We will notify you when your items are dispatched.`;
  await sendSMS({ to: phone, message: msg });
}

/**
 * Fires when an administrator adjusts an order state to "shipped"
 */
async function sendOrderShippedSMS(phone, orderNumber) {
  const msg = `Essentials256: Great news! Your order ${orderNumber} has been dispatched and is on its way to your delivery address.`;
  await sendSMS({ to: phone, message: msg });
}

module.exports = {
  sendSMS,
  sendOtpSMS,
  sendOrderPlacedSMS,
  sendOrderShippedSMS
};