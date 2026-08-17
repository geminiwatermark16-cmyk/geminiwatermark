const crypto = require('crypto');

const BOOTSTRAP_ADMIN_KEY_HASH = 'f9eb3e6f2c2711cc9a6fc3cf435c72d763153cf4c1a9dafe80adfc05f2e1d1d7';

function sha256(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function isAdminAuthorized(input) {
  const configured = String(process.env.ADMIN_DASHBOARD_KEY || '').trim();
  const expected = configured ? sha256(configured) : BOOTSTRAP_ADMIN_KEY_HASH;
  const supplied = sha256(input);
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { isAdminAuthorized };
