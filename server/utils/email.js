
const fmt  = n => `UGX ${Number(n || 0).toLocaleString()}`;
const YEAR = new Date().getFullYear();

// ── Shared HTML wrapper (header + footer) ─────────────────────────────────────
function wrap(body) {
  const YEAR = new Date().getFullYear();

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:20px 0;background:#f5f2ed;font-weight:600;">
  <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:600;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
    <div style="background:#111111;padding:32px 40px;text-align:center;">
      <div style="font-weight:600;font-size:24px;line-height:1;letter-spacing:-0.5px;">
        <span style="color:#ffffff;font-weight:600;">essentials</span><span style="color:#2C5F2D;font-weight:600;">256</span>
      </div>
    </div>
    ${body}
    <div style="background:#111;padding:24px 40px;text-align:center;">
      <p style="color:rgba(255,255,255,.5);font-size:12px;font-weight:600;margin:0 0 6px;">© ${YEAR} Essentials256. All rights reserved.</p>
      <p style="color:rgba(255,255,255,.35);font-size:11px;font-weight:600;margin:0;">Kampala, Uganda</p>
    </div>
  </div></body></html>`;
}

// ── Brevo send helper ─────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  const brevoApiKey = process.env.BREVO_API_KEY;

  if (!brevoApiKey) {
    console.log(`📧 Email skipped (BREVO_API_KEY not configured) → ${to}: ${subject}`);
    return;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept':       'application/json',
        'api-key':      brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name:  'Essentials256',
          email: process.env.FROM_EMAIL || 'comms@essentials256.com',
        },
        to:          [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const errPayload = await response.text();
      throw new Error(`Brevo ${response.status}: ${errPayload}`);
    }
    console.log(`✅ Email sent → ${to}`);
  } catch (err) {
    console.error(`❌ Email failed → ${to}:`, err.message);
  }
}

// ── Templates ─────────────────────────────────────────────────────────────────

function welcomeEmailHtml(name) {
  return wrap(`<div style="padding:40px;">
    <h1 style="font-family:Georgia,semibold;font-size:28px;color:#2C5F2D;margin:0 0 8px;">Welcome to Essentials256! ✨</h1>
    <p style="color:#5a5a5a;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Hi ${name}, thank you for creating an account with us. We are absolutely thrilled to welcome you to our community of exquisite footwear and premium home decor.
    </p>
    <div style="border:2px dashed #c9a840;background:#fffdf6;border-radius:12px;padding:20px;text-align:center;margin:28px 0;">
      <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Your Welcome Gift</div>
      <div style="font-size:20px;font-weight:700;color:#1a2e1a;letter-spacing:0.5px;margin-bottom:6px;">10% OFF YOUR FIRST ORDER</div>
      <div style="display:inline-block;background:#1a2e1a;color:#fff;font-family:monospace;font-size:16px;padding:6px 16px;border-radius:6px;font-weight:bold;margin:6px 0;">WELCOME10</div>
      <div style="font-size:11px;color:#a19578;margin-top:4px;">Apply this coupon code at checkout to claim your reward.</div>
    </div>
    <p style="color:#5a5a5a;font-size:14px;line-height:1.6;margin:0 0 24px;">Explore our collections today and find the pieces that fit your unique lifestyle.</p>
    <div style="text-align:center;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}"
         style="display:inline-block;background:#2C5F2D;color:#fff;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:14px;font-weight:600;">
        Start Shopping
      </a>
    </div>
  </div>`);
}

function adminNewUserHtml(user) {
  return wrap(`<div style="padding:40px;">
    <h1 style="font-family:Georgia,semibold;font-size:22px;color:#141414;margin:0 0 16px;border-bottom:1px solid #f0ede8;padding-bottom:12px;">👤 New User Registered</h1>
    <p style="color:#5a5a5a;font-size:14px;margin:0 0 20px;">A new customer has successfully registered an account on your store.</p>
    <table style="width:100%;font-size:14px;border-collapse:collapse;background:#faf7f2;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:12px 16px;font-weight:bold;color:#5a5a5a;border-bottom:1px solid #ede9e2;width:120px;">Full Name</td>
        <td style="padding:12px 16px;color:#141414;border-bottom:1px solid #ede9e2;">${user.name}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-weight:bold;color:#5a5a5a;border-bottom:1px solid #ede9e2;">Email Address</td>
        <td style="padding:12px 16px;color:#141414;border-bottom:1px solid #ede9e2;"><a href="mailto:${user.email}" style="color:#2C5F2D;">${user.email}</a></td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-weight:bold;color:#5a5a5a;">Phone Number</td>
        <td style="padding:12px 16px;color:#141414;">${user.phone || 'Not provided'}</td>
      </tr>
    </table>
  </div>`);
}

function adminNewOrderHtml(order, customerName, customerPhone) {
  const itemsHtml = Array.isArray(order.items)
    ? `<h3 style="color:#141414;border-bottom:1px solid #ede9e2;padding-bottom:8px;">Ordered Items</h3>
       <table style="width:100%;border-collapse:collapse;font-size:14px;">
         ${order.items.map(i => `
           <tr>
             <td style="padding:8px 0;text-align:left;"><strong>${i.name}</strong> (x${i.quantity || 1})</td>
             <td style="padding:8px 0;text-align:right;font-weight:bold;">${fmt(i.price * (i.quantity || 1))}</td>
           </tr>`).join('')}
       </table>`
    : '';

  return wrap(`<div style="padding:40px;">
    <h1 style="font-family:Georgia,semibold;font-size:22px;color:#2C5F2D;margin:0 0 6px;">🛍️ New Order Received</h1>
    <p style="color:#5a5a5a;font-size:14px;margin:0 0 24px;">Order <strong>${order.orderNumber}</strong> has been placed and is awaiting review.</p>
    <div style="background:#faf7f2;border-radius:12px;padding:16px 20px;margin-bottom:24px;font-size:13px;line-height:1.5;">
      <div style="font-weight:700;margin-bottom:4px;text-transform:uppercase;font-size:11px;color:#999;letter-spacing:0.5px;">Customer Overview</div>
      <strong>Name:</strong> ${customerName}<br>
      <strong>Contact:</strong> ${customerPhone}<br>
      <strong>Delivery Zone:</strong> ${order.deliveryZone || 'N/A'}<br>
      <strong>Type:</strong> ${order.guestInfo ? 'Guest Checkout' : 'Registered Member'}
    </div>
    ${itemsHtml}
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#5a5a5a;">Subtotal</td>
        <td style="padding:8px 0;text-align:right;font-size:13px;">${fmt(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#5a5a5a;">Delivery Fee</td>
        <td style="padding:8px 0;text-align:right;font-size:13px;">${fmt(order.shippingFee)}</td>
      </tr>
      <tr style="border-top:1px solid #ede9e2;">
        <td style="padding:12px 0 0;font-size:15px;font-weight:700;color:#141414;">Grand Total</td>
        <td style="padding:12px 0 0;text-align:right;font-size:15px;font-weight:700;color:#2C5F2D;">${fmt(order.total)}</td>
      </tr>
    </table>
    <div style="text-align:center;margin-top:30px;">
      <a href="${process.env.ADMIN_PANEL_URL || 'http://localhost:5173'}/admin/orders"
         style="background:#2C5F2D;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:25px;display:inline-block;">
        View Full Order Details
      </a>
    </div>
  </div>`);
}

function orderConfirmationHtml(order, name) {
  const rows = (order.items || []).map(i => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0ede8;font-size:14px;color:#141414;">
        <strong>${i.name}</strong><br>
        <span style="color:#999;font-size:12px;">${i.size ? 'EU ' + i.size + ' · ' : ''}Qty: ${i.quantity}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f0ede8;text-align:right;font-size:14px;font-weight:600;color:#2C5F2D;white-space:nowrap;">
        ${fmt(i.price * i.quantity)}
      </td>
    </tr>`).join('');

  const a = order.shippingAddress;

  return wrap(`<div style="padding:40px;">
    <h1 style="font-family:Georgia,semibold;font-size:28px;color:#2C5F2D;margin:0 0 8px;">Order Confirmed! 🎉</h1>
    <p style="color:#5a5a5a;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Hi ${name}, thank you for shopping with Essentials256. Your order has been received and is being processed.
    </p>
    <div style="background:#e8f2e8;border:1px solid rgba(44,95,45,.2);border-radius:12px;padding:16px 20px;margin-bottom:28px;">
      <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Order Number</div>
      <div style="font-size:22px;font-weight:700;color:#2C5F2D;letter-spacing:1px;">${order.orderNumber}</div>
    </div>
    <h2 style="font-size:13px;font-weight:700;color:#141414;margin:0 0 12px;text-transform:uppercase;letter-spacing:.5px;">Items Ordered</h2>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
    <table style="width:100%;border-collapse:collapse;margin-top:12px;">
      <tr style="border-top:2px solid #ede9e2;">
        <td style="padding:14px 0 0;font-size:16px;font-weight:700;color:#141414;">Total Paid</td>
        <td style="padding:14px 0 0;text-align:right;font-size:16px;font-weight:700;color:#2C5F2D;white-space:nowrap;">${fmt(order.total)}</td>
      </tr>
    </table>
    ${a ? `<div style="background:#faf7f2;border-radius:12px;padding:16px 20px;margin-top:24px;">
      <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Delivering to</div>
      <div style="font-size:14px;font-weight:600;color:#141414;">${a.name || name}</div>
      <div style="font-size:13px;color:#5a5a5a;margin-top:2px;">${a.street}</div>
      <div style="font-size:13px;color:#5a5a5a;">${a.city}${a.district ? ', ' + a.district : ''}, ${a.country}</div>
    </div>` : ''}
    <div style="margin-top:28px;padding:20px;border:1px solid #ede9e2;border-radius:12px;">
      <div style="font-size:14px;font-weight:700;color:#141414;margin-bottom:14px;">What happens next?</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="width:32px;font-size:20px;vertical-align:top;padding-bottom:12px;">📦</td><td style="vertical-align:top;padding-bottom:12px;padding-left:10px;"><div style="font-size:13px;font-weight:600;color:#141414;">We prepare your order</div><div style="font-size:12px;color:#999;margin-top:2px;">Usually within 24 hours</div></td></tr>
        <tr><td style="width:32px;font-size:20px;vertical-align:top;padding-bottom:12px;">🚚</td><td style="vertical-align:top;padding-bottom:12px;padding-left:10px;"><div style="font-size:13px;font-weight:600;color:#141414;">We dispatch it</div><div style="font-size:12px;color:#999;margin-top:2px;">Standard: 3–5 business days</div></td></tr>
        <tr><td style="width:32px;font-size:20px;vertical-align:top;">📱</td><td style="vertical-align:top;padding-left:10px;"><div style="font-size:13px;font-weight:600;color:#141414;">You get notified</div><div style="font-size:12px;color:#999;margin-top:2px;">With your tracking details</div></td></tr>
      </table>
    </div>
    <div style="text-align:center;margin-top:28px;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile?tab=orders"
         style="display:inline-block;background:#2C5F2D;color:#fff;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:14px;font-weight:600;">
        Track Your Order
      </a>
    </div>
    <div style="text-align:center;margin-top:24px;padding-top:24px;border-top:1px solid #f0ede8;">
      <p style="color:#999;font-size:13px;margin:0 0 8px;">Questions? We're here to help.</p>
      <a href="https://wa.me/256749156332?text=Hi, I need help with order ${order.orderNumber}" style="color:#2C5F2D;font-size:13px;font-weight:600;text-decoration:none;">💬 WhatsApp</a>
      &nbsp;·&nbsp;
      <a href="mailto:hello@essentials256.com" style="color:#2C5F2D;font-size:13px;font-weight:600;text-decoration:none;">✉️ Email us</a>
    </div>
  </div>`);
}

function orderShippedHtml(order, name, trackingNumber) {
  return wrap(`<div style="padding:40px;">
    <h1 style="font-family:Georgia,semibold;font-size:28px;color:#2C5F2D;margin:0 0 8px;">Your order is on its way! 🚚</h1>
    <p style="color:#5a5a5a;font-size:15px;line-height:1.6;margin:0 0 24px;">Hi ${name}, your Essentials256 order has been dispatched.</p>
    <div style="background:#e8f2e8;border:1px solid rgba(44,95,45,.2);border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Order Number</div>
      <div style="font-size:20px;font-weight:700;color:#2C5F2D;">${order.orderNumber}</div>
      ${trackingNumber ? `<div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;margin:12px 0 4px;">Tracking Number</div><div style="font-size:16px;font-weight:600;color:#141414;">${trackingNumber}</div>` : ''}
    </div>
    <p style="color:#5a5a5a;font-size:14px;line-height:1.6;">Expected delivery: <strong>3–5 business days</strong> from dispatch.</p>
    <div style="text-align:center;margin-top:28px;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile?tab=orders"
         style="display:inline-block;background:#2C5F2D;color:#fff;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:14px;font-weight:600;">
        View Order Status
      </a>
    </div>
  </div>`);
}

function resetPasswordHtml(name, resetUrl) {
  return wrap(`<div style="padding:40px;">
    <h1 style="font-family:Georgia,semibold;font-size:26px;color:#141414;margin:0 0 12px;">Reset Your Password</h1>
    <p style="color:#5a5a5a;font-size:15px;line-height:1.6;margin:0 0 24px;">Hi ${name}, click below to reset your password. This link expires in 1 hour.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:#2C5F2D;color:#fff;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:14px;font-weight:600;">Reset Password</a>
    </div>
    <p style="color:#999;font-size:13px;text-align:center;">If you didn't request this, you can safely ignore this email.</p>
  </div>`);
}

function confirmEmailChangeHtml(name, confirmUrl) {
  return wrap(`<div style="padding:40px;">
    <h1 style="font-family:Georgia,semibold;font-size:26px;color:#141414;margin:0 0 12px;">Confirm Your New Email</h1>
    <p style="color:#5a5a5a;font-size:15px;line-height:1.6;margin:0 0 24px;">Hi ${name}, someone requested to change the login email on your Essentials256 admin account to this address. Click below to confirm it. This link expires in 1 hour.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${confirmUrl}" style="display:inline-block;background:#2C5F2D;color:#fff;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:14px;font-weight:600;">Confirm New Email</a>
    </div>
    <p style="color:#999;font-size:13px;text-align:center;">If you didn't request this, ignore this email — your login email won't change unless this link is clicked.</p>
  </div>`);
}

// ── Public send functions ─────────────────────────────────────────────────────

async function sendWelcomeEmail(email, name) {
  await sendEmail({ to: email, subject: `Welcome to Essentials256, ${name}! ✨`, html: welcomeEmailHtml(name) });
}

async function sendAdminNewUserAlert(user) {
  await sendEmail({
    to:      process.env.ADMIN_EMAIL || 'comms@essentials256.com',
    subject: `👤 New User Registration: ${user.name}`,
    html:    adminNewUserHtml(user),
  });
}

async function notifyAdminOfNewOrder(order, customerName, customerPhone) {
  await sendEmail({
    to:      process.env.ADMIN_EMAIL || 'comms@essentials256.com',
    subject: `🔔 New Pending Order: ${order.orderNumber}`,
    html:    adminNewOrderHtml(order, customerName, customerPhone),
  });
}

async function sendAdminNewOrderAlert(order) {
  await notifyAdminOfNewOrder(order, order.guestInfo?.name || order.shippingAddress?.name || 'Customer', order.guestInfo?.phone || order.shippingAddress?.phone || 'N/A');
}

async function sendOrderConfirmation(order, email, name) {
  await sendEmail({
    to:      email,
    subject: `Order Confirmed — ${order.orderNumber} | Essentials256`,
    html:    orderConfirmationHtml(order, name),
  });
}

async function sendOrderShipped(order, email, name, trackingNumber) {
  await sendEmail({
    to:      email,
    subject: `Your order is on its way! — ${order.orderNumber} | Essentials256`,
    html:    orderShippedHtml(order, name, trackingNumber),
  });
}

async function sendPasswordReset(email, name, resetUrl) {
  await sendEmail({
    to:      email,
    subject: 'Reset your Essentials256 password',
    html:    resetPasswordHtml(name, resetUrl),
  });
}

async function sendEmailChangeConfirmation(newEmail, name, confirmUrl) {
  await sendEmail({
    to:      newEmail,
    subject: 'Confirm your new Essentials256 login email',
    html:    confirmEmailChangeHtml(name, confirmUrl),
  });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendAdminNewUserAlert,
  sendAdminNewOrderAlert,
  notifyAdminOfNewOrder,
  sendOrderConfirmation,
  sendOrderShipped,
  sendPasswordReset,
  sendEmailChangeConfirmation,
};
