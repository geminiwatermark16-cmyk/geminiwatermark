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

  // pg-connection-string currently treats sslmode=require as certificate
  // verification. Supabase pooler URLs commonly include sslmode=require while
  // presenting a managed certificate chain that is not available to the
  // serverless runtime. Remove only the URL-level SSL mode so the explicit
  // encrypted pg SSL config below is used consistently.
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
      await db.query(`
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
        CREATE INDEX IF NOT EXISTS gw_chat_threads_status_idx ON gw_chat_threads(status, last_message_at DESC);
        CREATE INDEX IF NOT EXISTS gw_chat_messages_thread_idx ON gw_chat_messages(thread_id, created_at ASC);
        CREATE INDEX IF NOT EXISTS gw_traffic_created_idx ON gw_traffic_events(created_at DESC);
        CREATE INDEX IF NOT EXISTS gw_traffic_visitor_idx ON gw_traffic_events(visitor_id, created_at DESC);
      `);
      return true;
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

module.exports = {
  databaseUrl,
  storageConfigured,
  storageError,
  ensureSchema,
  query,
};
