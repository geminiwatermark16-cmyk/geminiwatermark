const { query } = require('../lib/store');
function clean(value, max) { return String(value || '').trim().slice(0, max); }
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') return res.status(405).json({ok:false});
  const visitorId=clean(req.body?.visitorId,100), sessionId=clean(req.body?.sessionId,100);
  if(!visitorId||!sessionId) return res.status(400).json({ok:false});
  try{
    const path=clean(req.body?.path||'/',500), referrer=clean(req.body?.referrer,1000);
    const country=clean(req.headers['x-vercel-ip-country'],20), ua=clean(req.headers['user-agent'],500);
    await query('INSERT INTO gw_traffic_events(visitor_id,session_id,path,referrer,country,user_agent) VALUES($1,$2,$3,$4,$5,$6)',[visitorId,sessionId,path,referrer,country,ua]);
    return res.status(200).json({ok:true});
  }catch(error){
    if(error?.code==='STORAGE_NOT_CONFIGURED') return res.status(503).json({ok:false,code:error.code});
    console.error('traffic error',error); return res.status(500).json({ok:false});
  }
};
