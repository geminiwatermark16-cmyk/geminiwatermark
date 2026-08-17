const { query } = require('../lib/store');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  if (req.method !== 'GET') return res.status(405).json({ ok: false });

  try {
    const result = await query(`
      SELECT
        COUNT(DISTINCT visitor_id)::int AS visitors,
        COUNT(*)::int AS pageviews
      FROM gw_traffic_events
    `);
    const row = result?.rows?.[0] || {};
    return res.status(200).json({
      ok: true,
      visitors: Number(row.visitors || 0),
      pageviews: Number(row.pageviews || 0),
    });
  } catch (error) {
    if (error?.code !== 'STORAGE_NOT_CONFIGURED') console.error('public stats error', error);
    return res.status(200).json({ ok: false, visitors: 0, pageviews: 0 });
  }
};
