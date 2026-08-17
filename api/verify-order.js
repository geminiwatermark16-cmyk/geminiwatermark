const {
  PLAN_AMOUNT,
  PLAN_CURRENCY,
  PLAN_DURATION_DAYS,
  cashfreeRequest,
  signEntitlement,
  inspectEntitlementToken,
  maskPhone,
  maskEmail,
  sendError,
} = require('../lib/cashfree');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  try {
    const orderId = String(req.body?.orderId || '').trim();
    if (!/^gw_[A-Za-z0-9_\-]{8,80}$/.test(orderId)) {
      return res.status(400).json({ ok: false, error: 'Invalid order ID.' });
    }

    const order = await cashfreeRequest(`/orders/${encodeURIComponent(orderId)}`, { method: 'GET' });
    const paid = order.order_status === 'PAID'
      && Number(order.order_amount) === PLAN_AMOUNT
      && order.order_currency === PLAN_CURRENCY;

    if (!paid) {
      return res.status(200).json({ ok: true, paid: false, status: order.order_status || 'UNKNOWN' });
    }

    let paidAt = order.created_at;
    try {
      const payments = await cashfreeRequest(`/orders/${encodeURIComponent(orderId)}/payments`, { method: 'GET' });
      const successful = Array.isArray(payments)
        ? payments.filter((item) => item?.payment_status === 'SUCCESS')
        : [];
      successful.sort((a, b) => Date.parse(b.payment_completion_time || b.payment_time || 0) - Date.parse(a.payment_completion_time || a.payment_time || 0));
      const payment = successful[0];
      if (payment) paidAt = payment.payment_completion_time || payment.payment_time || paidAt;
    } catch (error) {
      console.warn('Could not fetch payment timestamp; falling back to order creation time.', error?.message || error);
    }

    const entitlementToken = signEntitlement(order, paidAt);
    const entitlement = inspectEntitlementToken(entitlementToken);

    return res.status(200).json({
      ok: true,
      paid: true,
      status: 'PAID',
      orderId: order.order_id,
      entitlementToken,
      account: {
        plan: '₹99 Video — 30 days',
        durationDays: PLAN_DURATION_DAYS,
        paidAt: new Date(entitlement.paidAt).toISOString(),
        expiresAt: new Date(entitlement.expiresAt).toISOString(),
        phone: maskPhone(entitlement.phone),
        email: maskEmail(entitlement.email),
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};
