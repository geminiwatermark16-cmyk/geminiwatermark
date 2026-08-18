const { PLAN_DURATION_DAYS, planForRequest } = require('../lib/cashfree');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const plan = planForRequest(req);
  return res.status(200).json({
    ok: true,
    country: plan.country,
    region: plan.region,
    amount: plan.amount,
    currency: plan.currency,
    displayPrice: plan.displayPrice,
    durationDays: PLAN_DURATION_DAYS,
    requiresIndianPhone: plan.requiresIndianPhone,
    requiresEmail: plan.requiresEmail,
  });
};
