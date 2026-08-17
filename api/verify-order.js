const { PLAN_AMOUNT, PLAN_CURRENCY, cashfreeRequest, signEntitlement, sendError } = require('../lib/cashfree');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }
  try {
    const orderId = String(req.body?.orderId || '').trim();
    if (!/^gw_[A-Za-z0-9_\-]{8,80}$/.test(orderId)) return res.status(400).json({ ok: false, error: 'Invalid order ID.' });

    const order = await cashfreeRequest(`/orders/${encodeURIComponent(orderId)}`, { method: 'GET' });
    const paid = order.order_status === 'PAID' && Number(order.order_amount) === PLAN_AMOUNT && order.order_currency === PLAN_CURRENCY;
    if (!paid) return res.status(200).json({ ok: true, paid: false, status: order.order_status || 'UNKNOWN' });

    return res.status(200).json({
      ok: true,
      paid: true,
      status: 'PAID',
      orderId: order.order_id,
      entitlementToken: signEntitlement(order),
    });
  } catch (error) {
    return sendError(res, error);
  }
};
