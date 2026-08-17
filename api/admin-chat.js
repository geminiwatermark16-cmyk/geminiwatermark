const { query, storageError } = require('../lib/store');
const { isAdminAuthorized } = require('../lib/admin-auth');

function clean(value, max) { return String(value || '').trim().slice(0, max); }

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed.' });
  if (!isAdminAuthorized(req.body?.adminKey)) return res.status(401).json({ ok:false, error:'Invalid admin access key.' });
  const action = clean(req.body?.action || 'list', 20);
  const threadId = clean(req.body?.threadId, 100);

  try {
    if (action === 'reply') {
      const message = clean(req.body?.message, 2000);
      if (!threadId || !message) return res.status(400).json({ ok:false, error:'Thread and reply are required.' });
      const exists = await query('SELECT id FROM gw_chat_threads WHERE id=$1', [threadId]);
      if (!exists.rows[0]) return res.status(404).json({ ok:false, error:'Chat not found.' });
      await query('INSERT INTO gw_chat_messages(thread_id,sender,body) VALUES($1,$2,$3)', [threadId, 'admin', message]);
      await query("UPDATE gw_chat_threads SET status='replied',updated_at=NOW(),last_message_at=NOW() WHERE id=$1", [threadId]);
      return res.status(200).json({ ok:true });
    }
    if (action === 'close') {
      if (!threadId) return res.status(400).json({ ok:false, error:'Thread required.' });
      await query("UPDATE gw_chat_threads SET status='closed',updated_at=NOW() WHERE id=$1", [threadId]);
      return res.status(200).json({ ok:true });
    }

    const threads = await query(`SELECT t.id,t.name,t.email,t.status,t.created_at,t.updated_at,t.last_message_at,
      COALESCE((SELECT m.body FROM gw_chat_messages m WHERE m.thread_id=t.id ORDER BY m.created_at DESC LIMIT 1),'') AS latest_message
      FROM gw_chat_threads t ORDER BY t.last_message_at DESC LIMIT 100`);
    let messages = [];
    if (threadId) {
      const result = await query('SELECT id,sender,body,created_at FROM gw_chat_messages WHERE thread_id=$1 ORDER BY created_at ASC LIMIT 200', [threadId]);
      messages = result.rows;
    }
    return res.status(200).json({ ok:true, pendingCount:threads.rows.filter((t)=>t.status==='pending').length, threads:threads.rows, messages });
  } catch (error) {
    console.error('admin chat error', error);
    if (error?.code === 'STORAGE_NOT_CONFIGURED') return res.status(503).json({ ok:false, code:error.code, error:storageError().message });
    return res.status(500).json({ ok:false, error:'Chat inbox is temporarily unavailable.' });
  }
};
