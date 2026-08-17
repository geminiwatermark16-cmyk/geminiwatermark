const crypto = require('crypto');
const { query, storageError } = require('../lib/store');

function clean(value, max) { return String(value || '').trim().slice(0, max); }
function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function id() { return `gwc_${crypto.randomUUID().replace(/-/g, '')}`; }

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed.' });
  const action = clean(req.body?.action || 'send', 20);
  const visitorId = clean(req.body?.visitorId, 100);
  const threadId = clean(req.body?.threadId, 100);
  if (!visitorId) return res.status(400).json({ ok:false, error:'Visitor session missing.' });

  try {
    if (action === 'poll') {
      if (!threadId) return res.status(200).json({ ok:true, thread:null, messages:[] });
      const thread = await query('SELECT id,name,email,status,created_at,updated_at,last_message_at FROM gw_chat_threads WHERE id=$1 AND visitor_id=$2', [threadId, visitorId]);
      if (!thread.rows[0]) return res.status(200).json({ ok:true, thread:null, messages:[] });
      const messages = await query('SELECT id,sender,body,created_at FROM gw_chat_messages WHERE thread_id=$1 ORDER BY created_at ASC LIMIT 100', [threadId]);
      return res.status(200).json({ ok:true, thread:thread.rows[0], messages:messages.rows });
    }

    const name = clean(req.body?.name, 100);
    const email = clean(req.body?.email, 254).toLowerCase();
    const message = clean(req.body?.message, 2000);
    if (!name || !validEmail(email) || !message) return res.status(400).json({ ok:false, error:'Name, valid email and message are required.' });

    let finalThreadId = threadId;
    if (finalThreadId) {
      const existing = await query('SELECT id,visitor_id FROM gw_chat_threads WHERE id=$1', [finalThreadId]);
      if (existing.rows[0] && existing.rows[0].visitor_id !== visitorId) return res.status(403).json({ ok:false, error:'Chat session mismatch.' });
      if (!existing.rows[0]) finalThreadId = '';
    }
    if (!finalThreadId) {
      finalThreadId = id();
      await query('INSERT INTO gw_chat_threads(id,visitor_id,name,email,status) VALUES($1,$2,$3,$4,$5)', [finalThreadId, visitorId, name, email, 'pending']);
    }

    const recent = await query("SELECT COUNT(*)::int AS n FROM gw_chat_messages WHERE thread_id=$1 AND sender='customer' AND created_at > NOW() - INTERVAL '60 seconds'", [finalThreadId]);
    if ((recent.rows[0]?.n || 0) >= 8) return res.status(429).json({ ok:false, error:'Too many messages. Please wait a minute.' });

    await query('INSERT INTO gw_chat_messages(thread_id,sender,body) VALUES($1,$2,$3)', [finalThreadId, 'customer', message]);
    await query("UPDATE gw_chat_threads SET name=$2,email=$3,status='pending',updated_at=NOW(),last_message_at=NOW() WHERE id=$1", [finalThreadId, name, email]);
    return res.status(200).json({ ok:true, threadId:finalThreadId, status:'pending' });
  } catch (error) {
    console.error('chat error', error);
    if (error?.code === 'STORAGE_NOT_CONFIGURED') return res.status(503).json({ ok:false, code:error.code, error:storageError().message });
    return res.status(500).json({ ok:false, error:'Live chat is temporarily unavailable.' });
  }
};
