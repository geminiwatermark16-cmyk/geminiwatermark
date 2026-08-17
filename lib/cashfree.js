const crypto = require('crypto');

const API_VERSION = '2025-01-01';
const PLAN_AMOUNT = 99;
const PLAN_CURRENCY = 'INR';
const PLAN_ID = 'video_99';

function isSandbox() {
  return String(process.env.CASHFREE_ENV || 'sandbox').toLowerCase() !== 'production';
}

function baseUrl() {
  return isSandbox() ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg';
}

function credentials() {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const error = new Error('Cashfree is not configured on the server.');
    error.code = 'CASHFREE_NOT_CONFIGURED';
    throw error;
  }
  return { clientId, clientSecret };
}

async function cashfreeRequest(path, options = {}) {
  const { clientId, clientSecret } = credentials();
  const response = await fetch(`${baseUrl()}${path}`, {
    ...options,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-api-version': API_VERSION,
      'x-client-id': clientId,
      'x-client-secret': clientSecret,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!response.ok) {
    const error = new Error(data?.message || data?.type || `Cashfree request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function secret() {
  return process.env.CASHFREE_ENTITLEMENT_SECRET || process.env.CASHFREE_CLIENT_SECRET || '';
}

function signEntitlement(order) {
  const key = secret();
  if (!key) throw new Error('Entitlement signing secret is missing.');
  const payload = {
    v: 1,
    plan: PLAN_ID,
    orderId: order.order_id,
    amount: Number(order.order_amount),
    currency: order.order_currency,
    iat: Date.now(),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', key).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyEntitlementToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const key = secret();
  if (!key) return null;
  const [encoded, supplied] = token.split('.');
  if (!encoded || !supplied) return null;
  const expected = crypto.createHmac('sha256', key).update(encoded).digest('base64url');
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')); } catch { return null; }
  if (payload?.v !== 1 || payload?.plan !== PLAN_ID) return null;
  if (Number(payload.amount) !== PLAN_AMOUNT || payload.currency !== PLAN_CURRENCY) return null;
  return payload;
}

function siteUrl(req) {
  const configured = String(process.env.SITE_URL || '').trim().replace(/\/$/, '');
  if (configured) return configured;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || (String(host || '').includes('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}

function sendError(res, error) {
  console.error(error);
  const status = error?.code === 'CASHFREE_NOT_CONFIGURED' ? 503 : (error?.status >= 400 && error?.status < 600 ? error.status : 500);
  res.status(status).json({
    ok: false,
    error: error?.code === 'CASHFREE_NOT_CONFIGURED'
      ? 'Cashfree checkout is not configured yet.'
      : (status >= 500 ? 'Payment service is temporarily unavailable.' : (error?.message || 'Payment request failed.')),
  });
}

module.exports = { API_VERSION, PLAN_AMOUNT, PLAN_CURRENCY, PLAN_ID, isSandbox, cashfreeRequest, signEntitlement, verifyEntitlementToken, siteUrl, sendError };
