const { verifyEntitlementToken } = require('../lib/cashfree');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }
  const payload = verifyEntitlementToken(String(req.body?.token || ''));
  return res.status(200).json({
    ok: true,
    active: Boolean(payload),
    ...(payload ? { orderId: payload.orderId, plan: payload.plan } : {}),
  });
};
