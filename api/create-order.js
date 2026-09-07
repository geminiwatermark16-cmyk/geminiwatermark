const crypto = require('crypto');
const {
  PLAN_DURATION_DAYS,
  isSandbox,
  cashfreeRequest,
  planForRequest,
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
    const plan = planForRequest(req);
    const phone = String(req.body?.phone || '').replace(/\D/g, '').slice(-15);
    const email = String(req.body?.email || '').trim().slice(0, 120);
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (plan.requiresIndianPhone && !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ ok: false, error: 'Enter a valid 10-digit Indian mobile number.' });
    }
    if (email && !validEmail) {
      return res.status(400).json({ ok: false, error: 'Enter a valid email address.' });
    }
    if (plan.requiresEmail && !validEmail) {
      return res.status(400).json({ ok: false, error: 'Enter a valid email address for international checkout.' });
    }

    const isSingleTier = req.body?.planTier === 'single' && plan.region === 'india';
    const orderAmount = isSingleTier ? 29 : plan.amount;
    const displayPrice = isSingleTier ? '₹29' : plan.displayPrice;
    const durationDays = isSingleTier ? 1 : PLAN_DURATION_DAYS;
    const planTag = isSingleTier ? 'video_29_single' : 'video_99_30d';

    const orderId = `gw_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const identity = plan.region === 'india' ? phone : email.toLowerCase();
    const customerId = `gwc_${crypto.createHash('sha256').update(`${identity}:${orderId}`).digest('hex').slice(0, 20)}`;
    const customerPhone = plan.region === 'india' ? phone : '9999999999';

    const body = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: plan.currency,
      customer_details: {
        customer_id: customerId,
        customer_phone: customerPhone,
        ...(email ? { customer_email: email } : {}),
      },
      order_meta: {
        return_url: `${siteUrl(req)}/?cf_order_id=${encodeURIComponent(orderId)}`,
      },
      order_note: `geminiwatermark.space ${displayPrice} video access for ${durationDays} days`,
      order_tags: {
        plan: planTag,
        duration_days: String(durationDays),
        pricing_region: plan.region,
        pricing_country: plan.country,
        customer_phone_dummy: plan.region === 'international' ? '1' : '0',
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
      amount: orderAmount,
      currency: plan.currency,
      displayPrice,
      country: plan.country,
      region: plan.region,
      durationDays,
    });
  } catch (error) {
    return sendError(res, error);
  }
};
