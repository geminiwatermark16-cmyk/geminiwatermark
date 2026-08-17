module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const candidates = {
    POSTGRES_URL: Boolean(process.env.POSTGRES_URL),
    POSTGRES_PRISMA_URL: Boolean(process.env.POSTGRES_PRISMA_URL),
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    SUPABASE_DB_URL: Boolean(process.env.SUPABASE_DB_URL),
    SUPABASE_POSTGRES_URL: Boolean(process.env.SUPABASE_POSTGRES_URL),
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
  return res.status(200).json({ ok: true, configured: Object.values(candidates).some(Boolean), candidates });
};
