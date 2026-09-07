const { PLAN_DURATION_DAYS, planForRequest } = require('../lib/cashfree');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const plan = planForRequest(req);
  const availablePlans = plan.region === 'india'
    ? [
        { id: 'single', name: 'Single Video Pass', amount: 29, currency: 'INR', displayPrice: '₹29', durationDays: 1, description: '1 video · 24-hr access' },
        { id: 'monthly', name: '30-Day Creator Pass', amount: 99, currency: 'INR', displayPrice: '₹99', durationDays: 30, description: 'Unlimited videos · 30 days', popular: true },
      ]
    : [
        { id: 'monthly', name: 'International Pass', amount: 1, currency: 'USD', displayPrice: '$1', durationDays: 30, description: 'Unlimited videos · 30 days', popular: true },
      ];

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
    availablePlans,
  });
};
