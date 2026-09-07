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
    amount: 0,
    currency: plan.currency,
    displayPrice: 'Free',
    durationDays: 3650,
    requiresIndianPhone: false,
    requiresEmail: false,
    availablePlans: [
      { id: 'free', name: 'Free Forever Plan', amount: 0, currency: 'INR', displayPrice: 'Free', durationDays: 3650, description: 'Unlimited videos & images · 100% Free', popular: true },
    ],
  });
};
