const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const fmt  = n => `UGX ${Number(n || 0).toLocaleString()}`;
const YEAR = new Date().getFullYear();

function wrap(body) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:20px 0;background:#f5f2ed;">
  <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#1a2e1a,#2C5F2D);padding:32px 40px;text-align:center;">
      <div style="font-size:26px;font-style:italic;color:#fff;font-family:Georgia,serif;">Essentials256</div>
      <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#c9a840;margin-top:4px;">Uganda</div>
    </div>
    ${body}
    <div style="background:#111;padding:24px 40px;text-align:center;">
      <p style="color:rgba(255,255,255,.5);font-size:12px;margin:0 0 6px;">© ${YEAR} Essentials256. All rights reserved.</p>
      <p style="color:rgba(255,255,255,.35);font-size:11px;margin:0;">Kampala, Uganda</p>
    </div>
  </div></body></html>`;
}

// ─── NEW TEMPLATE: WELCOME EMAIL WITH COUPON PLACEHOLDER ───
function welcomeEmailHtml(name) {
  return wrap(`<div style="padding:40px;">
    <h1 style="font-family:Georgia,serif;font-size:28px;color:#2C5F2D;margin:0 0 8px;">Welcome to Essentials256! ✨</h1>
    <p style="color:#5a5a5a;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Hi ${name}, thank you for creating an account with us. We are absolutely thrilled to welcome you to our community of exquisite ladies' footwear and premium home decor.
    </p>
    
    <div style="border: 2px dashed #c9a840; background: #fffdf6; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0;">
      <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Your Welcome Gift</div>
      <div style="font-size: 20px; font-weight: 700; color: #1a2e1a; letter-spacing: 0.5px; margin-bottom: 6px;">10% OFF YOUR FIRST ORDER</div>
      <div style="display: inline-block; background: #1a2e1a; color: #fff; font-family: monospace; font-size: 16px; padding: 6px 16px; border-radius: 6px; font-weight: bold; margin: 6px 0;">WELCOME10</div>
      <div style="font-size: 11px; color: #a19578; margin-top: 4px;">Apply this coupon code at checkout to claim your reward.</div>
    </div>

    <p style="color:#5a5a5a;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Explore our collections today and find the pieces that fit your unique lifestyle.
    </p>
    <div style="text-align:center;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}"
         style="display:inline-block;background:#2C5F2D;color:#fff;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:14px;font-weight:600;">
        Start Shopping
      </a>
    </div>
  </div>`);
}

// ─── NEW TEMPLATE: ADMIN NEW USER ALERT ───
function adminNewUserHtml(user) {
  return wrap(`<div style="padding:40px;">
    <h1 style="font-family:Georgia,serif;font-size:22px;color:#141414;margin:0 0 16px;border-bottom:1px solid #f0ede8;padding-bottom:12px;">👤 New User Registered</h1>
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

// ─── NEW TEMPLATE: ADMIN NEW PENDING ORDER ALERT ───
function adminNewOrderHtml(order) {
  const clientName = order.guestInfo?.name || order.shippingAddress?.name || 'Customer';
  const rows = (order.items || []).map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0ede8;font-size:13px;color:#141414;">
        <strong>${i.name}</strong> <span style="color:#999;">x${i.quantity}</span>
        ${i.size ? `<br><span style="color:#999;font-size:11px;">Size: EU ${i.size}</span>` : ''}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f0ede8;text-align:right;font-size:13px;font-weight:600;color:#141414;">
        ${fmt(i.price * i.quantity)}
      </td>
    </tr>`).join('');

  return wrap(`<div style="padding:40px;">
    <h1 style="font-family:Georgia,serif;font-size:22px;color:#2C5F2D;margin:0 0 6px;">🛍️ New Order Received</h1>
    <p style="color:#5a5a5a;font-size:14px;margin:0 0 24px;">Order <strong>${order.orderNumber}</strong> has been successfully placed and is awaiting review.</p>
    
    <div style="background:#faf7f2;border-radius:12px;padding:16px 20px;margin-bottom:24px;font-size:13px;line-height:1.5;">
      <div style="font-weight:700;margin-bottom:4px;text-transform:uppercase;font-size:11px;color:#999;letter-spacing:0.5px;">Customer Overview</div>
      <strong>Name:</strong> ${clientName}<br>
      <strong>Contact:</strong> ${order.guestInfo?.phone || order.shippingAddress?.phone || 'N/A'}<br>
      <strong>Type:</strong> ${order.guestInfo ? 'Guest Checkout' : 'Registered Member'}
    </div>

    <h2 style="font-size:12px;font-weight:700;color:#141414;margin:0 0 8px;text-transform:uppercase;letter-spacing:.5px;">Order Summary</h2>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
    <table style="width:100%;border-collapse:collapse;margin-top:8px;">
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#5a5a5a;">Subtotal</td>
        <td style="padding:8px 0;text-align:right;font-size:13px;color:#141414;">${fmt(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#5a5a5a;">Delivery Fee (${order.deliveryZone || 'Standard'})</td>
        <td style="padding:8px 0;text-align:right;font-size:13px;color:#141414;">${fmt(order.shippingFee)}</td>
      </tr>
      <tr style="border-top:1px solid #ede9e2;">
        <td style="padding:12px 0 0;font-size:15px;font-weight:700;color:#141414;">Grand Total</td>
        <td style="padding:12px 0 0;text-align:right;font-size:15px;font-weight:700;color:#2C5F2D;">${fmt(order.total)}</td>
      </tr>
    </table>
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
    <h1 style="font-family:Georgia,serif;font-size:28px;color:#2C5F2D;margin:0 0 8px;">Order Confirmed! 🎉</h1>
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
      <a href="https://wa.me/256700000000?text=Hi, I need help with order ${order.orderNumber}" style="color:#2C5F2D;font-size:13px;font-weight:600;text-decoration:none;">💬 WhatsApp</a>
      &nbsp;·&nbsp;
      <a href="mailto:hello@essentials256.com" style="color:#2C5F2D;font-size:13px;font-weight:600;text-decoration:none;">✉️ Email us</a>
    </div>
  </div>`);
}

function orderShippedHtml(order, name, trackingNumber) {
  return wrap(`<div style="padding:40px;">
    <h1 style="font-family:Georgia,serif;font-size:28px;color:#2C5F2D;margin:0 0 8px;">Your order is on its way! 🚚</h1>
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
    <h1 style="font-family:Georgia,serif;font-size:26px;color:#141414;margin:0 0 12px;">Reset Your Password</h1>
    <p style="color:#5a5a5a;font-size:15px;line-height:1.6;margin:0 0 24px;">Hi ${name}, click below to reset your password. This link expires in 1 hour.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:#2C5F2D;color:#fff;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:14px;font-weight:600;">Reset Password</a>
    </div>
    <p style="color:#999;font-size:13px;text-align:center;">If you didn't request this, you can safely ignore this email.</p>
  </div>`);
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`📧 Email skipped (SMTP not configured) → ${to}: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      // Forces outbound sender specifically to orders@essentials256.com
      from: `"Essentials256" <${process.env.FROM_EMAIL || 'orders@essentials256.com'}>`,
      to, subject, html,
    });
    console.log(`✅ Email sent → ${to}`);
  } catch (err) {
    console.error(`❌ Email failed → ${to}:`, err.message);
  }
}

async function sendWelcomeEmail(email, name) {
  await sendEmail({
    to:      email,
    subject: `Welcome to Essentials256, ${name}! ✨`,
    html:    welcomeEmailHtml(name),
  });
}

async function sendAdminNewUserAlert(user) {
  await sendEmail({
    to:      process.env.ADMIN_EMAIL || 'orders@essentials256.com',
    subject: `👤 New User Registration: ${user.name}`,
    html:    adminNewUserHtml(user),
  });
}

async function sendAdminNewOrderAlert(order) {
  await sendEmail({
    to:      process.env.ADMIN_EMAIL || 'orders@essentials256.com',
    subject: `🔔 New Pending Order: ${order.orderNumber}`,
    html:    adminNewOrderHtml(order),
  });
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

module.exports = { 
  sendEmail, 
  sendWelcomeEmail,
  sendAdminNewUserAlert,
  sendAdminNewOrderAlert,
  sendOrderConfirmation, 
  sendOrderShipped, 
  sendPasswordReset 
};