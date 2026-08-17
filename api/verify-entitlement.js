const {
  PLAN_DURATION_DAYS,
  inspectEntitlementToken,
  maskPhone,
  maskEmail,
} = require('../lib/cashfree');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const payload = inspectEntitlementToken(String(req.body?.token || ''));

  if (!payload) {
    return res.status(200).json({ ok: true, active: false, reason: 'invalid' });
  }

  return res.status(200).json({
    ok: true,
    active: Boolean(payload.active),
    expired: Boolean(payload.expired),
    orderId: payload.orderId,
    plan: '₹99 Video — 30 days',
    planId: payload.plan,
    durationDays: PLAN_DURATION_DAYS,
    paidAt: new Date(payload.paidAt).toISOString(),
    expiresAt: new Date(payload.expiresAt).toISOString(),
    phone: maskPhone(payload.phone),
    email: maskEmail(payload.email),
  });
};
