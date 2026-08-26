import pg from 'pg';
const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 5432,
  user: 'postgres.jitzwwxsnpylaistotgq', password: process.env.SUPABASE_DB_PASSWORD,
  database: 'postgres', ssl: { rejectUnauthorized: false },
});
const q = async (label, text) => {
  const r = await client.query(text);
  console.log(`\n== ${label} ==`);
  r.rows.forEach(row => console.log(' ', JSON.stringify(row)));
  if (!r.rows.length) console.log('  (none)');
};
await client.connect();
await q('RLS enabled', `SELECT relrowsecurity FROM pg_class WHERE oid='public.profiles'::regclass`);
await q('policies', `SELECT cmd, policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles' ORDER BY cmd`);
await q('role grants on profiles', `SELECT grantee, string_agg(privilege_type, ',' ORDER BY privilege_type) AS privs
  FROM information_schema.role_table_grants
  WHERE table_schema='public' AND table_name='profiles' AND grantee IN ('anon','authenticated','service_role')
  GROUP BY grantee ORDER BY grantee`);
await q('compare: grants on activities (known-working table)', `SELECT grantee, string_agg(privilege_type, ',' ORDER BY privilege_type) AS privs
  FROM information_schema.role_table_grants
  WHERE table_schema='public' AND table_name='activities' AND grantee IN ('anon','authenticated','service_role')
  GROUP BY grantee ORDER BY grantee`);
await client.end();
