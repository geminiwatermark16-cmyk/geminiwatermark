const crypto = require('crypto');

const API_VERSION = '2025-01-01';
const PLAN_AMOUNT = 99;
const PLAN_CURRENCY = 'INR';
const PLAN_ID = 'video_99_30d';
const PLAN_DURATION_DAYS = 30;
const PLAN_DURATION_MS = PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000;

function configuredEnvironment() {
  return String(process.env.CASHFREE_ENV || 'sandbox').toLowerCase() === 'production'
    ? 'production'
    : 'sandbox';
}

function isSandbox() {
  return configuredEnvironment() === 'sandbox';
}

function baseUrlFor(environment) {
  return environment === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
}

function baseUrl() {
  return baseUrlFor(configuredEnvironment());
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

async function cashfreeRequestOnce(path, options, environment) {
  const { clientId, clientSecret } = credentials();
  const response = await fetch(`${baseUrlFor(environment)}${path}`, {
    ...options,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-api-version': API_VERSION,
      'x-client-id': clientId,
      'x-client-secret': clientSecret,
      ...(options?.headers || {}),
    },
  });

  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

  if (!response.ok) {
    const error = new Error(data?.message || data?.type || `Cashfree request failed (${response.status})`);
    error.status = response.status;
    error.cashfreeEnvironment = environment;
    throw error;
  }

  if (data && typeof data === 'object') {
    Object.defineProperty(data, '__cashfreeEnvironment', {
      value: environment,
      configurable: true,
      enumerable: false,
    });
  }
  return data;
}

async function cashfreeRequest(path, options = {}) {
  const primary = configuredEnvironment();
  try {
    return await cashfreeRequestOnce(path, options, primary);
  } catch (error) {
    if (error?.status !== 401) throw error;

    const alternate = primary === 'production' ? 'sandbox' : 'production';
    try {
      return await cashfreeRequestOnce(path, options, alternate);
    } catch (alternateError) {
      if (alternateError?.status === 401) {
        const authError = new Error('Cashfree rejected the configured Payment Gateway API credentials in both test and live environments.');
        authError.status = 401;
        authError.code = 'CASHFREE_AUTH_FAILED';
        throw authError;
      }
      throw alternateError;
    }
  }
}

function secret() {
  return process.env.CASHFREE_ENTITLEMENT_SECRET || process.env.CASHFREE_CLIENT_SECRET || '';
}

function toMs(value, fallback = Date.now()) {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function tokenSignature(encoded, key) {
  return crypto.createHmac('sha256', key).update(encoded).digest('base64url');
}

function signEntitlement(order, paidAtInput) {
  const key = secret();
  if (!key) throw new Error('Entitlement signing secret is missing.');
  const paidAt = toMs(paidAtInput || order?.created_at);
  const expiresAt = paidAt + PLAN_DURATION_MS;
  const customer = order?.customer_details || {};
  const payload = {
    v: 2,
    plan: PLAN_ID,
    orderId: order.order_id,
    cfOrderId: order.cf_order_id || null,
    amount: Number(order.order_amount),
    currency: order.order_currency,
    paidAt,
    expiresAt,
    phone: customer.customer_phone || '',
    email: customer.customer_email || '',
    customerId: customer.customer_id || '',
    iat: Date.now(),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${tokenSignature(encoded, key)}`;
}

function inspectEntitlementToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const key = secret();
  if (!key) return null;
  const [encoded, supplied] = token.split('.');
  if (!encoded || !supplied) return null;
  const expected = tokenSignature(encoded, key);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let raw;
  try { raw = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')); } catch { return null; }
  if (![1, 2].includes(raw?.v)) return null;
  if (Number(raw.amount) !== PLAN_AMOUNT || raw.currency !== PLAN_CURRENCY) return null;

  const legacyPlan = raw.v === 1 && raw.plan === 'video_99';
  const currentPlan = raw.v === 2 && raw.plan === PLAN_ID;
  if (!legacyPlan && !currentPlan) return null;

  const paidAt = Number(raw.paidAt) || Number(raw.iat);
  if (!Number.isFinite(paidAt) || paidAt <= 0) return null;
  const expiresAt = Number(raw.expiresAt) || (paidAt + PLAN_DURATION_MS);
  const active = Date.now() < expiresAt;

  return {
    ...raw,
    plan: PLAN_ID,
    paidAt,
    expiresAt,
    active,
    expired: !active,
    days: PLAN_DURATION_DAYS,
  };
}

function verifyEntitlementToken(token) {
  const payload = inspectEntitlementToken(token);
  return payload?.active ? payload : null;
}

function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 4 ? `••••••${digits.slice(-4)}` : '';
}

function maskEmail(email) {
  const value = String(email || '');
  const [name, domain] = value.split('@');
  if (!name || !domain) return '';
  return `${name.slice(0, 2)}•••@${domain}`;
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
  const message = error?.code === 'CASHFREE_NOT_CONFIGURED'
    ? 'Cashfree checkout is not configured yet.'
    : error?.code === 'CASHFREE_AUTH_FAILED'
      ? 'Cashfree Payment Gateway API keys are invalid or do not match this merchant account.'
      : (status >= 500 ? 'Payment service is temporarily unavailable.' : (error?.message || 'Payment request failed.'));
  res.status(status).json({ ok: false, error: message });
}

module.exports = {
  API_VERSION,
  PLAN_AMOUNT,
  PLAN_CURRENCY,
  PLAN_ID,
  PLAN_DURATION_DAYS,
  PLAN_DURATION_MS,
  configuredEnvironment,
  isSandbox,
  baseUrl,
  cashfreeRequest,
  signEntitlement,
  inspectEntitlementToken,
  verifyEntitlementToken,
  maskPhone,
  maskEmail,
  siteUrl,
  sendError,
};
