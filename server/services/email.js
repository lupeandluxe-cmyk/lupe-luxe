const nodemailer = require('nodemailer');
const SiteSetting = require('../models/SiteSetting');

let transporter = null;

async function getTransporter() {
  const settings = await SiteSetting.find({});
  const map = {};
  settings.forEach(s => { map[s.key] = s.value; });

  const emailUser = map.emailUser || '';
  const emailPass = map.emailPass || '';

  if (!emailUser || !emailPass) return null;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: emailUser, pass: emailPass },
  });
  return transporter;
}

async function sendOrderEmail(order) {
  try {
    const t = await getTransporter();
    if (!t) return;

    const itemsHtml = order.items.map(i =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">×${i.qty}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${(i.price * i.qty).toFixed(0)}</td></tr>`
    ).join('');

    const paymentStatus = order.paymentMethod === 'razorpay'
      ? (order.isPaid ? '✅ Paid' : '⏳ Pending')
      : order.paymentMethod === 'upi'
        ? (order.upiPaymentStatus === 'verified' ? '✅ Verified' : order.upiPaymentStatus === 'rejected' ? '❌ Rejected' : '⏳ Pending Verification')
        : order.paymentMethod === 'cod'
          ? (order.isPaid ? '✅ Paid' : '📦 Pending (COD)')
          : 'Unknown';

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a1a2e;padding:20px;text-align:center;">
          <h1 style="color:#d4af37;margin:0;">☠ Lupe & Luxe</h1>
          <p style="color:#8888a0;margin:5px 0 0;">New Order Received</p>
        </div>
        <div style="padding:20px;background:#fff;color:#333;">
          <h2 style="margin:0 0 10px;font-size:1.1rem;">Order #${order._id.slice(-10).toUpperCase()}</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:4px 0;color:#666;">Date</td><td style="text-align:right;">${new Date(order.createdAt).toLocaleString()}</td></tr>
            <tr><td style="padding:4px 0;color:#666;">Payment</td><td style="text-align:right;">${order.paymentMethod.toUpperCase()}</td></tr>
            <tr><td style="padding:4px 0;color:#666;">Payment Status</td><td style="text-align:right;">${paymentStatus}</td></tr>
            <tr><td style="padding:4px 0;color:#666;">Total</td><td style="text-align:right;font-size:1.2rem;font-weight:700;">₹${order.totalPrice.toFixed(0)}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #eee;margin:15px 0;" />
          <h3 style="margin:0 0 8px;font-size:0.95rem;">📍 Shipping To</h3>
          <p style="margin:0;color:#555;font-size:0.85rem;">
            ${order.shippingAddress?.fullName}<br/>
            ${order.shippingAddress?.address}<br/>
            ${order.shippingAddress?.city}, ${order.shippingAddress?.postalCode}<br/>
            ${order.shippingAddress?.country}<br/>
            📞 ${order.shippingAddress?.phone}
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:15px 0;" />
          <h3 style="margin:0 0 8px;font-size:0.95rem;">📦 Items</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:#f5f5f5;"><th style="padding:8px;text-align:left;">Item</th><th style="padding:8px;">Qty</th><th style="padding:8px;text-align:right;">Price</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          ${order.discount > 0 ? `<p style="text-align:right;color:#2ecc71;margin:10px 0 0;">Discount (${order.couponCode}): -₹${order.discount.toFixed(0)}</p>` : ''}
          <hr style="border:none;border-top:2px solid #d4af37;margin:15px 0;" />
          <p style="text-align:right;font-size:1.2rem;font-weight:700;">Total: ₹${order.totalPrice.toFixed(0)}</p>
        </div>
        <div style="background:#1a1a2e;padding:15px;text-align:center;color:#666;font-size:0.75rem;">
          Lupe & Luxe — Premium Thrift & Custom Clothing
        </div>
      </div>
    `;

    await t.sendMail({
      from: emailUser,
      to: 'lupeandluxe@gmail.com',
      subject: `☠ New Order #${order._id.slice(-10).toUpperCase()} — ₹${order.totalPrice.toFixed(0)}`,
      html,
    });
    console.log('📧 Order email sent');
  } catch (err) {
    console.error('📧 Email send failed:', err.message);
  }
}

async function sendOtpEmail(toEmail, otp) {
  try {
    const settings = await SiteSetting.find({});
    const map = {};
    settings.forEach(s => { map[s.key] = s.value; });
    const emailUser = map.emailUser || '';
    const emailPass = map.emailPass || '';

    if (!emailUser || !emailPass) {
      console.log('📧 OTP email not sent: email not configured');
      return;
    }

    const t = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass },
    });

    await t.sendMail({
      from: emailUser,
      to: toEmail,
      subject: 'Your OTP for Lupe & Luxe',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto;">
          <div style="background:#1a1a2e;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="color:#d4af37;margin:0;">☠ Lupe & Luxe</h1>
            <p style="color:#8888a0;margin:5px 0 0;">OTP Verification</p>
          </div>
          <div style="padding:20px;background:#fff;color:#333;border:1px solid #eee;">
            <p style="margin:0 0 15px;font-size:0.95rem;color:#555;">Your one-time code:</p>
            <p style="font-size:2rem;font-weight:700;color:#1a1a2e;text-align:center;letter-spacing:8px;margin:10px 0;font-family:monospace;">${otp}</p>
            <p style="color:#888;font-size:0.8rem;text-align:center;">Expires in 5 minutes</p>
            <hr style="border:none;border-top:1px solid #eee;margin:15px 0;" />
            <p style="color:#aaa;font-size:0.7rem;text-align:center;">If you didn't request this, ignore this email.</p>
          </div>
          <div style="background:#1a1a2e;padding:10px;text-align:center;border-radius:0 0 8px 8px;">
            <p style="color:#666;font-size:0.65rem;margin:0;">Lupe & Luxe — Premium Thrift & Custom Clothing</p>
          </div>
        </div>
      `,
    });
    console.log('📧 OTP email sent to', toEmail);
  } catch (err) {
    console.error('📧 OTP email failed:', err.message);
  }
}

module.exports = { sendOrderEmail, sendOtpEmail };
