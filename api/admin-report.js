const crypto = require('crypto');
const {
  PLAN_AMOUNT,
  PLAN_CURRENCY,
  PLAN_DURATION_DAYS,
  PLAN_DURATION_MS,
  cashfreeRequest,
} = require('../lib/cashfree');

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

function first(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function iso(value) {
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function normalize(item) {
  const customer = item?.customer_details || {};
  const event = item?.event_details || {};
  const order = item?.order_details || item?.order || {};
  const payment = item?.payment_details || item?.payment || {};

  const orderId = String(first(
    order.order_id,
    item?.order_id,
    item?.merchant_order_id,
    event.order_id,
    payment.order_id,
  ) || '');

  const status = String(first(
    payment.payment_status,
    event.event_status,
    item?.payment_status,
    item?.event_status,
    item?.status,
  ) || '').toUpperCase();

  const eventType = String(first(event.event_type, item?.event_type, item?.type) || '').toUpperCase();
  const amount = Number(first(
    order.order_amount,
    payment.payment_amount,
    event.event_amount,
    item?.order_amount,
    item?.event_amount,
    item?.amount,
  ) || 0);

  const currency = String(first(
    order.order_currency,
    payment.payment_currency,
    event.event_currency,
    item?.order_currency,
    item?.event_currency,
    item?.currency,
  ) || '');

  const paidAt = iso(first(
    payment.payment_completion_time,
    payment.payment_time,
    event.event_time,
    item?.payment_completion_time,
    item?.payment_time,
    item?.event_time,
    item?.transaction_time,
    item?.tx_time,
    item?.created_at,
  ));

  return {
    orderId,
    status,
    eventType,
    amount,
    currency,
    paidAt,
    customerId: String(first(customer.customer_id, item?.customer_id) || ''),
    phone: String(first(customer.customer_phone, item?.customer_phone) || ''),
    email: String(first(customer.customer_email, item?.customer_email) || ''),
    name: String(first(customer.customer_name, item?.customer_name) || ''),
  };
}

async function fetchReconRange(startDate, endDate) {
  const all = [];
  let cursor = null;
  let environment = null;

  for (let page = 0; page < 8; page += 1) {
    const response = await cashfreeRequest('/recon', {
      method: 'POST',
      body: JSON.stringify({
        pagination: { limit: 50, cursor },
        filters: { start_date: startDate, end_date: endDate },
      }),
    });

    environment = response.__cashfreeEnvironment || environment;
    const rows = Array.isArray(response?.data) ? response.data : [];
    all.push(...rows);
    cursor = response?.cursor || null;
    if (!cursor || rows.length === 0) break;
  }

  return { rows: all, environment };
}

async function fetchRecon(startDate, endDate) {
  const startMs = Date.parse(startDate);
  const endMs = Date.parse(endDate);
  const rows = [];
  const failures = [];
  let environment = null;
  let chunks = 0;

  // Cashfree occasionally returns a generic processing error for larger windows.
  // Query smaller windows so one bad interval does not block the whole admin console.
  for (let chunkStart = startMs; chunkStart < endMs; chunkStart += 6 * DAY_MS) {
    chunks += 1;
    const chunkEnd = Math.min(chunkStart + (6 * DAY_MS) - 1, endMs);
    try {
      const part = await fetchReconRange(
        new Date(chunkStart).toISOString(),
        new Date(chunkEnd).toISOString(),
      );
      rows.push(...part.rows);
      environment = part.environment || environment;
    } catch (error) {
      if (error?.code === 'CASHFREE_AUTH_FAILED' || error?.status === 401) throw error;
      failures.push({
        status: Number(error?.status) || 0,
        message: String(error?.message || 'Cashfree reconciliation failed.'),
        environment: error?.cashfreeEnvironment || null,
      });
      console.error('Cashfree recon chunk failed', failures[failures.length - 1]);
    }
  }

  return { rows, environment, failures, chunks };
}

function trafficInfo() {
  return {
    provider: 'Vercel Web Analytics',
    dashboardUrl: 'https://vercel.com/geminiwatermarkgmailcom/geminiwatermark/analytics',
    note: 'Visitor, referrer, country and device traffic is available in Vercel Analytics once Web Analytics is enabled for the project.',
  };
}

function unavailableReport(start, end, warning, code = 'CASHFREE_RECON_UNAVAILABLE') {
  return {
    ok: true,
    dataAvailable: false,
    warning,
    code,
    range: { start: start.toISOString(), end: end.toISOString() },
    cashfree: { status: 'unavailable', environment: 'unknown' },
    summary: {
      paidOrders: null,
      clients: null,
      activePlans: null,
      expiredPlans: null,
      revenue: null,
      currency: PLAN_CURRENCY,
      plan: `₹${PLAN_AMOUNT} / ${PLAN_DURATION_DAYS} days`,
    },
    purchases: [],
    traffic: trafficInfo(),
  };
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
    const recon = await fetchRecon(start.toISOString(), end.toISOString());

    if (recon.failures.length === recon.chunks && recon.rows.length === 0) {
      return res.status(200).json(unavailableReport(
        start,
        end,
        'Admin access is working, but Cashfree reconciliation is temporarily unavailable. Payment totals are hidden until Cashfree responds successfully.',
      ));
    }

    const normalized = recon.rows.map(normalize).filter((row) =>
      row.orderId.startsWith('gw_')
      && row.amount === PLAN_AMOUNT
      && row.currency === PLAN_CURRENCY
      && (row.status === 'SUCCESS' || row.status === 'PAID')
    );

    const byOrder = new Map();
    for (const row of normalized) {
      const existing = byOrder.get(row.orderId);
      if (!existing || (!existing.paidAt && row.paidAt)) byOrder.set(row.orderId, row);
    }

    const purchases = [...byOrder.values()]
      .map((row) => {
        const paidMs = row.paidAt ? Date.parse(row.paidAt) : NaN;
        const expiresAt = Number.isFinite(paidMs) ? new Date(paidMs + PLAN_DURATION_MS).toISOString() : null;
        const active = expiresAt ? Date.parse(expiresAt) > Date.now() : false;
        return {
          ...row,
          plan: '₹99 Video — 30 days',
          expiresAt,
          active,
        };
      })
      .sort((a, b) => Date.parse(b.paidAt || 0) - Date.parse(a.paidAt || 0));

    const uniqueClients = new Set(
      purchases.map((row) => row.customerId || row.phone || row.email || row.orderId)
    );

    return res.status(200).json({
      ok: true,
      dataAvailable: true,
      warning: recon.failures.length
        ? 'Some Cashfree reconciliation intervals could not be loaded. The figures below may be partial.'
        : null,
      range: { start: start.toISOString(), end: end.toISOString() },
      cashfree: {
        status: recon.failures.length ? 'partial' : 'connected',
        environment: recon.environment || 'production',
      },
      summary: {
        paidOrders: purchases.length,
        clients: uniqueClients.size,
        activePlans: purchases.filter((row) => row.active).length,
        expiredPlans: purchases.filter((row) => !row.active).length,
        revenue: purchases.length * PLAN_AMOUNT,
        currency: PLAN_CURRENCY,
        plan: `₹${PLAN_AMOUNT} / ${PLAN_DURATION_DAYS} days`,
      },
      purchases: purchases.slice(0, 100),
      traffic: trafficInfo(),
    });
  } catch (error) {
    console.error(error);

    if (error?.code === 'CASHFREE_AUTH_FAILED' || error?.status === 401) {
      return res.status(200).json(unavailableReport(
        start,
        end,
        'Admin access is working, but Cashfree rejected the configured Payment Gateway API credentials. Update the Vercel Cashfree PG keys to restore payment statistics.',
        'CASHFREE_AUTH_FAILED',
      ));
    }

    return res.status(200).json(unavailableReport(
      start,
      end,
      'Admin access is working, but Cashfree reconciliation could not be loaded right now. Try Refresh again later.',
    ));
  }
};
