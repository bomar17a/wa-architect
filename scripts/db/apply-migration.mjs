/**
 * Applies a migration SQL file to the Supabase Postgres database and verifies the result.
 *
 * Usage:  node scripts/db/apply-migration.mjs <path-to-sql> [migration-version]
 *
 * Requires SUPABASE_DB_PASSWORD in the environment. Never hardcode the password here —
 * this file is committed. Runs inside a transaction, so a failure rolls back cleanly.
 *
 * This exists because `supabase db push` cannot run against this project: the migration
 * history has drifted (remote versions with no local file) and the CLI account lacks
 * CREATEROLE on cli_login_postgres. See IMPROVEMENT_NOTES.md.
 */
import { readFileSync } from 'fs';
import pg from 'pg';

const [sqlPath, version] = process.argv.slice(2);
if (!sqlPath) {
  console.error('usage: node scripts/db/apply-migration.mjs <path-to-sql> [migration-version]');
  process.exit(1);
}
if (!process.env.SUPABASE_DB_PASSWORD) {
  console.error('SUPABASE_DB_PASSWORD is not set in the environment.');
  process.exit(1);
}

const sql = readFileSync(sqlPath, 'utf8');

const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.jitzwwxsnpylaistotgq',
  password: process.env.SUPABASE_DB_PASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

const show = async (label, text, params) => {
  const r = await client.query(text, params);
  console.log(`${label}:`, JSON.stringify(r.rows));
  return r.rows;
};

try {
  await client.connect();
  console.log('connected');

  await client.query('BEGIN');
  await client.query(sql);
  await client.query('COMMIT');
  console.log(`applied: ${sqlPath}`);

  if (version) {
    await client.query(
      `INSERT INTO supabase_migrations.schema_migrations (version)
       VALUES ($1) ON CONFLICT (version) DO NOTHING`,
      [version]
    );
    console.log(`recorded migration version ${version}`);
  }
} catch (e) {
  try { await client.query('ROLLBACK'); } catch {}
  console.error('FAILED (rolled back):', e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
