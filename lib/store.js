const { Pool } = require('pg');

let pool;
let schemaPromise;

function databaseUrl() {
  return [
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_PRISMA_URL,
    process.env.DATABASE_URL,
    process.env.SUPABASE_DB_URL,
    process.env.SUPABASE_POSTGRES_URL,
  ].map((value) => String(value || '').trim()).find(Boolean) || '';
}

function storageConfigured() {
  return Boolean(databaseUrl());
}

function storageError() {
  const error = new Error('Shared database is not connected to the Vercel project.');
  error.code = 'STORAGE_NOT_CONFIGURED';
  error.status = 503;
  return error;
}

function connectionStringForPg() {
  const raw = databaseUrl();
  if (!raw) return '';

  // Supabase pooler URLs commonly include sslmode=require. With the current
  // pg connection-string parser that can become certificate verification and
  // fail inside a serverless runtime. Remove the URL-level mode so the
  // explicit encrypted SSL setting below is authoritative.
  try {
    const parsed = new URL(raw);
    parsed.searchParams.delete('sslmode');
    parsed.searchParams.delete('uselibpqcompat');
    return parsed.toString();
  } catch {
    return raw
      .replace(/([?&])sslmode=[^&]*(&?)/i, (_, lead, tail) => (lead === '?' && tail ? '?' : (tail ? lead : '')))
      .replace(/([?&])uselibpqcompat=[^&]*(&?)/i, (_, lead, tail) => (lead === '?' && tail ? '?' : (tail ? lead : '')))
      .replace(/[?&]$/, '');
  }
}

function getPool() {
  const url = connectionStringForPg();
  if (!url) throw storageError();
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 8000,
    });
  }
  return pool;
}

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const db = getPool();
      const client = await db.connect();
      const lockId = 18082026;
      try {
        // Different Vercel functions can cold-start at the same time. Serialize
        // the DDL so CREATE TABLE IF NOT EXISTS cannot race in PostgreSQL.
        await client.query('SELECT pg_advisory_lock($1)', [lockId]);
        await client.query(`
          CREATE TABLE IF NOT EXISTS gw_chat_threads (
            id TEXT PRIMARY KEY,
            visitor_id TEXT NOT NULL,
            name TEXT NOT NULL DEFAULT '',
            email TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE TABLE IF NOT EXISTS gw_chat_messages (
            id BIGSERIAL PRIMARY KEY,
            thread_id TEXT NOT NULL REFERENCES gw_chat_threads(id) ON DELETE CASCADE,
            sender TEXT NOT NULL,
            body TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE TABLE IF NOT EXISTS gw_traffic_events (
            id BIGSERIAL PRIMARY KEY,
            visitor_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            path TEXT NOT NULL DEFAULT '/',
            referrer TEXT NOT NULL DEFAULT '',
            country TEXT NOT NULL DEFAULT '',
            user_agent TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE TABLE IF NOT EXISTS gw_paid_orders (
            order_id TEXT PRIMARY KEY,
            cf_order_id TEXT NOT NULL DEFAULT '',
            customer_id TEXT NOT NULL DEFAULT '',
            phone TEXT NOT NULL DEFAULT '',
            email TEXT NOT NULL DEFAULT '',
            amount NUMERIC(12,2) NOT NULL,
            currency TEXT NOT NULL,
            paid_at TIMESTAMPTZ NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS gw_chat_threads_status_idx ON gw_chat_threads(status, last_message_at DESC);
          CREATE INDEX IF NOT EXISTS gw_chat_messages_thread_idx ON gw_chat_messages(thread_id, created_at ASC);
          CREATE INDEX IF NOT EXISTS gw_traffic_created_idx ON gw_traffic_events(created_at DESC);
          CREATE INDEX IF NOT EXISTS gw_traffic_visitor_idx ON gw_traffic_events(visitor_id, created_at DESC);
          CREATE INDEX IF NOT EXISTS gw_paid_orders_paid_idx ON gw_paid_orders(paid_at DESC);
          CREATE INDEX IF NOT EXISTS gw_paid_orders_customer_idx ON gw_paid_orders(customer_id, email, phone);
        `);
        return true;
      } finally {
        try { await client.query('SELECT pg_advisory_unlock($1)', [lockId]); } catch {}
        client.release();
      }
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

async function query(text, params = []) {
  await ensureSchema();
  return getPool().query(text, params);
}

async function recordPaidEntitlement(payload) {
  if (!payload?.orderId) return false;
  const paidAt = new Date(Number(payload.paidAt));
  const expiresAt = new Date(Number(payload.expiresAt));
  if (Number.isNaN(paidAt.getTime()) || Number.isNaN(expiresAt.getTime())) return false;

  await query(`
    INSERT INTO gw_paid_orders (
      order_id, cf_order_id, customer_id, phone, email,
      amount, currency, paid_at, expires_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
    ON CONFLICT (order_id) DO UPDATE SET
      cf_order_id = EXCLUDED.cf_order_id,
      customer_id = EXCLUDED.customer_id,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      amount = EXCLUDED.amount,
      currency = EXCLUDED.currency,
      paid_at = EXCLUDED.paid_at,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
  `, [
    String(payload.orderId),
    String(payload.cfOrderId || ''),
    String(payload.customerId || ''),
    String(payload.phone || ''),
    String(payload.email || ''),
    Number(payload.amount),
    String(payload.currency || '').toUpperCase(),
    paidAt.toISOString(),
    expiresAt.toISOString(),
  ]);
  return true;
}

module.exports = {
  databaseUrl,
  storageConfigured,
  storageError,
  ensureSchema,
  query,
  recordPaidEntitlement,
};
