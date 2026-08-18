const {
  PLAN_DURATION_DAYS,
  inspectEntitlementToken,
  planLabelFromPayment,
  maskPhone,
  maskEmail,
} = require('../lib/cashfree');
const { recordPaidEntitlement } = require('../lib/store');

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

  try {
    await recordPaidEntitlement(payload);
  } catch (error) {
    // A valid paid token must keep working even if admin storage is temporarily
    // unavailable. The next entitlement check will retry the backfill.
    console.warn('Could not backfill paid entitlement into admin ledger.', error?.message || error);
  }

  return res.status(200).json({
    ok: true,
    active: Boolean(payload.active),
    expired: Boolean(payload.expired),
    orderId: payload.orderId,
    plan: planLabelFromPayment(payload.amount, payload.currency),
    planId: payload.plan,
    durationDays: PLAN_DURATION_DAYS,
    paidAt: new Date(payload.paidAt).toISOString(),
    expiresAt: new Date(payload.expiresAt).toISOString(),
    phone: maskPhone(payload.phone),
    email: maskEmail(payload.email),
  });
};
