const crypto = require('crypto');
const {
  PLAN_DURATION_DAYS,
  planLabelFromPayment,
} = require('../lib/cashfree');
const { query } = require('../lib/store');

const BOOTSTRAP_ADMIN_KEY_HASH = 'f9eb3e6f2c2711cc9a6fc3cf435c72d763153cf4c1a9dafe80adfc05f2e1d1d7';
const DAY_MS = 24 * 60 * 60 * 1000;

function sha256(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function isAuthorized(input) {
  const configured = String(process.env.ADMIN_DASHBOARD_KEY || '').trim();
  const expected = configured ? sha256(configured) : BOOTSTRAP_ADMIN_KEY_HASH;
  const supplied = sha256(input);
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function revenueDisplay(purchases) {
  const totals = new Map();
  for (const row of purchases) {
    const currency = String(row.currency || '').toUpperCase();
    totals.set(currency, (totals.get(currency) || 0) + Number(row.amount || 0));
  }
  const parts = [];
  if (totals.has('INR')) parts.push(`₹${totals.get('INR').toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
  if (totals.has('USD')) parts.push(`$${totals.get('USD').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  for (const [currency, amount] of totals) {
    if (currency === 'INR' || currency === 'USD') continue;
    parts.push(`${currency} ${Number(amount).toLocaleString('en-US', { maximumFractionDigits: 2 })}`);
  }
  return parts.join(' + ') || '₹0';
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  if (!isAuthorized(req.body?.adminKey)) {
    return res.status(401).json({ ok: false, error: 'Invalid admin access key.' });
  }

  const end = new Date();
  const start = new Date(end.getTime() - (30 * DAY_MS));

  try {
    const result = await query(`
      SELECT
        order_id,
        cf_order_id,
        customer_id,
        phone,
        email,
        amount::float8 AS amount,
        currency,
        paid_at,
        expires_at
      FROM gw_paid_orders
      WHERE paid_at >= $1
      ORDER BY paid_at DESC
      LIMIT 100
    `, [start.toISOString()]);

    const purchases = (result.rows || []).map((row) => ({
      orderId: row.order_id,
      cfOrderId: row.cf_order_id,
      customerId: row.customer_id,
      name: '',
      phone: row.phone,
      email: row.email,
      amount: Number(row.amount),
      currency: row.currency,
      paidAt: new Date(row.paid_at).toISOString(),
      expiresAt: new Date(row.expires_at).toISOString(),
      active: new Date(row.expires_at).getTime() > Date.now(),
      plan: planLabelFromPayment(row.amount, row.currency),
    }));

    const uniqueClients = new Set(
      purchases.map((row) => row.customerId || row.phone || row.email || row.orderId)
    );

    return res.status(200).json({
      ok: true,
      dataAvailable: true,
      warning: purchases.length === 0
        ? 'No verified paid orders are stored yet. Existing signed purchases will appear automatically when the customer revisits the site or when the plan is checked again.'
        : null,
      range: { start: start.toISOString(), end: end.toISOString() },
      summary: {
        paidOrders: purchases.length,
        clients: uniqueClients.size,
        activePlans: purchases.filter((row) => row.active).length,
        expiredPlans: purchases.filter((row) => !row.active).length,
        revenue: purchases.reduce((sum, row) => row.currency === 'INR' ? sum + Number(row.amount || 0) : sum, 0),
        revenueDisplay: revenueDisplay(purchases),
        plan: `Regional video plan / ${PLAN_DURATION_DAYS} days`,
      },
      purchases,
      source: 'verified-order-ledger',
    });
  } catch (error) {
    console.error('admin report error', error);
    return res.status(200).json({
      ok: true,
      dataAvailable: false,
      warning: 'Admin access is working, but the verified payment ledger could not be loaded right now.',
      code: error?.code || 'LEDGER_UNAVAILABLE',
      range: { start: start.toISOString(), end: end.toISOString() },
      summary: {
        paidOrders: null,
        clients: null,
        activePlans: null,
        expiredPlans: null,
        revenue: null,
        revenueDisplay: '—',
        plan: `Regional video plan / ${PLAN_DURATION_DAYS} days`,
      },
      purchases: [],
    });
  }
};
