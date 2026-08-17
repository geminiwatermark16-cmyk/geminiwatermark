const crypto = require('crypto');
const {
  PLAN_AMOUNT,
  PLAN_CURRENCY,
  PLAN_DURATION_DAYS,
  isSandbox,
  cashfreeRequest,
  siteUrl,
  sendError,
} = require('../lib/cashfree');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  try {
    const phone = String(req.body?.phone || '').replace(/\D/g, '').slice(-10);
    const email = String(req.body?.email || '').trim().slice(0, 120);
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ ok: false, error: 'Enter a valid 10-digit Indian mobile number.' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'Enter a valid email address.' });
    }

    const orderId = `gw_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const customerId = `gwc_${crypto.createHash('sha256').update(`${phone}:${orderId}`).digest('hex').slice(0, 20)}`;

    const body = {
      order_id: orderId,
      order_amount: PLAN_AMOUNT,
      order_currency: PLAN_CURRENCY,
      customer_details: {
        customer_id: customerId,
        customer_phone: phone,
        ...(email ? { customer_email: email } : {}),
      },
      order_meta: {
        return_url: `${siteUrl(req)}/?cf_order_id=${encodeURIComponent(orderId)}`,
      },
      order_note: `geminiwatermark.space ₹99 video access for ${PLAN_DURATION_DAYS} days`,
      order_tags: {
        plan: 'video_99_30d',
        duration_days: String(PLAN_DURATION_DAYS),
      },
    };

    const order = await cashfreeRequest('/orders', {
      method: 'POST',
      headers: {
        'x-request-id': crypto.randomUUID(),
        'x-idempotency-key': crypto.randomUUID(),
      },
      body: JSON.stringify(body),
    });

    const actualEnvironment = order.__cashfreeEnvironment || (isSandbox() ? 'sandbox' : 'production');

    return res.status(200).json({
      ok: true,
      orderId: order.order_id,
      paymentSessionId: order.payment_session_id,
      mode: actualEnvironment === 'sandbox' ? 'sandbox' : 'production',
      amount: PLAN_AMOUNT,
      currency: PLAN_CURRENCY,
      durationDays: PLAN_DURATION_DAYS,
    });
  } catch (error) {
    return sendError(res, error);
  }
};
