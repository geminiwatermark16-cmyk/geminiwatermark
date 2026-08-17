const { query, storageError } = require('../lib/store');
const { isAdminAuthorized } = require('../lib/admin-auth');
module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store'); res.setHeader('X-Robots-Tag','noindex, nofollow');
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Method not allowed.'});
  if(!isAdminAuthorized(req.body?.adminKey)) return res.status(401).json({ok:false,error:'Invalid admin access key.'});
  try{
    const stats=await query(`SELECT
      COUNT(*) FILTER (WHERE created_at > NOW()-INTERVAL '24 hours')::int AS pv24,
      COUNT(DISTINCT visitor_id) FILTER (WHERE created_at > NOW()-INTERVAL '24 hours')::int AS uv24,
      COUNT(DISTINCT visitor_id) FILTER (WHERE created_at > NOW()-INTERVAL '7 days')::int AS uv7,
      COUNT(DISTINCT visitor_id) FILTER (WHERE created_at > NOW()-INTERVAL '30 days')::int AS uv30,
      COUNT(*) FILTER (WHERE created_at > NOW()-INTERVAL '30 days')::int AS pv30
      FROM gw_traffic_events`);
    const pages=await query(`SELECT path,COUNT(*)::int AS views FROM gw_traffic_events WHERE created_at>NOW()-INTERVAL '30 days' GROUP BY path ORDER BY views DESC LIMIT 8`);
    return res.status(200).json({ok:true,stats:stats.rows[0],topPages:pages.rows});
  }catch(error){
    console.error('admin traffic error',error);
    if(error?.code==='STORAGE_NOT_CONFIGURED') return res.status(503).json({ok:false,code:error.code,error:storageError().message});
    return res.status(500).json({ok:false,error:'Traffic data is temporarily unavailable.'});
  }
};
