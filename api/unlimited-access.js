const crypto = require('crypto');

const UNLIMITED_EMAILS = new Set([
  'hyydikshant@gmail.com',
  'meijinnn0@gmail.com',
]);

function entitlementSecret() {
  return process.env.CASHFREE_ENTITLEMENT_SECRET || process.env.CASHFREE_CLIENT_SECRET || '';
}

function signPayload(payload, key) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', key).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 120);
  if (!UNLIMITED_EMAILS.has(email)) {
    return res.status(403).json({ ok: false, error: 'This email does not have unlimited access.' });
  }

  const key = entitlementSecret();
  if (!key) {
    return res.status(503).json({ ok: false, error: 'Unlimited access is not configured on the server.' });
  }

  const now = Date.now();
  const identityHash = crypto.createHash('sha256').update(email).digest('hex').slice(0, 20);
  const payload = {
    v: 2,
    plan: 'video_99_30d',
    orderId: `unlimited_${identityHash}`,
    cfOrderId: null,
    amount: 99,
    currency: 'INR',
    paidAt: now,
    // Use the largest practical JavaScript date so the existing signed-plan
    // verifier keeps this account active without changing normal paid plans.
    expiresAt: 253402300799000,
    phone: '',
    email,
    customerId: `unlimited_${identityHash}`,
    iat: now,
  };

  return res.status(200).json({
    ok: true,
    unlimited: true,
    email,
    entitlementToken: signPayload(payload, key),
  });
};
